import os
import subprocess

CONTRACTS = [
    "PlacementStudent.puya",
    "PlacementCollege.puya",
    "PlacementCompany.puya",
    "PlacementProcess.puya"
]

CONTRACTS_DIR = "contracts"
BUILD_DIR = os.path.join(CONTRACTS_DIR, "build")
os.makedirs(BUILD_DIR, exist_ok=True)

for contract in CONTRACTS:
    contract_path = os.path.join(CONTRACTS_DIR, contract)
    out_path = os.path.join(BUILD_DIR, contract.replace('.puya', '.approval.teal'))
    print(f"Compiling {contract_path} -> {out_path}")
    subprocess.run([
        "puyapa", "compile", contract_path, "--out", out_path
    ], check=True)
print("All contracts compiled!")
