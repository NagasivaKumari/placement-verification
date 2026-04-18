import * as algosdk from 'algosdk';
import { peraWallet } from '../wallet';

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const ALGOD_TOKEN = "";

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function signAndSendRegistration_FINAL(sender, role) {
    if (!sender) throw new Error("Sender Missing");
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
    // Pera returns an array of signed transaction blobs (Uint8Array) — pick the first
    // signed blob when submitting to algod. Also handle cases where the wallet returns
    // a single Uint8Array directly.
    let signedBlob: any = signedTxn;
    if (Array.isArray(signedTxn) && signedTxn.length > 0) {
        signedBlob = signedTxn[0];
    }

    try {
        const sendRes = await algodClient.sendRawTransaction(signedBlob).do();
        const txId = sendRes?.txId || sendRes?.txID || sendRes?.txid;
        console.log('TX SUBMIT RESPONSE:', sendRes, 'RESOLVED_TXID:', txId);
        if (!txId) throw new Error('TX_SUBMIT_ERROR: no txId returned from algod');
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        return txId;
    } catch (e: any) {
        console.error('TX SUBMISSION FAILED:', e);
        throw e;
    }
}

export async function signAndSendPlacementClaim_FINAL(sender, companyWallet, role, salary) {
    // HARD LOGGING
    console.log("FINAL_ENGINE_TRIGGERED");
    console.log("SENDER:", sender);
    console.log("COMPANY:", companyWallet);

    if (!sender) throw new Error("ADDRESS_ERROR: Sender is null at engine entry.");

    const senderAddr = String(sender).trim();
    if (!algosdk.isValidAddress(senderAddr)) {
        throw new Error(`ADDRESS_ERROR: Invalid sender address: ${String(sender)}`);
    }

    // If a company wallet is provided, require it to be a valid Algorand address.
    // Do not silently fall back — fail fast so callers can correct input.
    let toAddr = senderAddr;
    if (companyWallet !== undefined && companyWallet !== null && String(companyWallet).trim() !== '') {
        const maybeCompany = String(companyWallet).trim();
        if (!algosdk.isValidAddress(maybeCompany)) {
            throw new Error(`COMPANY_ADDRESS_INVALID: Provided company wallet is not a valid Algorand address: ${companyWallet}`);
        }
        toAddr = maybeCompany;
    }

    const params = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(`CollegeTruth:Claim:${companyWallet}:${role}:${salary}`);

    // Extra runtime checks and logging to help diagnose SDK errors
    console.log("TX PREPARE -> senderAddr:", senderAddr, "len:", senderAddr?.length);
    console.log("TX PREPARE -> toAddr:", toAddr, "len:", toAddr?.length);
    console.log("TX PREPARE -> suggestedParams:", !!params, params?.fee, params?.firstRound, params?.lastRound);

    if (!senderAddr || senderAddr.length === 0) {
        throw new Error(`ADDRESS_ERROR: Prepared sender address is empty or invalid: ${String(senderAddr)}`);
    }
    if (!toAddr || toAddr.length === 0) {
        throw new Error(`ADDRESS_ERROR: Prepared recipient address is empty or invalid: ${String(toAddr)}`);
    }

    // Catch literal string values 'null' or 'undefined' which often come from incorrect serialization
    const badLiteral = (s: any) => s === 'null' || s === 'undefined' || s === null || s === undefined;
    if (badLiteral(senderAddr) || typeof senderAddr !== 'string') {
        console.error('BAD SENDER ADDR (raw):', { raw: sender, type: typeof sender, json: JSON.stringify(sender) });
        throw new Error(`ADDRESS_ERROR: Sender address invalid literal: ${String(senderAddr)}`);
    }
    if (badLiteral(toAddr) || typeof toAddr !== 'string') {
        console.error('BAD TO ADDR (raw):', { raw: companyWallet, type: typeof companyWallet, json: JSON.stringify(companyWallet) });
        throw new Error(`ADDRESS_ERROR: Recipient address invalid literal: ${String(toAddr)}`);
    }

    console.log('TX PREPARE -> JSON senderAddr:', JSON.stringify(senderAddr));
    console.log('TX PREPARE -> JSON toAddr:', JSON.stringify(toAddr));

    let txn;
    try {
        console.log('FULL PARAMS (raw):', params);
        console.log('PARAMS KEYS:', Object.keys(params || {}));
        console.log('PARAMS TYPES:', {
            fee: typeof params?.fee,
            firstValid: typeof params?.firstValid,
            lastValid: typeof params?.lastValid,
            genesisID: typeof params?.genesisID,
            genesisHash: typeof params?.genesisHash
        });

        // Preferred approach: use the original params (which include BigInt values)
        // but ensure the SDK sees the expected key names: firstRound/lastRound
        const sdkSuggestedFallback: any = {
            ...params,
            firstRound: params?.firstValid ?? params?.firstRound,
            lastRound: params?.lastValid ?? params?.lastRound,
            fee: params?.fee ?? params?.minFee
        };

        console.log('SDK SUGGESTED PARAMS (fallback):', sdkSuggestedFallback);

        let sdkSuggested = sdkSuggestedFallback;
        try {
            if (typeof algosdk.suggestedParamsFrom === 'function') {
                sdkSuggested = algosdk.suggestedParamsFrom(sdkSuggestedFallback);
            }
        } catch (e) {
            console.warn('suggestedParamsFrom() failed, using raw fallback params', e);
            sdkSuggested = sdkSuggestedFallback;
        }

        // Final sanity: ensure addresses are strings
        const finalFrom = String(senderAddr);
        const finalTo = String(toAddr);

        txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: finalFrom,
            receiver: finalTo,
            amount: 0,
            note: note,
            suggestedParams: sdkSuggested
        });
        } catch (err) {
        console.error('TX BUILD FAILED. CONTEXT ->', {
            senderAddr,
            toAddr,
            senderType: typeof senderAddr,
            toType: typeof toAddr,
            paramsSnapshot: params,
            sdkSuggested,
            paramsKeys: Object.keys(params || {})
        });
        console.error('TX BUILD ERROR ->', err);

        // Diagnostic: try removing each normalized param to see which one triggers the SDK error
        try {
            const diagResults: Record<string, string> = {};
            for (const k of Object.keys(normalizedParams)) {
                const testParams = { ...normalizedParams };
                delete testParams[k];
                try {
                    algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                        sender: String(senderAddr),
                        receiver: String(toAddr),
                        amount: 0,
                        note: note,
                        suggestedParams: testParams
                    });
                    diagResults[k] = 'OK';
                } catch (e2) {
                    diagResults[k] = `ERR: ${e2?.message || String(e2)}`;
                }
            }
            console.error('PARAM DIAGNOSTICS ->', diagResults);
        } catch (e) {
            console.error('PARAM DIAGNOSTICS FAILED ->', e);
        }

        throw err;
    }

    const singleTxnGroups = [{ txn: txn, signers: [senderAddr] }];

    let signedTxn;
    try {
        // IMPORTANT: do NOT auto-trigger `connect()` during signing — that can open a blank
        // deep-link tab on desktop when the perawallet scheme is unhandled. Instead, only
        // attempt to restore an existing session here; require the user to explicitly
        // "Connect" via the UI if no session exists.
        try {
            const { tryRestorePeraSession } = await import('../wallet');
            const accounts = await tryRestorePeraSession().catch(() => []);
            if (!accounts || accounts.length === 0) {
                throw new Error('WALLET_SIGN_ERROR: No active Pera session. Please open the app and press Connect before signing.');
            }
        } catch (e) {
            console.warn('Pera restore session failed or was skipped:', e?.message || e);
            throw new Error('WALLET_SIGN_ERROR: No active Pera session. Please open the app and press Connect before signing.');
        }

        signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
    } catch (err: any) {
        console.error("Wallet signing failed:", err);
        throw new Error(`WALLET_SIGN_ERROR: ${err?.message || String(err)}`);
    }

    // Normalize signed txn from Pera (array or single blob) and submit robustly
    let signedBlobFinal: any = signedTxn;
    if (Array.isArray(signedTxn) && signedTxn.length > 0) signedBlobFinal = signedTxn[0];

    try {
        const sendRes = await algodClient.sendRawTransaction(signedBlobFinal).do();
        const txId = sendRes?.txId || sendRes?.txID || sendRes?.txid;
        console.log('TX SUBMIT RESPONSE:', sendRes, 'RESOLVED_TXID:', txId);
        if (!txId) throw new Error('TX_SUBMIT_ERROR: no txId returned from algod');
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        return txId;
    } catch (e: any) {
        console.error('TX SUBMISSION FAILED:', e);
        throw e;
    }
}
