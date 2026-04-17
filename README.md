# 🛡️ CollegeTruth: The Decentralized Talent Ledger

**TruePlacement** is an institutional-grade, anti-fraud ecosystem built for the **RegTech & DPDP** domain. Using the **Algorand Blockchain**, we eliminate "Ghost Placements" and fake college claims by anchoring every professional milestone in immutable, cryptographically-proven records.

> [!IMPORTANT]
> **No AI Needed:** Rather than trying to outsmart fraud with black-box ML algorithms, TruePlacement cuts directly to the source of truth via **Strict Document Uploads** and **Multi-Party Verification**. If the company hasn't issued the **Salary Slip** to match the blockchain hash, the placement is not certified.

---

## 💡 The Solution: "On-Chain Talent Ledger"
CollegeTruth solves these problems by moving the entire career lifecycle onto a **Soulbound Asset Pipeline**:

*   **Immutable Identity**: Students don't just "create an account"; they anchor their identity on the blockchain. Every verification is cryptographically signed.
*   **The 3-Key Verification**: A placement is only "Green-Lit" when three independent parties sign off:
    1.  The **Student** (Accepts the offer).
    2.  The **Employer** (Verifies onboarding and biometric presence).
    3.  The **Payroll Anchor** (Logs the hash of the first salary payment).
*   **Fractional Trust Scores**: Instead of a "Yes/No" verification, our system builds a **Trust Reputation** over time based on real, on-chain events.

---

## 🚀 Key Features

### 🎓 For Students (Talent Portal)
*   **On-Chain Identity**: Register and anchor your institutional identity via Pera/Lute Wallet.
*   **SBT Verification**: Earn Soulbound Tokens (SBTs) for academic and professional milestones.
*   **Placement Tracker**: A cinematic timeline tracking your offer, joining, and payroll verification phases.
*   **Professional Trust Score**: A dynamic reputation score calculated based on real, immutable evidence.

### 🏢 For Companies (Verified Employers)
*   **Secure Hiring**: Verify student claims against authenticated college records in seconds.
*   **Domain-Locked Offers**: Protect your brand; students can only claim offers from your official corporate email domain.
*   **Payroll Sync**: Seal the trust loop by hashing salary proofs on-chain.

### 🏛️ For Colleges (Institutional Audit)
*   **Un-fakeable Statistics**: Automatically generated NIRF/NAAC-ready placement reports.
*   **Student Registry**: Manage and approve students' enrollment status before they enter the Ledger.
*   **Transparancy Leaderboard**: Public rankings of colleges based on **verified outcomes**, not self-reported numbers.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), TypeScript, TailwindCSS.
*   **Backend**: Python 3.11, FastAPI.
*   **Blockchain**: Algorand (py-algorand-sdk).
*   **Database**: MongoDB Atlas.
*   **Wallet**: @perawallet/connect.

---

## ⛓️ The On-Chain Verification Loop

CollegeTruth uses a **Zero-Knowledge-Inspired Trust Loop**:
1.  **Identity Anchor**: Secure registration signed on-chain.
2.  **Offer Proof**: Metadata hashes of Job Offers stored on the ledger.
3.  **Joining Event**: HR-signed "Physical Onboarding" milestone.
4.  **Payroll Seal**: The final level of trust. A payment hash (salary) is anchored.

---

## 🏁 Setup & Deployment

Refer to the internal documentation in the `backend/` and `frontend/` folders for specific environment variables and configuration steps.

**Backend Deployment**: Render (via Docker)
**Frontend Deployment**: Vercel

---

## 📜 License
Licensed under the MIT License. Developed for the Algorand Blockchain ecosystem.
