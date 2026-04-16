import os
from algosdk.v2client import algod
from algosdk import mnemonic
from algosdk.transaction import ApplicationCreateTxn
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../.env")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN")
ALGOD_SERVER = os.getenv("ALGOD_SERVER")
ALGOD_PORT = os.getenv("ALGOD_PORT")
ALGOD_MNEMONIC = os.getenv("ALGOD_MNEMONIC")


private_key = mnemonic.to_private_key(ALGOD_MNEMONIC)
from algosdk.account import address_from_private_key
account_address = address_from_private_key(private_key)

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

# Utility to read TEAL code
with open("../../contracts/build/PlacementStudent.approval.teal") as f:
    approval_program = f.read()
with open("../../contracts/build/PlacementStudent.clear.teal") as f:
    clear_program = f.read()


# Compile TEAL
import base64
approval_result = algod_client.compile(approval_program)
clear_result = algod_client.compile(clear_program)

# Define schema (example: 2 uints, 2 byte slices global/local)
global_schema = dict(num_uints=2, num_byte_slices=2)
local_schema = dict(num_uints=2, num_byte_slices=2)


# Create application transaction
from algosdk.future.transaction import StateSchema
params = algod_client.suggested_params()
txn = ApplicationCreateTxn(
    sender=account_address,
    sp=params,
    on_complete=0,  # NoOp
    approval_program=base64.b64decode(approval_result["result"]),
    clear_program=base64.b64decode(clear_result["result"]),
    global_schema=StateSchema(**global_schema),
    local_schema=StateSchema(**local_schema)
)

# Sign and send
signed_txn = txn.sign(private_key)
txid = algod_client.send_transaction(signed_txn)
print(f"Transaction ID: {txid}")

# Wait for confirmation
import time
def wait_for_confirmation(client, txid):
    last_round = client.status().get('last-round')
    while True:
        txinfo = client.pending_transaction_info(txid)
        if txinfo.get('confirmed-round', 0) > 0:
            print(f"Confirmed in round {txinfo['confirmed-round']}")
            return txinfo
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)

wait_for_confirmation(algod_client, txid)
print("Contract deployed!")
