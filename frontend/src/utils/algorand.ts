import * as algosdk from 'algosdk';
import { peraWallet } from '../wallet';

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const ALGOD_TOKEN = "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function signAndSendRegistration(sender, role) {
    if (!sender) throw new Error("Wallet address is missing. Please reconnect.");
    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Register:${role}`);
    
    // SDK V3 Native: Object-based builder is required for modern Pera Connect stability
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: String(sender).trim(),
        to: String(sender).trim(),
        amount: 0,
        note: note,
        suggestedParams: params
    });

    const singleTxnGroups = [{ txn: txn, signers: [String(sender).trim()] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}

export async function signAndSendPlacementClaim(sender, companyWallet, role, salary) {
    const s = String(sender).trim();
    const c = String(companyWallet).trim();

    // DEEP VALIDATION: Let the SDK verify the address format before we build the transaction
    try {
        algosdk.decodeAddress(s);
    } catch (e) {
        throw new Error(`Invalid Wallet Format: ${s.substring(0, 10)}... Please reconnect Pera Wallet.`);
    }
    
    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Claim:${c}:${role}:${salary}`);
    
    // Explicitly define the transaction to avoid V3 internal mapping issues
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: s,
        to: s,
        amount: 0,
        note: note,
        suggestedParams: params
    });

    const singleTxnGroups = [{ txn: txn, signers: [s] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}
