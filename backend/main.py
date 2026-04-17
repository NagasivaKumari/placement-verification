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
    details: Optional[Dict[str, Any]] = {}

class UserProfileUpdateRequest(BaseModel):
    name: str
    email: Optional[str] = ""
    # Generic wrapper for dynamic role details
    details: Optional[Dict[str, Any]] = {}

class StudentUploadOfferRequest(BaseModel):
    companyWallet: str
    role: str
    salary: float
    documentHash: Optional[str] = "offchain_ipfs_link_or_hash"
    
class CompanyApproveRequest(BaseModel):
    verificationCode: str
    txHash: Optional[str] = "0x"

class StudentJoinVerifyRequest(BaseModel):
    verificationCode: str
    location: Optional[str] = "Remote"

class SalaryVerificationRequest(BaseModel):
    verificationCode: str
    salaryTxHash: str
    amount: float

class IssueOfferRequest(BaseModel):
    verificationCode: str
    salary: float

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

@app.post("/api/auth/register-role")
async def register_role(req: RegisterRoleRequest):
    wallet = req.wallet.lower()
    await db["users"].update_one(
        {"walletAddress": wallet},
        {"$set": {
            "role": req.role,
            "name": req.name,
            "email": req.email,
            "details": req.details,
            "updatedAt": datetime.utcnow()
        }, "$setOnInsert": {"createdAt": datetime.utcnow()}},
        upsert=True
    )
    return {"success": True, "message": "User updated successfully."}


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
        "details": db_user.get("details", {})
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
    if not student: raise HTTPException(status_code=404, detail="Student not found")

    import hashlib
    vCode = hashlib.sha256(f"{time.time()}{student.get('email')}".encode()).hexdigest()[:18]

    await db["placements"].insert_one({
        "studentName": student.get("name"),
        "studentEmail": student.get("email"),
        "studentWallet": studentWallet,
        "role": req.role,
        "salary": req.salary,
        "college": student.get("details", {}).get("college", "Unknown College"),
        "companyWallet": req.companyWallet,
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


@app.post("/api/placements/salary-proof")
async def salary_proof(req: SalaryProofRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": wallet})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")

    metadataURI = f"https://trueplacement.io/metadata/{req.verificationCode}"

    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "salary_verified",
            "salaryTxHash": req.salaryTxHash,
            "isSalaryVerified": True,
            "passportMinted": True,
            "studentWallet": req.studentWallet,
            "metadataURI": metadataURI,
            "salaryVerifiedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "TALENT PASSPORT MINTED!", "status": "salary_verified"}

@app.post("/api/placements/company-verify")
async def company_verify(req: CompanyApproveRequest, user: dict = Depends(get_current_user)):
    wallet = user["wallet"]
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode, "companyWallet": wallet})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    
    # Generate Unsigned Algorand Transaction for the Frontend to Sign
    try:
        params = algod_client.suggested_params()
        # Note: In a real app, this would be an App Call to anchor the placement hash
        # For this MVP, we prepare a small notarization payment or NoOp
        txn = PaymentTxn(
            sender=wallet,
            sp=params,
            receiver=wallet, # Self-payment of 0 to anchor note
            amt=0,
            note=f"PlacementVerified:{req.verificationCode}".encode()
        )
        unsigned_txn_encoded = base64.b64encode(algosdk.encoding.msgpack_encode(txn)).decode()
        
        await db["placements"].update_one(
            {"_id": placement["_id"]},
            {"$set": {"status": "offer_verified", "employerVerifiedAt": datetime.utcnow()}}
        )
        
        return {
            "success": True, 
            "message": "Transaction Prepared", 
            "unsignedTxn": unsigned_txn_encoded,
            "status": "offer_verified"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Algorand prep failed: {str(e)}")

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
    # Can be called by student or company to anchor the truth
    placement = await db["placements"].find_one({"verificationCode": req.verificationCode})
    if not placement: raise HTTPException(status_code=404, detail="Placement not found")
    
    await db["placements"].update_one(
        {"_id": placement["_id"]},
        {"$set": {
            "status": "salary_verified", 
            "salaryTxHash": req.salaryTxHash, 
            "actualSalary": req.amount,
            "salaryVerifiedAt": datetime.utcnow()
        }}
    )
    return {"success": True, "message": "Salary Truth Anchored.", "status": "salary_verified"}

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
    
    # Simple regex partial match over MongoDB
    import re
    regex = re.compile(f".*{college.get('name', '')}.*", re.IGNORECASE)
    cursor = db["users"].find({"role": "student", "details.college": regex})
    students = await cursor.to_list(length=100)
    for s in students: s["_id"] = str(s["_id"])
    return {"success": True, "students": students}

@app.post("/api/college/verify-student")
async def verify_college_student(req: VerifyStudentRequest, user: dict = Depends(get_current_user)):
    await db["users"].update_one(
        {"walletAddress": req.studentWallet.lower()},
        {"$set": {"details.isVerifiedByCollege": True, "details.verifiedAt": datetime.utcnow()}}
    )
    return {"success": True, "message": "Student successfully verified."}

@app.get("/api/colleges/stats")
async def get_colleges_stats():
    # Pipeline aggregation equivalent
    pipeline = [
        {"$group": {
            "_id": "$college",
            "totalOffers": {"$sum": 1},
            "averageSalary": {"$avg": "$salary"},
            "companies": {"$addToSet": "$companyWallet"}
        }},
        {"$sort": {"totalOffers": -1}}
    ]
    stats = await db["placements"].aggregate(pipeline).to_list(length=100)
    for s in stats: s["college"] = s["_id"]
    return {"success": True, "stats": stats}

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
