import os
import asyncio
import hashlib
from datetime import datetime
from algosdk.v2client.algod import AlgodClient
from algosdk.transaction import PaymentTxn
from algosdk import mnemonic, account, transaction as algotrans
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
ALGOD_SERVER = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")


async def run_once(limit: int = 20):
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client["placement-db"]

    items = await db["placements"].find({"status": "offer_signed_offchain"}).sort("signedAt", 1).limit(limit).to_list(length=limit)
    if not items:
        print("[worker] No pending off-chain signed placements found.")
        return None

    entries = []
    for p in items:
        v = p.get("verificationCode") or ""
        ipfs = p.get("ipfsCid") or ""
        signer = p.get("signerWallet") or ""
        entries.append(f"{v}|{ipfs}|{signer}")

    entries.sort()
    payload = "||".join(entries)
    anchor_hash = hashlib.sha256(payload.encode()).hexdigest()

    # Relayer account
    foundation_mnemonic = os.getenv("ALGOD_MNEMONIC")
    if not foundation_mnemonic:
        print("[worker] ALGOD_MNEMONIC not set; cannot send anchor txn.")
        return None

    sk = mnemonic.to_private_key(foundation_mnemonic)
    addr = account.address_from_private_key(sk)

    algod = AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)
    try:
        params = algod.suggested_params()
        note = f"CollegeTruth Anchor:{anchor_hash}".encode()
        txn = PaymentTxn(sender=addr, sp=params, receiver=addr, amt=0, note=note)
        stxn = txn.sign(sk)
        txid = algod.send_transaction(stxn)
        print(f"[worker] Anchor tx sent: {txid}")
        algotrans.wait_for_confirmation(algod, txid, 4)
        print(f"[worker] Anchor tx confirmed: {txid}")
    except Exception as e:
        print(f"[worker] Failed to send anchor tx: {e}")
        return None

    # Update DB and events
    for p in items:
        await db["placements"].update_one({"_id": p["_id"]}, {"$set": {"status": "offer_signed_onchain", "anchorTx": txid, "anchorHash": anchor_hash, "anchoredAt": datetime.utcnow()}})
        await db["placement_events"].insert_one({"placementId": p["_id"], "event": "anchored", "anchorTx": txid, "anchorHash": anchor_hash, "createdAt": datetime.utcnow()})

    return {"txid": txid, "anchor_hash": anchor_hash, "count": len(items)}


async def run_loop(interval: int = 30):
    print("[worker] Starting batch worker loop. Ctrl-C to stop.")
    try:
        while True:
            res = await run_once()
            if res:
                print(f"[worker] Anchored {res.get('count')} placements in tx {res.get('txid')}")
            await asyncio.sleep(interval)
    except asyncio.CancelledError:
        print("[worker] Cancelled.")


if __name__ == '__main__':
    try:
        asyncio.run(run_loop())
    except KeyboardInterrupt:
        print("[worker] Stopped by user.")
