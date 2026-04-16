# Placement Verification System - Complete Documentation

## 📋 Quick Start Guide

This folder contains **complete documentation** for building and deploying the **Placement Verification System** on Conflux blockchain.

### What's Inside

| Document | Purpose |
|----------|---------|
| **01-SYSTEM-OVERVIEW.md** | Project vision, features, tech stack, actors, and success metrics |
| **02-WALLET-AUTHENTICATION.md** | Wallet setup, authentication flows, gas sponsorship model |
| **03-SMART-CONTRACT-SPECS.md** | Complete Solidity contract specifications and functions |
| **04-BACKEND-ARCHITECTURE.md** | Node.js backend, API endpoints, controllers, database models |
| **05-FRONTEND-ARCHITECTURE.md** | React frontend, UI components, page flows, custom hooks |
| **06-DEPLOYMENT-DEVOPS.md** | Docker setup, Kubernetes, CI/CD, monitoring, scaling |

---

## 🎯 Project Summary

### Problem
- Fake placement centers deceive students with false 100% placement claims
- Parents lose ₹2-5 lakhs on fraudulent educational courses
- No transparent way to verify employment without blockchain

### Solution
**Decentralized Placement Registry on Conflux**
- Companies register and confirm placements on-chain
- Students verify employment instantly with immutable records
- Parents see real data before investing
- Fake centers automatically exposed

### Why Conflux
✅ **Gas Sponsorship** — Users pay zero gas (no friction)  
✅ **Tree-Graph Consensus** — High throughput for millions of placements  
✅ **EVM Compatibility** — Standard Solidity + Ethereum tools  
✅ **Dual-Space** — eSpace for ease, Core Space for security  

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  Home │ Company Dashboard │ Verify Placement │ Directory  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  Auth │ Company │ Placements │ Verification │ Directory  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐   ┌─────────▼──────────┐
│  MongoDB Cache   │   │ Conflux Smart      │
│  (off-chain)     │   │ Contract (on-chain)│
│                  │   │                    │
│ • Companies      │   │ • registerCompany()
│ • Placements     │   │ • postPlacement()  │
│ • Users          │   │ • getPlacementsByStudentEmail()
└──────────────────┘   │ • getCompanyStats()
                       └────────────────────┘
                             │
                       Conflux eSpace
                       Chain ID: 71
                       RPC: https://evm.confluxrpc.com
```

---

## 🔄 User Flows

### Flow 1: Company Registration
```
Company downloads MetaMask
     ↓
Adds Conflux eSpace network (71)
     ↓
Connects wallet to app
     ↓
Signs message for authentication
     ↓
Fills registration form (name, reg number, industry)
     ↓
Smart contract called: registerCompany()
     ↓
Company record saved on-chain + MongoDB cache
     ↓
Company dashboard ready to post placements
```

### Flow 2: Post Placement
```
Company fills form:
  - Student name
  - Student email
  - Job role
  - Salary
  - Joining date
     ↓
Backend calls: contract.postPlacement()
     ↓
Gas sponsored (company/platform absorbs cost)
     ↓
Placement immutably recorded on-chain
     ↓
Cached in MongoDB for fast queries
     ↓
Company sees success message
```

### Flow 3: Student Verification
```
Student (NO wallet needed) enters:
  - Full name
  - Email address
     ↓
App queries smart contract: getPlacementsByStudentEmail()
     ↓
Placements found ✓
     ↓
Shows company name, role, salary, joining date
     ↓
Can download verification certificate
     ↓
Can share link with parents
```

### Flow 4: Parent Validation
```
Parent visits app (public page)
     ↓
Searches for college/placement center name
     ↓
Dashboard shows:
  - Total placements
  - Average salary
  - List of hiring companies
  - Placement rate (%)
     ↓
