import os
from pathlib import Path
from dotenv import load_dotenv
import algokit_utils
from algosdk.v2client.algod import AlgodClient
from algosdk.transaction import SuggestedParams
import base64

load_dotenv(Path(__file__).parent.parent.parent / '.env')

def deploy_contracts():
    print("Initializing AlgoKit Client...")
    
    server = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
    port = os.getenv("ALGOD_PORT", "443")
    token = os.getenv("ALGOD_TOKEN", "")
    mnemonic = os.getenv("ALGOD_MNEMONIC")
    
    if not mnemonic:
        raise ValueError("ALGOD_MNEMONIC not set in .env")
        
    algod_client = AlgodClient(token, server)
    account = algokit_utils.get_account_from_mnemonic(mnemonic)
    print(f"Deployer Account: {account.address}")
    
    approval_path = Path(__file__).parent.parent.parent / "contracts" / "build" / "PlacementStudent.approval.teal"
    clear_path = Path(__file__).parent.parent.parent / "contracts" / "build" / "PlacementStudent.clear.teal"
    
    if not approval_path.exists():
        raise FileNotFoundError(f"Cannot find compiled TEAL contracts! Path checked: {approval_path}")
        
    print("Compiling TEAL code...")
    with open(approval_path, "r") as f:
        compiled_approval = algod_client.compile(f.read())
    with open(clear_path, "r") as f:
        compiled_clear = algod_client.compile(f.read())
        
    print("Sending and confirming transaction on TestNet...")
    sp = algod_client.suggested_params()
    
    from algosdk.transaction import ApplicationCreateTxn, StateSchema
    
    txn = ApplicationCreateTxn(
        sender=account.address,
        sp=sp,
        on_complete=0,
        approval_program=base64.b64decode(compiled_approval['result']),
        clear_program=base64.b64decode(compiled_clear['result']),
        global_schema=StateSchema(num_uints=2, num_byte_slices=2),
        local_schema=StateSchema(num_uints=2, num_byte_slices=2)
    )
    
    signed_txn = txn.sign(account.private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Transaction Sent: {txid}")
    
    import algosdk
    confirmation = algosdk.transaction.wait_for_confirmation(algod_client, txid, 4)
    print("\n🚀 CONTRACT SUCCESSFULLY DEPLOYED TO TESTNET 🚀")
    print(f"App ID: {confirmation.get('application-index')}")

if __name__ == "__main__":
    deploy_contracts()
