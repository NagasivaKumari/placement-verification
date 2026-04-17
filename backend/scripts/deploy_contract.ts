import * as algokit from '@algorandfoundation/algokit-utils';
import { ApplicationCreateTxn, StateSchema, makeApplicationCreateTxnFromObject, SuggestedParams } from 'algosdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function deployContracts() {
    // 1. Initialize standard AlgoKit Client for TestNet
    const algodClient = algokit.getAlgoClient({
        server: process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
        port: process.env.ALGOD_PORT || 443,
        token: process.env.ALGOD_TOKEN || '',
    });

    console.log("AlgoKit Client initialized. Connecting to TestNet...");

    // 2. Fetch the deployment account from environment mnemonics
    if (!process.env.ALGOD_MNEMONIC) {
        throw new Error("Missing ALGOD_MNEMONIC in environment variables!");
    }
    const deployer = await algokit.getAccount(
        { initialFunds: algokit.microAlgos(0) }, // Don't fund on testnet setup automatically
        algodClient
    );
    // Overwrite with actual mnemonic
    const account = algokit.mnemonicAccount(process.env.ALGOD_MNEMONIC);

    console.log(`\nDeployer Account Extracted: ${account.addr}`);

    // 3. Read TEAL contracts compiled by Puya
    const approvalPath = path.resolve(__dirname, '../../contracts/build/PlacementStudent.approval.teal');
    const clearPath = path.resolve(__dirname, '../../contracts/build/PlacementStudent.clear.teal');

    if (!fs.existsSync(approvalPath)) {
        throw new Error(`Cannot find compiled TEAL contracts! Make sure to run 'algokit build'.\nPath checked: ${approvalPath}`);
    }

    const approvalProgram = fs.readFileSync(approvalPath, 'utf8');
    const clearProgram = fs.readFileSync(clearPath, 'utf8');

    console.log("Compiling TEAL code via AlgoKit Utils...");
    const compiledApproval = await algodClient.compile(approvalProgram).do();
    const compiledClear = await algodClient.compile(clearProgram).do();

    // 4. Construct Transaction Parameters using AlgoKit
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txnObject = {
        from: account.addr,
        suggestedParams,
        onComplete: 0,
        approvalProgram: new Uint8Array(Buffer.from(compiledApproval.result, 'base64')),
        clearProgram: new Uint8Array(Buffer.from(compiledClear.result, 'base64')),
        numLocalInts: 2,
        numLocalByteSlices: 2,
        numGlobalInts: 2,
        numGlobalByteSlices: 2,
    };

    const txn = makeApplicationCreateTxnFromObject(txnObject);

    // 5. Sign and Send using AlgoKit
    console.log("Sending and confirming transaction on TestNet...");
    const signedTxn = txn.signTxn(account.sk);
    const result = await algodClient.sendRawTransaction(signedTxn).do();

    console.log(`Transaction Sent: ${result.txId}`);

    // Wait for confirmation securely
    const confirmation = await algokit.waitForConfirmation(result.txId, 4, algodClient);
    
    console.log("\n🚀 CONTRACT SUCCESSFULLY DEPLOYED TO TESTNET 🚀");
    console.log(`App ID: ${confirmation['application-index']}`);
}

deployContracts().catch(console.error);
