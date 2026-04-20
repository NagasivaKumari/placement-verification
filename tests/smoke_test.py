import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

from backend import batch_worker

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://admin:password123@localhost:27017/placement-db?authSource=admin")


async def insert_demo_placement():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client["placement-db"]
    demo = {
        "studentName": "Demo Student",
        "studentEmail": "demo@student.test",
        "studentWallet": "DEMODUMMYWALLET",
        "role": "Software Engineer",
        "salary": 500000,
        "placementType": "full-time",
        "senderEmail": "hr@demo.test",
        "college": "Demo College",
        "companyWallet": "DEMOCOMPANYWALLET",
        "documentHash": "QmDemo",
        "verificationCode": "demo-verif-123",
        "status": "offer_signed_offchain",
        "ipfsCid": "QmDemo",
        "signerWallet": "DEMOCOMPANYWALLET",
        "signedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow()
    }
    res = await db["placements"].insert_one(demo)
    print("Inserted demo placement id:", res.inserted_id)
    return res.inserted_id


async def run_smoke():
    pid = await insert_demo_placement()
    print("Running batch_worker.run_once()...")
    res = await batch_worker.run_once(limit=10)
    print("Batch worker returned:", res)


if __name__ == '__main__':
    asyncio.run(run_smoke())
