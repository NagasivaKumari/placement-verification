# 🛡️ CollegeTruth: The Decentralized Talent Ledger

**CollegeTruth** is a next-generation regulatory technology (RegTech) platform designed to restore integrity to the higher education ecosystem. By leveraging the **Algorand Blockchain**, we provide a fraud-proof foundation for verifying academic and professional credentials.

---

## 🎯 Vision
Our vision is to create a **transparent global economy** where career milestones are as immutable as the laws of physics. We aim to empower students with ownership of their verified achievements while protecting employers and government bodies from systemic institutional fraud.

---

## ⚠️ The Problem
In the current educational landscape, "Ghost Placements" and credential inflation have become a billion-dollar crisis:
1.  **Institutional Fraud**: Colleges often inflate placement statistics by creating fake "success stories" to attract more students.
2.  **Verification Lag**: Companies spend weeks and thousands of dollars manually verifying candidate backgrounds.
3.  **Credential Forgery**: Traditional PDF-based offer letters and salary slips can be easily altered with simple editing software.
4.  **Lack of Accountability**: There is no centralized, tamper-proof record of whether a student's career claim is actually backed by physical employment and payroll history.

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