Decides if investment is worth it
```

---

## 📊 Key Data Structures

### Company Record (On-Chain)
```json
{
  "companyId": "0x...",
  "name": "Tech Corp",
  "registrationNumber": "REG123",
  "walletAddress": "0x...",
  "industry": "IT",
  "registeredAt": 1704067200,
  "isActive": true,
  "website": "https://techcorp.com",
  "totalPlacements": 45
}
```

### Placement Record (On-Chain)
```json
{
  "placementId": "0x...",
  "companyId": "0x...",
  "studentName": "John Doe",
  "studentEmail": "john@example.com",
  "role": "Software Engineer",
  "salary": 60000,
  "joiningDate": 1735689600,
  "registeredAt": 1704067200,
  "isVerified": true
}
```

---

## 🔐 Authentication & Wallet Setup

### Company Wallet (MetaMask Required)
**Network**: Conflux eSpace
- **RPC URL**: https://evm.confluxrpc.com
- **Chain ID**: 71
- **Currency**: CFX

**Setup**:
1. Download MetaMask
2. Add Conflux eSpace network manually
3. Create wallet (save seed phrase!)
4. Connect to app
5. Sign message for authentication

### Student Verification (No Wallet)
- Email-based verification
- No blockchain knowledge required
- App queries smart contract on user's behalf

### Parent Dashboard (Read-Only)
- No wallet needed
- Web app reads public smart contract data
- Free (no gas cost)

---

## 🛠️ Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.19+
- **Network**: Conflux eSpace
- **Framework**: Hardhat

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Web3**: ethers.js 6.x
- **Database**: MongoDB 5.0+
- **Auth**: JWT tokens
- **API**: REST

### Frontend
- **Framework**: React 18+
- **Build**: Vite
- **Web3 Wallet**: wagmi / ethers.js
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand / Redux
- **Forms**: React Hook Form

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions (optional)
- **Hosting**: Vercel (frontend), AWS/Digital Ocean (backend)

---

## 📈 Development Roadmap

### Phase 1: MVP (4 weeks)
- [ ] Smart contract (core functions)
- [ ] Backend API (CRUD endpoints)
- [ ] Frontend (company registration, post placement)
- [ ] Student verification page
- [ ] Docker setup

### Phase 2: Enhancement (2 weeks)
- [ ] Company directory & statistics
- [ ] Parent dashboard with analytics
- [ ] Email notifications
- [ ] Certificate generation (PDF)
- [ ] Search and filtering

### Phase 3: Advanced (2 weeks)
- [ ] Fraud detection (anomaly detection)
- [ ] Admin approval process
- [ ] Company reputation scoring
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

### Phase 4: Production (1 week)
- [ ] Security audit
- [ ] Load testing
- [ ] Kubernetes deployment
- [ ] Monitoring & alerting
- [ ] Launch

---

## 🚀 Deployment Options

### Local Development
```bash
docker-compose up -d
# Backend: http://localhost:3000
# Frontend: http://localhost:5173
# MongoDB: localhost:27017
```

### Testnet Deployment
```bash
PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network confluxTestnet
```

### Mainnet Deployment
```bash
PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network confluxESpace
```

---

## 💰 Prize Category & Scoring

**Best Developer Tool** ($500) or **Main Award** ($1,500)

### Why This Wins
✅ **Real Problem**: Solves institutional fraud (not crypto-only)  
✅ **Unique**: Only placement verification on Conflux  
✅ **Gas Sponsorship**: Leverages Conflux's unique feature  
✅ **Scalable**: Works for schools, colleges, universities globally  
✅ **Practical**: Zero friction for non-crypto users (email-based)  

### Judging Criteria
- Innovation (uses Gas Sponsorship, eSpace/Core)
- Feasibility (simple, buildable, deployable)
- Social Impact (solves real problem)
- Code Quality (clean, well-documented)
- UX/Design (user-friendly, intuitive)

---

## 📚 Additional Resources

### Conflux Documentation
- https://doc.confluxnetwork.org/
- https://evm.confluxscan.io/ (eSpace block explorer)

### Hackathon Resources
- Discord: https://discord.gg/4A2q3xJKjC
- GitHub: https://github.com/conflux-fans/global-hackfest-2026
- Telegram: https://t.me/ConfluxDevs

### Co-Sponsor Tools
- **Tenderly**: https://tenderly.co (debugging + simulation)
- **ChainThink**: https://chainthink.io (market insights)
- **Infini**: https://infini.io (financial OS)
- **Hive3**: https://hive3.com (community platform)

---

## ⚡ Quick Reference

### Key Smart Contract Functions
```solidity
registerCompany(name, registrationNumber, industry, website)
postPlacement(studentName, studentEmail, role, salary, joiningDate)
getPlacementsByStudentEmail(email)
getPlacementsByCompany(companyId)
getCompanyPlacementCount(companyId)
getPlacementStats(companyId)
```

### Key API Endpoints
```
POST /api/auth/register                    # Register company
POST /api/placements/create                # Post placement
POST /api/verify/student                   # Verify student
GET  /api/companies/directory              # Browse companies
GET  /api/company/profile                  # Get company info
GET  /api/company/placements               # List placements
```

### Key Environment Variables
```
PRIVATE_KEY                    # Company owner's wallet key
PLACEMENT_CONTRACT_ADDRESS     # Deployed contract address
CONFLUX_RPC_URL               # Conflux RPC endpoint
MONGODB_URI                   # MongoDB connection string
JWT_SECRET                    # JWT signing secret
```

---

## 📞 Support & Questions

For hackathon-specific questions:
- **Discord**: https://discord.gg/4A2q3xJKjC
- **Office Hours**: Tuesdays, Wednesdays, Thursdays (April 7-24)
- **Calendly**: https://calendly.com/nico-conflux/30min

---

## 📝 Submission Checklist

- [ ] Smart contract deployed on Conflux eSpace
- [ ] Backend API running and tested
- [ ] Frontend fully functional
- [ ] Docker setup (docker-compose.yml)
- [ ] README with setup instructions
- [ ] GitHub repository public
- [ ] Demo video (walkthrough of features)
- [ ] Deployed live demo (optional)
- [ ] All features working without errors

---

## 🎓 Learning Path

1. **Start here**: Read 01-SYSTEM-OVERVIEW.md
2. **Understand wallets**: Read 02-WALLET-AUTHENTICATION.md
3. **Learn smart contracts**: Read 03-SMART-CONTRACT-SPECS.md
4. **Build backend**: Follow 04-BACKEND-ARCHITECTURE.md
5. **Create frontend**: Follow 05-FRONTEND-ARCHITECTURE.md
6. **Deploy**: Follow 06-DEPLOYMENT-DEVOPS.md

---

## 🏆 Success Metrics

**MVP Success** (4 weeks):
- ✅ 100+ companies registered
- ✅ 1,000+ placements verified
- ✅ 100+ student verifications
- ✅ Zero errors in production

**Growth** (3 months):
- ✅ 1,000+ companies
- ✅ 50,000+ placements
- ✅ 10,000+ monthly verifications
- ✅ 80%+ reduction in fake placements

---

**Status**: Ready for development  
**Last Updated**: 2024-01-01  
**Next**: Start building! Follow the documentation in order.
