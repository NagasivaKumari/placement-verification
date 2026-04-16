import os
import base64
from algosdk.v2client import algod
from algosdk import mnemonic
from algosdk.transaction import ApplicationCreateTxn, StateSchema
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/.env'))
load_dotenv(backend_env_path)

ALGOD_TOKEN = os.getenv("ALGOD_TOKEN")
ALGOD_SERVER = os.getenv("ALGOD_SERVER")
ALGOD_PORT = os.getenv("ALGOD_PORT")
ALGOD_MNEMONIC = os.getenv("ALGOD_MNEMONIC")

private_key = mnemonic.to_private_key(ALGOD_MNEMONIC)
from algosdk.account import address_from_private_key
account_address = address_from_private_key(private_key)

# AlgodClient expects the token as a string
algod_address = f"{ALGOD_SERVER}:{ALGOD_PORT}"
algod_client = algod.AlgodClient(ALGOD_TOKEN, algod_address)


# Utility to read TEAL code (example for PlacementStudent)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
artifacts_dir = os.path.join(project_root, 'artifacts')
with open(os.path.join(artifacts_dir, "PlacementStudent.approval.teal")) as f:
    approval_program = f.read()
with open(os.path.join(artifacts_dir, "PlacementStudent.clear.teal")) as f:
    clear_program = f.read()

# Compile TEAL
approval_result = algod_client.compile(approval_program)
clear_result = algod_client.compile(clear_program)

global_schema = dict(num_uints=2, num_byte_slices=2)
local_schema = dict(num_uints=2, num_byte_slices=2)

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

signed_txn = txn.sign(private_key)
txid = algod_client.send_transaction(signed_txn)
print(f"Transaction ID: {txid}")

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
