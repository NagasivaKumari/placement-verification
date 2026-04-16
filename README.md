# 🛡️ TruePlacement: Educational RegTech & DPDP Platform

**TruePlacement** is an institutional-grade, anti-fraud ecosystem built for the **RegTech & DPDP** domain. Using the **Algorand Blockchain**, we eliminate "Ghost Placements" and fake college claims by anchoring every professional milestone in immutable, cryptographically-proven records.

> [!IMPORTANT]
> **No AI Needed:** Rather than trying to outsmart fraud with black-box ML algorithms, TruePlacement cuts directly to the source of truth via **Strict Document Uploads** and **Multi-Party Verification**. If the company hasn't issued the **Salary Slip** to match the blockchain hash, the placement is not certified.

---

## 🚀 The 4-Tier Zero-Trust Workflow

### Phase 1: Registration
- **Students**: Upload College ID, Aadhaar, Marksheets.
- **Colleges**: Verify student identity and academic status.
- **Companies**: Register via Government Database checks (GST, PAN).

### Phase 2: Placement Process (Tier 1 & 2)
1. **Student applies** to a verified company.
2. **Company reviews & issues an offer**, uploading the official Offer Letter (Tier 1 - Documented).
3. **Student natively signs** from their Algorand Pera Wallet to accept (Tier 2 - Witnessed).

### Phase 3: Joining (Tier 3)
1. **Student joins** the company and uploads the joining letter.
2. **Company confirms** their physical/biometric joining and HR validates the onboarding event.

### Phase 4: Salary & Finality (Tier 4)
1. **Company pays** the first month's salary, uploading the verified Salary Slip.
2. **Blockchain records** the hash of the salary proof.
3. The Placement is now **100% Certified**, and counts toward the College's un-fakeable statistics!

---

## 💎 Why RegTech & DPDP?
- **Regulatory compliance**: Forces placement bodies to adhere to standardized state criteria.
- **Document verification**: Ensures explicit photographic proof for IDs and letters.
- **Data protection**: All private identifiable info is localized and secured; only hashes touch the ledger.

---

## 🛠️ Technology Stack
- **Frontend**: React.js, TailwindCSS (Using `@perawallet/connect`).
- **Backend APIs**: Node.js, Express.js.
- **Database**: PostgreSQL (Structural models) / MongoDB (Document Caching).
- **Blockchain**: Algorand TestNet (Smart Contracts for immutable records).
- **Storage**: Simulated IPFS/S3 block-storage for Document Photos.

---

## 🏁 Quick Start: Running the MVP Locally

### 1. Environment Variables
Create a `.env` in the `backend` folder:
```env
MONGODB_URI=mongodb+srv://nagashivakota_db_user:password@cluster0...
JWT_SECRET=your_secret_key
PORT=3000
```

### 2. Start Backend & Frontend
Launch your terminal and start both the servers:
```bash
# In /backend
npm install
npm run dev

# In /frontend
npm install
npm run dev
```

### 3. Usage Flow
- Go to `http://localhost:5175`
- Click **"Connect Pera Wallet"**.
- During initial login, pick your Role: `college`, `company`, or `student`.
- Once logged in, navigate the header to reach your specialized Dashboard!
