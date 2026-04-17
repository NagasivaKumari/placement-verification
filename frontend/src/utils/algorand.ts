import algosdk from 'algosdk';
import { peraWallet } from '../wallet';

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const ALGOD_TOKEN = "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function signAndSendRegistration(sender, role) {
    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Register:${role}`);
    
    // Create a 0-ALGO payment to self to anchor the note/identity on-chain
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: sender,
        to: sender,
        amount: 0,
        suggestedParams: params,
        note: note
    });

    const singleTxnGroups = [{ txn: txn, signers: [sender] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}

export async function signAndSendPlacementClaim(sender, companyWallet, role, salary) {
    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Claim:${role}:${salary}`);
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: sender,
        to: companyWallet, // Send 0.001 ALGO to company as a 'notification' or just 0
        amount: 1000, 
        suggestedParams: params,
        note: note
    });

    const singleTxnGroups = [{ txn: txn, signers: [sender] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}
