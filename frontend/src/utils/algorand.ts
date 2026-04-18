import * as algosdk from 'algosdk';
import { peraWallet } from '../wallet';

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const ALGOD_TOKEN = "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function signAndSendRegistration_V2(sender, role) {
    if (!sender) { window.alert("REGISTRATION ERROR: SENDER IS NULL"); throw new Error("Sender Address Missing"); }
    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Register:${role}`);
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: String(sender).trim(),
        receiver: String(sender).trim(),
        amount: 0,
        note: note,
        suggestedParams: params
    });

    const singleTxnGroups = [{ txn: txn, signers: [String(sender).trim()] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    let signedBlob: any = signedTxn;
    if (Array.isArray(signedTxn) && signedTxn.length > 0) signedBlob = signedTxn[0];
    const sendRes = await algodClient.sendRawTransaction(signedBlob).do();
    const txId = sendRes?.txId || sendRes?.txID || sendRes?.txid;
    console.log('TX SUBMIT RESPONSE (registration_v2):', sendRes, 'RESOLVED_TXID:', txId);
    if (!txId) throw new Error('TX_SUBMIT_ERROR: no txId returned from algod');
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}

export async function signAndSendPlacementClaim_V2(sender, companyWallet, role, salary) {
    const params = await algodClient.getTransactionParams().do();
    
    const senderAddress = sender;
    const receiverAddress = sender; 
    const suggestedParams = params;

    console.log("[DEBUG] signAndSendPlacementClaim_V2 CALL SITE:", { senderAddress, companyWallet, role, salary });

    // HARD GUARD: Stop dead if data flow integrity is compromised
    if (!senderAddress || !receiverAddress || !suggestedParams) {
        const miss = !senderAddress ? "FROM" : (!receiverAddress ? "TO" : "PARAMS");
        window.alert(`DATA INTEGRITY FAILURE: ${miss} IS MISSING AT RUNTIME`);
        throw new Error(`Data Flow Breach: ${miss} is undefined at transaction creation.`);
    }

    const note = new TextEncoder().encode(`CollegeTruth:Claim:${companyWallet}:${role}:${salary}`);
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: receiverAddress,
        amount: 0,
        note: note,
        suggestedParams: suggestedParams
    });

    const singleTxnGroups = [{ txn: txn, signers: [senderAddress] }];
    const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    let signedBlobFinal: any = signedTxn;
    if (Array.isArray(signedTxn) && signedTxn.length > 0) signedBlobFinal = signedTxn[0];
    const sendRes = await algodClient.sendRawTransaction(signedBlobFinal).do();
    const txId = sendRes?.txId || sendRes?.txID || sendRes?.txid;
    console.log('TX SUBMIT RESPONSE (placement_v2):', sendRes, 'RESOLVED_TXID:', txId);
    if (!txId) throw new Error('TX_SUBMIT_ERROR: no txId returned from algod');
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
}
