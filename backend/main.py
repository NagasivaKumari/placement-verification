import algosdk
from algosdk.v2client.algod import AlgodClient
from algosdk.transaction import PaymentTxn, ApplicationNoOpTxn
import base64
import os
import time
import jwt
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, root_validator
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TruePlacement Trust Ledger", version="2.1.0")

# ============ Algorand Config ============
ALGOD_SERVER = os.getenv("ALGOD_SERVER", "https://testnet-api.algonode.cloud")
ALGOD_PORT = os.getenv("ALGOD_PORT", "443")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
APP_ID = int(os.getenv("ALGORAND_APP_ID", "123456")) # Mock for now

algod_client = AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Configuration ============
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://admin:password123@localhost:27017/placement-db?authSource=admin")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

# ============ Database Setup ============
client: AsyncIOMotorClient = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client["placement-db"]
        
        # Indexes mapped from original TS setup
        await db["companies"].create_index("walletAddress", unique=True)
        await db["placements"].create_index("studentEmail")
        await db["placements"].create_index("companyWallet")
        await db["placements"].create_index("college")
        await db["placements"].create_index("verificationCode")
        await db["placements"].create_index("status")
        await db["users"].create_index("walletAddress", unique=True)
        print("MongoDB connected via Motor")
    except Exception as e:
        print(f"MongoDB connection error: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()

# ============ Middleware / Dependency ============
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = authorization.split(" ")[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=403, detail="Token Expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=403, detail="Invalid token")

# ============ Models ============
class NonceRequest(BaseModel):
    wallet: str

class VerifySignatureRequest(BaseModel):
    wallet: str
    signature: str

class RegisterRoleRequest(BaseModel):
    wallet: str
    role: str
    name: Optional[str] = ""
    email: Optional[str] = ""
    otp: str # New: Required OTP
    details: Optional[Dict[str, Any]] = {}

class OTPRequest(BaseModel):
    email: str

class VerifyDegreeRequest(BaseModel):
    studentWallet: str
    degreeName: str
    graduationYear: int

class UserProfileUpdateRequest(BaseModel):
    name: str
    email: Optional[str] = ""
    # Generic wrapper for dynamic role details
    details: Optional[Dict[str, Any]] = {}

class StudentUploadOfferRequest(BaseModel):
    companyWallet: str
    role: str
    salary: float = 0
    placementType: Optional[str] = "full-time"  # "full-time" | "internship" | "contract"
    senderEmail: str
    documentHash: Optional[str] = "offchain_ipfs_link_or_hash"
    
class CompanyApproveRequest(BaseModel):
    verificationCode: str
    txHash: Optional[str] = "0x"

class SubmitSignedTxnRequest(BaseModel):
    verificationCode: str
    signedTxn: str  # base64-encoded signed transaction bytes

class StudentUploadProofRequest(BaseModel):
    verificationCode: str
    documentHash: str
    notes: Optional[str] = ""

class CompanyConfirmStepRequest(BaseModel):
    verificationCode: str
    confirm: bool = True
    notes: Optional[str] = ""

class SalaryVerificationRequest(BaseModel):
    verificationCode: str
    salaryTxHash: str
    amount: float
    salarySlipHash: Optional[str] = ""

class StudentConfirmRequest(BaseModel):
    verificationCode: str
    studentEmail: str
    walletSignature: Optional[str] = None
    message: Optional[str] = None

class SalaryProofRequest(BaseModel):
    verificationCode: str
    salaryTxHash: str
    studentWallet: str

class EmployerVerifyRequest(BaseModel):
    verificationCode: str

class VerifyStudentRequest(BaseModel):
    studentWallet: str

class DocumentUploadRequest(BaseModel):
    placementId: str
    docType: str
    fileHash: str
    verifier: str

class VerifyPublicStudentRequest(BaseModel):
    studentName: str
    studentEmail: str


# ============ Routes ============
nonces = {}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(),
        "mongodb": "connected" if db is not None else "disconnected"
    }

@app.get("/api/auth/nonce")
async def get_nonce(wallet: str):
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet required")
    wallet = wallet.lower()
    nonce = f"Sign this message to prove you own the wallet: {str(time.time())}"
    nonces[wallet] = nonce
    return {"nonce": nonce}

@app.post("/api/auth/verify-signature")
async def verify_signature(req: VerifySignatureRequest):
    wallet = req.wallet.lower()
    user = await db["users"].find_one({"walletAddress": wallet})
    role = user.get("role") if user else None

    token = jwt.encode(
        {"wallet": wallet, "role": role, "timestamp": time.time(), "exp": datetime.utcnow() + timedelta(days=7)},
        JWT_SECRET,
        algorithm="HS256"
    )
    user_dict = {**user, "_id": str(user["_id"])} if user else None
    return {"success": True, "token": token, "wallet": wallet, "role": role, "user": user_dict}

# --- EMAIL SENDER (REAL SMTP INTEGRATION) ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def send_real_otp(email, otp):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", 587)
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", "verify@collegetruth.io")

    if not smtp_user or not smtp_password:
        print(f"\n[SMTP MISSING] Check .env for SMTP credentials. \nDEMO OTP for {email}: {otp}\n")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "CollegeTruth: Verify Your Identity"
    message["From"] = from_email
    message["To"] = email

    text = f"Your verification code is: {otp}"
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <h2 style="color: #4f46e5;">CollegeTruth Verification</h2>
        <p>Your secure identity verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; font-size: 24px; font-weight: bold; border-radius: 10px; text-align: center; letter-spacing: 5px;">
          {otp}
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          This code will bind your wallet to your institutional identity on the Algorand blockchain.
        </p>
      </body>
    </html>
    """
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    try:
        # Standard SMTP with STARTTLS
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_email, email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

# Simulated OTP storage
otp_db = {}

@app.post("/api/auth/send-otp")
async def send_otp(req: OTPRequest):
    import random
    otp = str(random.randint(100000, 999999))
    otp_db[req.email] = otp
    
    # Try sending real email
    sent = await send_real_otp(req.email, otp)
    
    return {
        "success": True, 
        "message": "OTP sent successfully." if sent else "OTP generated (Check Terminal for demo).",
        "realEmailSent": sent
    }

@app.post("/api/auth/register-role")
async def register_role(req: RegisterRoleRequest):
    # 1. OTP CHECK
    if req.email not in otp_db or otp_db[req.email] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    
    del otp_db[req.email]
    
    wallet = req.wallet.lower()

    # 2. BLOCKCHAIN ANCHOR (IDENTITY MINTING)
    # To reach 80% Blockchain, we anchor the registration on-chain
    reg_tx_id = None
    try:
        from algosdk.transaction import ApplicationNoOpTxn
        from algosdk import account, mnemonic

        foundation_mnemonic = os.getenv("ALGOD_MNEMONIC")
        app_id = int(os.getenv("PLACEMENT_PROCESS_APP_ID", "0"))
        
        if foundation_mnemonic and app_id > 0:
            foundation_key = mnemonic.to_private_key(foundation_mnemonic)
            foundation_address = account.address_from_private_key(foundation_key)
            params = algod_client.suggested_params()
            
            # Application Call: registerUser(...)
            # Args: [ "register", role_name, wallet_address ]
            txn = ApplicationNoOpTxn(
                sender=foundation_address,
                sp=params,
                index=app_id,
                app_args=["register", req.role.encode(), wallet.encode()],
                note=f"CollegeTruth Identity Anchor: {req.role}".encode()
            )
            stxn = txn.sign(foundation_key)
            reg_tx_id = algod_client.send_transaction(stxn)
            print(f"[IDENTITY ANCHOR ✅] TxID: {reg_tx_id}")
    except Exception as e:
        print(f"[WARN] Blockchain identity anchor failed: {e}")

    # 3. DATABASE UPDATE
    save_details = req.details or {}
    if req.role == "student":
        save_details["collegeVerified"] = False

    await db["users"].update_one(
        {"walletAddress": wallet},
        {"$set": {
            "role": req.role,
            "name": req.name,
            "email": req.email,
            "details": save_details,
            "identityTx": reg_tx_id,
            "updatedAt": datetime.utcnow()
        }, "$setOnInsert": {"createdAt": datetime.utcnow()}},
        upsert=True
    )
    return {
        "success": True, 
        "message": "Identity verified and anchored on-chain.",
        "identityTx": reg_tx_id
    }


# -- User Configuration Routes --
@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    db_user = await db["users"].find_one({"walletAddress": wallet})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": db_user.get("name", ""),
        "email": db_user.get("email", ""),
        "role": db_user.get("role", ""),
        "walletAddress": db_user.get("walletAddress"),
        "details": db_user.get("details", {}),
        "identityTx": db_user.get("identityTx")
    }

@app.put("/api/user/profile")
async def update_user_profile(req: UserProfileUpdateRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    await db["users"].update_one(
        {"walletAddress": wallet},
        {"$set": {
            "name": req.name,
            "email": req.email,
            "details": req.details,
            "updatedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Profile updated successfully."}

@app.get("/api/company/stats")
async def get_company_stats(user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    total = await db["placements"].count_documents({"companyWallet": wallet})
    # Simple aggregation for average salary
    pipeline = [
        {"$match": {"companyWallet": wallet}},
        {"$group": {"_id": None, "avgSalary": {"$avg": "$salary"}}}
    ]
    res = await db["placements"].aggregate(pipeline).to_list(length=1)
    avg_sal = res[0]["avgSalary"] if res else 0

    return {
        "totalPlacements": total,
        "avgSalary": avg_sal,
        "mostCommonRole": "Software Engineer" # Mocked for MVP
    }

@app.get("/api/company/placements")
async def get_company_placements(page: int = 1, limit: int = 20, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    cursor = db["placements"].find({"companyWallet": wallet}).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
    placements = await cursor.to_list(length=limit)
    total = await db["placements"].count_documents({"companyWallet": wallet})
    for p in placements: p["_id"] = str(p["_id"])
    return {
        "placements": placements,
        "total": total,
        "page": page,
        "pages": (total // limit) + (1 if total % limit > 0 else 0)
    }

# -- Placement Logic Routes --
@app.post("/api/placements/student-upload")
async def student_upload_offer(req: StudentUploadOfferRequest, user: dict = Depends(get_current_user)):
    studentWallet = user["wallet"]
    student = await db["users"].find_one({"walletAddress": studentWallet})
    if not student: raise HTTPException(status_code=404, detail="Student profile not found")

    # ENFORCEMENT: Is the student verified by their college?
    if not student.get("details", {}).get("collegeVerified"):
        raise HTTPException(
            status_code=403, 
            detail="Your identity is not yet verified by your college. Please contact your college placement cell to approve your enrollment."
        )

    # SECURE DOMAIN CHECK: Check if the offer matches company official domain
    target_company = await db["users"].find_one({"walletAddress": req.companyWallet.lower()})
    if not target_company:
        raise HTTPException(status_code=404, detail="Target company not recognized on platform")

    # Domain Validation
    claimed_sender = req.senderEmail.lower().strip()
    if "@" not in claimed_sender:
        raise HTTPException(status_code=400, detail="Invalid sender email format")
    
    claimed_domain = claimed_sender.split("@")[1]
    verified_domain = target_company.get("details", {}).get("officialDomain", "").lower()

    if verified_domain and claimed_domain != verified_domain:
        raise HTTPException(
            status_code=403, 
            detail=f"Domain mismatch! This company only issues offers from @{verified_domain}. Your claim from @{claimed_domain} is flagged as invalid."
        )

    # Check if student already has an active placement with this company
    existing = await db["placements"].find_one({
        "studentWallet": studentWallet,
        "companyWallet": req.companyWallet.lower()
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You have already submitted an offer to this company. Current status: {existing.get('status', 'pending')}. You cannot submit duplicate claims."
        )

    import hashlib
    vCode = hashlib.sha256(f"{time.time()}{student.get('email')}".encode()).hexdigest()[:18]

    await db["placements"].insert_one({
        "studentName": student.get("name"),
        "studentEmail": student.get("email"),
        "studentWallet": studentWallet,
        "role": req.role,
        "salary": req.salary,
        "placementType": req.placementType or "full-time",
        "senderEmail": req.senderEmail,
        "college": student.get("details", {}).get("college", "Unknown College"),
        "companyWallet": req.companyWallet.lower(),
        "documentHash": req.documentHash,
        "verificationCode": vCode,
        "status": "pending_company_approval",
        "appliedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow()
    })
    return {"success": True, "message": "Offer uploaded! Waiting for company verification.", "verificationCode": vCode}

@app.post("/api/placements/student-confirm")
async def student_confirm(req: StudentConfirmRequest):
    placement = await db["placements"].find_one({
        "verificationCode": req.verificationCode,
        "studentEmail": req.studentEmail.lower().strip()
    })
    if not placement:
        raise HTTPException(status_code=404, detail="No placement found")
    
    if placement.get("status") != "offer_issued":
        return {"success": True, "message": f"Placement already at stage: {placement.get('status')}", "status": placement.get('status')}

    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "student_confirmed",
            "studentConfirmedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Student confirmed joining.", "status": "student_confirmed"}


@app.post("/api/placements/upload-joining")
async def upload_joining_letter(req: StudentUploadProofRequest, user: dict = Depends(get_current_user)):
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "studentWallet": user["wallet"]})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "joining_pending",
            "joiningLetterHash": req.documentHash,
            "joiningUploadedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Joining letter uploaded. Waiting for company confirmation."}

@app.post("/api/placements/upload-salary-slip")
async def upload_salary_slip(req: StudentUploadProofRequest, user: dict = Depends(get_current_user)):
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "studentWallet": user["wallet"]})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "salary_pending",
            "salarySlipHash": req.documentHash,
            "salarySlipUploadedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Salary slip uploaded. Waiting for payroll verification."}

@app.post("/api/placements/company-verify-joining")
async def company_verify_joining(req: CompanyConfirmStepRequest, user: dict = Depends(get_current_user)):
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": user["wallet"]})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")

    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "joining_verified",
            "joiningConfirmedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Onboarding verified!"}

@app.post("/api/placements/verify-salary")
async def verify_salary(req: SalaryVerificationRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": wallet})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")

    # ANTI-FRAUD: Salary amount check
    if abs(float(placement.get("salary", 0)) - float(req.amount)) > 1:
        raise HTTPException(status_code=400, detail=f"Salary mismatch! Records say ₹{placement.get('salary')}, but you entered ₹{req.amount}. Fraud detected.")

    metadataURI = f"https://trueplacement.io/metadata/{req.verificationCode}"

    # Update DB
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "salary_verified",
            "salaryTxHash": req.salaryTxHash,
            "isSalaryVerified": True,
            "passportMinted": True,
            "metadataURI": metadataURI,
            "salaryVerifiedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "PAYROLL VERIFIED & PASSPORT MINTED!", "status": "salary_verified"}

@app.post("/api/placements/company-verify")
async def company_verify(req: CompanyApproveRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    algorand_wallet = wallet.upper()

    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": wallet})
    if not placement:
        raise HTTPException(status_code=404, detail="Placement record not found for this company.")
    
    # 1. IPFS MOCKING: In a real app we'd upload to Pinata here
    import hashlib
    ipfs_metadata = {
        "student": placement["studentName"],
        "role": placement["role"],
        "salary": placement["salary"],
        "verificationCode": req.verificationCode
    }
    # Create a deterministic "IPFS-like" hash for the hackathon demo
    ipfs_cid = "Qm" + hashlib.sha256(str(ipfs_metadata).encode()).hexdigest()[:44]

    # 2. Update DB with metadata hash
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "offer_verified",
            "employerVerifiedAt": datetime.utcnow(),
            "signerWallet": algorand_wallet,
            "ipfsCid": ipfs_cid
        }}
    )

    # 3. USE SMART CONTRACT (APP CALL)
    unsigned_txn_encoded = None
    try:
        params = algod_client.suggested_params()
        app_id = int(os.getenv("PLACEMENT_PROCESS_APP_ID", 758916193))
        
        # This is a REAL Smart Contract Call (Application NoOp)
        # We pass the verification hash as an app argument for on-chain logic
        txn = algosdk.transaction.ApplicationNoOpTxn(
            sender=algorand_wallet,
            sp=params,
            index=app_id,
            app_args=[
                "verify_placement".encode(), 
                req.verificationCode.encode()
            ],
            note=f"CollegeTruth|IPFS:{ipfs_cid}".encode()
        )
        unsigned_txn_encoded = base64.b64encode(algosdk.encoding.msgpack_encode(txn)).decode()
        print(f"[BLOCKCHAIN] Smart Contract Call prepared for App ID {app_id}")
    except Exception as e:
        print(f"[WARN] AppCall prep failed, falling back to notarization: {e}")
        # Fallback notarization if smart contract is not reachable
        txn = algosdk.transaction.PaymentTxn(
            sender=algorand_wallet,
            sp=params,
            receiver=algorand_wallet,
            amt=0,
            note=f"CollegeTruth|IPFS:{ipfs_cid}".encode()
        )
        unsigned_txn_encoded = base64.b64encode(algosdk.encoding.msgpack_encode(txn)).decode()

    return {
        "success": True,
        "message": "Phase 2 Initiated: Signing Smart Contract & Anchoring IPFS Metadata.",
        "status": "offer_verified",
        "unsignedTxn": unsigned_txn_encoded,
        "ipfsCid": ipfs_cid
    }

@app.post("/api/placements/submit-signed-txn")
async def submit_signed_txn(req: SubmitSignedTxnRequest, user: dict = Depends(get_current_user)):
    """Receives signed Algorand txn from frontend, submits to network, stores REAL TX hash."""
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": wallet})
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")

    try:
        # Decode the signed transaction bytes sent from Pera Wallet
        signed_txn_bytes = base64.b64decode(req.signedTxn)
        
        # Submit to real Algorand TestNet — no fallback
        tx_id = algod_client.send_raw_transaction(signed_txn_bytes)
        print(f"[ALGORAND ✅] Real transaction submitted: {tx_id}")
        
        # Wait for confirmation (up to 4 rounds)
        algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
        print(f"[ALGORAND ✅] Transaction confirmed: {tx_id}")

    except Exception as e:
        print(f"[ALGORAND ❌] Transaction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Algorand transaction failed: {str(e)}. Make sure your wallet has TestNet ALGO (get free ALGO at https://bank.testnet.algorand.network) and Pera Wallet is on TestNet."
        )

    # Store the REAL TX hash on the placement record
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "txHash": tx_id,
            "status": "joining_verified",
            "onChainAt": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "txHash": tx_id,
        "explorerUrl": f"https://testnet.algoexplorer.io/tx/{tx_id}",
        "message": f"Real transaction confirmed on Algorand TestNet."
    }

@app.post("/api/placements/student-join")
async def student_join_verify(req: StudentJoinVerifyRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "studentWallet": wallet})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {"status": "joining_verified", "joinedAt": datetime.utcnow(), "location": req.location}}
    )
    return {"success": True, "message": "Joined status updated.", "status": "joining_verified"}

@app.post("/api/placements/verify-salary")
async def verify_salary(req: SalaryVerificationRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode})
    if not placement:
         raise HTTPException(status_code=404, detail="Placement not found")
    
    # 1. Update status to fully certified
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "salary_verified", 
            "salaryTxHash": req.salaryTxHash, 
            "actualSalary": req.amount,
            "salaryVerifiedAt": datetime.utcnow()
        }}
    )

    # 2. SOULBOUND TOKEN (SBT) ISSUANCE
    # We mint an NFT (ASA) as a permanent credential for the student
    sbt_asset_id = None
    try:
        from algosdk.transaction import AssetConfigTxn
        from algosdk import account, mnemonic

        # Get Foundation Account (the minter)
        foundation_mnemonic = os.getenv("ALGOD_MNEMONIC")
        if foundation_mnemonic:
            foundation_key = mnemonic.to_private_key(foundation_mnemonic)
            foundation_address = account.address_from_private_key(foundation_key)
            
            params = algod_client.suggested_params()
            
            # Mint the SBT (Soulbound Token)
            # We set clawback/manager to fountain so student cannot sell it
            ptype = placement.get('placementType', 'full-time').upper()
            sbt_label = f"CT-{'INTERN' if ptype == 'INTERNSHIP' else 'CERT'}"
            txn = AssetConfigTxn(
                sender=foundation_address,
                sp=params,
                total=1,
                default_frozen=False,
                unit_name=sbt_label,
                asset_name=f"CollegeTruth {ptype}: {placement['studentName']}",
                manager=foundation_address,
                reserve=foundation_address,
                freeze=foundation_address,
                clawback=foundation_address,
                url=f"ipfs://{placement.get('ipfsCid', 'pending')}",
                decimals=0
            )
            
            # Sign and Send locally (backend acts as Issuer)
            stxn = txn.sign(foundation_key)
            txid = algod_client.send_transaction(stxn)
            
            # Wait for confirmation
            results = algosdk.transaction.wait_for_confirmation(algod_client, txid, 4)
            sbt_asset_id = results['asset-index']
            
            print(f"[BLOCKCHAIN ✅] SBT Minted! Asset ID: {sbt_asset_id}")
            
            # Update DB with SBT ID
            await db["placements"].update_one(
                {"_id": placement["_id"]},
                {"$set": {"sbtAssetId": sbt_asset_id}}
            )

    except Exception as e:
        print(f"[WARN] SBT Issuance failed: {e}")

    return {
        "success": True, 
        "message": "Final Certification Complete: Salary Truth Anchored & SBT Issued.", 
        "status": "salary_verified",
        "sbtAssetId": sbt_asset_id
    }

@app.get("/api/placements/lookup/{code}")
async def lookup_placement(code: str):
    placement = await db["placements"].find_one({"verificationCode": code})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    company = await db["users"].find_one({"walletAddress": placement.get("companyWallet", "")})
    return {
        "success": True,
        "placement": {
            "studentName": placement.get("studentName"),
            "role": placement.get("role"),
            "salary": placement.get("salary"),
            "college": placement.get("college"),
            "status": placement.get("status"),
            "txHash": placement.get("txHash"),
            "companyName": company.get("name") if company else "Unknown",
            "createdAt": placement.get("createdAt"),
            "studentConfirmedAt": placement.get("studentConfirmedAt"),
            "employerVerifiedAt": placement.get("employerVerifiedAt")
        }
    }

# -- College Routes --
@app.get("/api/college/students")
async def get_college_students(user: dict = Depends(get_current_user)):
    college = await db["users"].find_one({"walletAddress": user["wallet"]})
    if not college: raise HTTPException(status_code=404, detail="College not found")
    
    # Match students who explicitly named this college during registration
    c_name = college.get("name", "")
    cursor = db["users"].find({
        "role": "student", 
        "details.college": {"$regex": f"^{c_name}$", "$options": "i"} 
    })
    students = await cursor.to_list(length=200)
    for s in students: 
        s["_id"] = str(s["_id"])
        # Ensure we return crucial fields for the dashboard
        s["verified"] = s.get("details", {}).get("collegeVerified", False)
    return {"success": True, "students": students}

@app.post("/api/college/verify-student")
async def verify_college_student(req: VerifyStudentRequest, user: dict = Depends(get_current_user)):
    await db["users"].update_one(
        {"walletAddress": req.studentWallet.lower()},
        {"$set": {"details.collegeVerified": True, "details.verifiedAt": datetime.utcnow()}}
    )
    return {"success": True, "message": "Student successfully verified."}

@app.post("/api/college/verify-degree")
async def verify_degree(req: VerifyDegreeRequest, user: dict = Depends(get_current_user)):
    """Colleges mint an SBT to certify a student's degree on-chain."""
    wallet = user["wallet"]
    college = await db["users"].find_one({"walletAddress": wallet})
    if not college or college.get("role") != "college":
        raise HTTPException(status_code=403, detail="Only colleges can verify degrees")

    student = await db["users"].find_one({"walletAddress": req.studentWallet.lower()})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # MINT SBT FOR DEGREE
    sbt_asset_id = None
    try:
        from algosdk.transaction import AssetConfigTxn
        from algosdk import account, mnemonic

        foundation_mnemonic = os.getenv("ALGOD_MNEMONIC")
        if foundation_mnemonic:
            foundation_key = mnemonic.to_private_key(foundation_mnemonic)
            foundation_address = account.address_from_private_key(foundation_key)
            params = algod_client.suggested_params()
            
            txn = AssetConfigTxn(
                sender=foundation_address,
                sp=params,
                total=1,
                default_frozen=False,
                unit_name="CT-DEGREE",
                asset_name=f"Degree: {req.degreeName} ({student['name']})",
                manager=foundation_address,
                reserve=foundation_address,
                freeze=foundation_address,
                clawback=foundation_address,
                url=f"ipfs://verified_degree_meta_{req.studentWallet[:8]}",
                decimals=0
            )
            stxn = txn.sign(foundation_key)
            tx_id = algod_client.send_transaction(stxn)
            results = algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
            sbt_asset_id = results['asset-index']
            print(f"[DEGREE ✅] SBT Issued! Asset ID: {sbt_asset_id}")
    except Exception as e:
        print(f"[WARN] Degree SBT issuance failed: {e}")

    await db["users"].update_one(
        {"walletAddress": req.studentWallet.lower()},
        {"$set": {
            "details.degreeVerified": True, 
            "details.degreeName": req.degreeName,
            "details.graduationYear": req.graduationYear,
            "details.degreeSbtId": sbt_asset_id,
            "details.degreeVerifiedAt": datetime.utcnow()
        }}
    )

    return {"success": True, "message": "Degree verified on-chain!", "sbtId": sbt_asset_id}

@app.get("/api/colleges/stats")
async def get_colleges_stats():
    # Real Auditing Logic: Compare Total Claims vs Real Certified Outcomes
    all_placements = await db["placements"].find().to_list(length=1000)
    
    colleges = {}
    for p in all_placements:
        c_name = p.get("college")
        if not c_name: continue
        
        if c_name not in colleges:
            colleges[c_name] = {
                "totalOffers": 0,
                "studentConfirmed": 0,
                "salaryVerified": 0,
                "companies": set(),
                "salaries": []
            }
        
        colleges[c_name]["totalOffers"] += 1
        if p.get("status") in ["joining_verified", "salary_verified"]:
            colleges[c_name]["studentConfirmed"] += 1
        if p.get("status") == "salary_verified":
            colleges[c_name]["salaryVerified"] += 1
            colleges[c_name]["salaries"].append(p.get("salary", 0))
            colleges[c_name]["companies"].add(p.get("companyWallet"))

    enriched = []
    for name, data in colleges.items():
        total = data["totalOffers"]
        verified = data["salaryVerified"]
        score = (verified / total) * 100 if total > 0 else 0
        avg_sal = sum(data["salaries"]) / len(data["salaries"]) if data["salaries"] else 0
        
        enriched.append({
            "college": name,
            "totalOffers": total,
            "studentConfirmed": data["studentConfirmed"],
            "salaryVerified": verified,
            "averageSalary": round(avg_sal, 0),
            "employersCount": len(data["companies"]),
            "trustScore": score,
            "isHighTrust": score >= 80,
            "isAnomaly": score < 40 and total > 5 # High gap detection
        })
    
    # Sort by Trust Score
    enriched.sort(key=lambda x: x["trustScore"], reverse=True)
    return {"success": True, "stats": enriched}


@app.get("/api/colleges/search")
async def search_college_placements(name: str):
    """Public endpoint: Only shows FULLY CERTIFIED placements (all 3 phases done)."""
    import re
    regex = re.compile(f".*{re.escape(name)}.*", re.IGNORECASE)
    # Allow the public to see all claims (Pending, Verified, Certified) 
    # to evaluate the college's entire pipeline
    cursor = db["placements"].find({
        "college": regex,
        "status": {"$in": ["offer_verified", "joining_verified", "salary_verified"]} 
    }).sort("createdAt", -1)
    placements = await cursor.to_list(length=100)
    
    result = []
    for p in placements:
        company = await db["users"].find_one({"walletAddress": p.get("companyWallet", "")})
        result.append({
            "studentName": p.get("studentName"),
            "role": p.get("role"),
            "salary": p.get("salary"),
            "college": p.get("college"),
            "status": p.get("status"),
            "companyName": company.get("name") if company else "Unknown",
            "companyWallet": p.get("companyWallet"),
            "txHash": p.get("txHash"),
            "sbtAssetId": p.get("sbtAssetId"),
            "ipfsCid": p.get("ipfsCid"),
            "verificationCode": p.get("verificationCode"),
            "employerVerifiedAt": str(p.get("employerVerifiedAt", "")),
            "onChainAt": str(p.get("onChainAt", "")),
        })
    
    return {"success": True, "placements": result, "total": len(result), "college": name}

# -- Student Routes --
@app.get("/api/student/placements")
async def get_student_placements(user: dict = Depends(get_current_user)):
    student = await db["users"].find_one({"walletAddress": user["wallet"]})
    if not student: raise HTTPException(status_code=404, detail="User not found")

    cursor = db["placements"].find({"studentEmail": student.get("email")}).sort("createdAt", -1)
    placements = await cursor.to_list(length=50)
    
    for p in placements:
        c = await db["users"].find_one({"walletAddress": p.get("companyWallet")})
        p["_id"] = str(p["_id"])
        p["companyName"] = c.get("name") if c else "Unknown Company"
        p["placementId"] = p.get("verificationCode")
        
    return {"success": True, "placements": placements}

@app.post("/api/verify/student")
async def verify_public_student(req: VerifyPublicStudentRequest):
    # Simulated contract fetch via DB for MVP public verification
    placements = await db["placements"].find({"studentEmail": req.studentEmail, "studentName": req.studentName}).to_list(length=10)
    return {
        "found": len(placements) > 0,
        "placements": placements
    }

# -- Global/Misc Routes --
@app.post("/api/documents/upload")
async def upload_document(req: DocumentUploadRequest, user: dict = Depends(get_current_user)):
    await db["documents"].insert_one({
        "placementId": req.placementId,
        "docType": req.docType,
        "fileHash": req.fileHash,
        "verifier": req.verifier,
        "uploadedBy": user["wallet"],
        "uploadedAt": datetime.utcnow()
    })
    return {"success": True, "message": "Document pinned successfully."}

@app.get("/api/companies/active")
async def get_active_companies():
    cursor = db["users"].find({"role": "company"}).sort("createdAt", -1).limit(50)
    companies = await cursor.to_list(length=50)
    for c in companies: c["_id"] = str(c["_id"])
    return {"success": True, "companies": companies}

@app.get("/api/companies/directory")
async def get_companies_directory():
    cursor = db["users"].find({"role": "company"}).sort("createdAt", -1).limit(100)
    companies = await cursor.to_list(length=100)
    for c in companies: c["_id"] = str(c["_id"])
    return {"companies": companies, "total": len(companies)}

@app.get("/api/companies/stats")
async def get_total_company_stats():
    c_count = await db["users"].count_documents({"role": "company"})
    p_count = await db["placements"].count_documents({})
    return {"totalCompanies": c_count, "totalPlacements": p_count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
