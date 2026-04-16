# Placement Verification System - Overview

## Project Vision
A decentralized verification platform where companies register placements on-chain, students verify employment, and parents validate placement legitimacy before paying educational fees.

---

## Problem Statement

### Current Issues
1. **Fake Placements**: Placement centers claim 100% placement rates without verification
2. **Financial Loss**: Parents pay ₹2-5 lakhs for courses based on false promises
3. **Student Deception**: Students don't know if placements are real until after graduation
4. **No Accountability**: No transparent way to verify company hiring claims

### Solution
On-chain placement registry powered by Conflux blockchain:
- Companies register and confirm placements (Gas-sponsored, no friction)
- Students verify employment instantly
- Parents see real data before investing
- Fake centers get exposed automatically

---

## Key Features

### 1. Company Registration
- Company creates wallet on Conflux eSpace
- Registers basic info: name, registration number, industry
- Gets company ID for posting placements

### 2. Placement Registration (Company)
- Company posts: Student Name, Role, Salary, Join Date
- Immutable record on blockchain
- No way to fake or delete

### 3. Student Verification
- Student logs in (Web3 wallet or email-based)
- Searches their name in company's placement records
- Sees all verified details
- Can share verification link with parents

### 4. Parent Dashboard
- View student's verified placements
- See company details and credibility score
- Download verification certificate
- Make informed decision before paying

### 5. Placement Center Reputation
- Aggregates all placements by center
- Shows placement rate, average salary, company types
- Transparent for prospective students

---

## Technology Stack

### Blockchain
- **Network**: Conflux eSpace (EVM-compatible)
- **Smart Contract Language**: Solidity
- **Gas Sponsorship**: Yes (users pay zero gas)

### Backend
- **Runtime**: Node.js (Express.js or similar)
- **Web3 Library**: ethers.js
- **Database**: MongoDB (off-chain data cache)
- **Authentication**: MetaMask or email-based Web3 login

### Frontend
- **Framework**: React.js
- **Web3 Integration**: wagmi or ethers.js
- **UI Library**: Tailwind CSS or Material UI

### Deployment
- **Docker**: Backend containerization
- **Smart Contracts**: Deployed on Conflux eSpace
- **Hosting**: AWS or Vercel

---

## Actors & Roles

| Actor | Role | Actions |
|-------|------|---------|
| **Company** | Employer | Register company, post placements, verify students |
| **Student** | Job seeker | Verify placement, share proof with parents |
| **Parent/Guardian** | Decision maker | View placement data, assess course legitimacy |
| **Placement Center** | Course provider | Aggregated data shows center's track record |
| **Admin/Moderator** | System overseer | Verify companies (optional, for V2) |

---

## User Flows

### Flow 1: Company Posts Placement
```
Company Wallet → Creates TX → Smart Contract → Student record stored on-chain
                                               ↓
                                        Database (cache)
```

### Flow 2: Student Verifies Placement
```
Student enters name/email → Smart Contract query → Found ✓ → Shows details → Shareable link
```

### Flow 3: Parent Validates Center
```
Parent searches center name → Dashboard shows:
                              - Total placements
                              - Average salary
                              - Company list
                              - Placement rate (%)
```

---

## Data Model (High Level)

### Company Record
```
{
  companyId: bytes32,
  name: string,
  registrationNumber: string,
  walletAddress: address,
  industry: string,
  registeredAt: uint256,
  status: bool (active/inactive)
}
```

### Placement Record
```
{
  placementId: bytes32,
  companyId: bytes32,
  studentName: string,
  studentEmail: string,
  role: string,
  salary: uint256,
  joiningDate: uint256,
  verifiedAt: uint256,
  certificateHash: bytes32 (IPFS)
}
```

---

## Conflux Features Utilized

### 1. Gas Sponsorship
- **Why**: Students/parents don't pay gas to verify
- **How**: Company absorbs gas cost (negligible on Conflux)
- **Benefit**: Zero friction for end users

### 2. High Throughput (Tree-Graph)
- **Why**: Handle millions of placements daily
- **Benefit**: Scale without network congestion

### 3. EVM Compatibility (eSpace)
- **Why**: Use standard Solidity + Ethereum tools
- **Benefit**: Easier development, familiar ecosystem

---

## Security Considerations

1. **Company Verification**: Only registered companies can post placements (V1: self-service, V2: admin approval)
2. **Data Integrity**: Placements immutable on-chain
3. **Privacy**: Student email not publicly exposed (hashed)
4. **Fraud Detection**: Anomaly detection (same company posting 10K placements in 1 day = red flag)

---

## Success Metrics

- **Adoption**: 500+ companies, 5K+ verified placements in 6 months
- **Impact**: Reduce fake placement fraud by 80%
- **Usage**: 10K+ parent/student verifications per month
- **Reputation**: Become trusted source for placement verification

---

## Next Steps (Development Roadmap)

1. **Phase 1**: Smart contracts + backend API
2. **Phase 2**: Student verification dashboard
3. **Phase 3**: Parent dashboard + analytics
4. **Phase 4**: Company reputation scoring
5. **Phase 5**: Mobile app

---

## Prize Category
**Best Developer Tool** ($500) or **Main Award** ($1,500)
- Solves real institutional problem
- Leverages Conflux's Gas Sponsorship uniquely
- Scalable to other verification use cases
