# Backend Architecture & API Specifications

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Web3**: ethers.js
- **Database**: MongoDB
- **Authentication**: JWT (for company logins)
- **Deployment**: Docker

---

## Project Structure
```
backend/
├── src/
│   ├── contracts/
│   │   ├── abi/
│   │   │   └── PlacementRegistry.json
│   │   └── addresses.js
│   ├── models/
│   │   ├── Company.js
│   │   └── Placement.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── company.js
│   │   ├── placement.js
│   │   └── verification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── placementController.js
│   │   └── verificationController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── blockchainService.js
│   │   └── emailService.js
│   ├── config/
│   │   └── database.js
│   ├── app.js
│   └── server.js
├── .env
├── .dockerignore
├── Dockerfile
└── package.json
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Get Nonce (for signing)
```
GET /api/auth/nonce?wallet=0x...
Response:
{
  "nonce": "random-string-uuid"
}
```

#### 2. Verify Wallet Signature
```
POST /api/auth/verify-signature
Body:
{
  "wallet": "0x...",
  "message": "Sign to verify ownership",
  "signature": "0x..."
}
Response:
{
  "success": true,
  "token": "jwt-token-here",
  "company": { companyData }
}
```

#### 3. Register Company
```
POST /api/auth/register
Headers:
Authorization: Bearer {jwt-token}

Body:
{
  "name": "Tech Corp",
  "registrationNumber": "REG123",
  "industry": "IT Services",
  "website": "https://techcorp.com"
}
Response:
{
  "success": true,
  "companyId": "0x...",
  "message": "Company registered on-chain"
}
```

---

### Company Endpoints

#### 1. Get Company Profile
```
GET /api/company/profile
Headers:
Authorization: Bearer {jwt-token}

Response:
{
  "companyId": "0x...",
  "name": "Tech Corp",
  "registrationNumber": "REG123",
  "industry": "IT",
  "website": "https://techcorp.com",
  "totalPlacements": 45,
  "walletAddress": "0x...",
  "registeredAt": 1704067200
}
```

#### 2. Update Company Profile
```
PUT /api/company/profile
Headers:
Authorization: Bearer {jwt-token}

Body:
{
  "name": "Tech Corp Inc",
  "website": "https://newtechcorp.com",
  "industry": "Software Development"
}
Response:
{
  "success": true,
  "message": "Profile updated on-chain"
}
```

#### 3. Get Company Stats
```
GET /api/company/stats
Headers:
Authorization: Bearer {jwt-token}

Response:
{
  "totalPlacements": 45,
  "avgSalary": 65000,
  "mostCommonRole": "Software Engineer",
  "placementRate": "85%",
  "companiesInDirectory": 150
}
```

#### 4. Get Company Placements
```
GET /api/company/placements
Headers:
Authorization: Bearer {jwt-token}

Query: ?page=1&limit=20
Response:
{
  "placements": [
    {
      "placementId": "0x...",
      "studentName": "John Doe",
      "role": "Engineer",
      "salary": 60000,
      "joiningDate": 1704067200,
      "registeredAt": 1703981500
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

---

### Placement Endpoints

#### 1. Post New Placement
```
POST /api/placements/create
Headers:
Authorization: Bearer {jwt-token}

Body:
{
  "studentName": "Alice Johnson",
  "studentEmail": "alice@example.com",
  "role": "Data Scientist",
  "salary": 75000,
  "joiningDate": 1735689600
}
Response:
{
  "success": true,
  "placementId": "0x...",
  "txHash": "0x...",
  "message": "Placement posted on-chain"
}
```

#### 2. Get All Placements (Paginated)
```
GET /api/placements/all
Query: ?page=1&limit=50&sortBy=recent

Response:
{
  "placements": [ ... ],
  "total": 5000,
  "page": 1,
  "pages": 100
}
```

#### 3. Search Placements
```
GET /api/placements/search
Query: ?q=engineer&type=role
   or: ?q=Tech+Corp&type=company
   or: ?q=2024&type=year

Response:
{
  "results": [ ... ],
  "count": 23
}
```

---

### Verification Endpoints (Public)

#### 1. Verify Student Placement
```
POST /api/verify/student
Body:
{
  "studentName": "John Doe",
  "studentEmail": "john@example.com"
}
Response:
{
  "found": true,
  "placements": [
    {
      "companyName": "Tech Corp",
      "role": "Software Engineer",
      "salary": 60000,
      "joiningDate": "2024-01-15",
      "verifiedAt": "2024-01-10",
      "certificateUrl": "https://..."
    }
  ],
  "verificationCode": "unique-code-for-sharing"
}
```

#### 2. Verify Placement by Code
```
GET /api/verify/placement/:verificationCode
Response:
{
  "valid": true,
  "placement": { ... },
  "expiresAt": 1735689600
}
```

#### 3. Get Company Directory
```
GET /api/companies/directory
Query: ?industry=IT&sort=placements

Response:
{
  "companies": [
    {
      "name": "Tech Corp",
      "industry": "IT Services",
      "totalPlacements": 45,
      "avgSalary": 65000,
      "website": "https://...",
      "registeredAt": "2024-01-01"
    }
  ],
  "total": 500
}
```

#### 4. Get Company by ID (Public)
```
GET /api/companies/:companyId
Response:
{
  "companyId": "0x...",
  "name": "Tech Corp",
  "industry": "IT",
  "totalPlacements": 45,
  "avgSalary": 65000,
  "website": "https://techcorp.com",
  "placements": [ ... ]
}
```

---

## Controller Implementation Examples

### authController.js
```javascript
const ethers = require('ethers');
const jwt = require('jsonwebtoken');

const nonces = {}; // Simple in-memory nonce storage (use Redis in production)

exports.getNonce = (req, res) => {
  const { wallet } = req.query;
  const nonce = ethers.id(Date.now() + Math.random());
  nonces[wallet] = nonce;
  
  res.json({ nonce });
};

exports.verifySignature = (req, res) => {
  const { wallet, message, signature } = req.body;
  
  try {
    const recovered = ethers.recoverAddress(message, signature);
    
    if (recovered.toLowerCase() === wallet.toLowerCase()) {
      const token = jwt.sign(
        { wallet, timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ success: true, token, wallet });
    } else {
      res.status(401).json({ error: 'Signature verification failed' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.registerCompany = async (req, res) => {
  const { name, registrationNumber, industry, website } = req.body;
  const wallet = req.user.wallet; // From JWT middleware
  
  try {
    // Call smart contract to register
    const contract = getContractInstance();
    const tx = await contract.registerCompany(
      name,
      registrationNumber,
      industry,
      website
    );
    
    // Cache in database
    await Company.create({
      walletAddress: wallet,
      name,
      registrationNumber,
      industry,
      website,
      txHash: tx.hash
    });
    
    res.json({
      success: true,
      message: 'Company registered',
      txHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### placementController.js
```javascript
exports.postPlacement = async (req, res) => {
  const { studentName, studentEmail, role, salary, joiningDate } = req.body;
  const wallet = req.user.wallet;
  
  try {
    const contract = getContractInstance();
    const tx = await contract.postPlacement(
      studentName,
      studentEmail,
      role,
      salary,
      joiningDate
    );
    
    // Cache in database
    await Placement.create({
      studentName,
      studentEmail,
      role,
      salary,
      joiningDate,
      companyWallet: wallet,
      txHash: tx.hash
    });
    
    res.json({
      success: true,
      placementId: tx.hash,
      message: 'Placement posted on-chain'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyStudent = async (req, res) => {
  const { studentName, studentEmail } = req.body;
  
  try {
    const contract = getContractInstanceRead();
    const placements = await contract.getPlacementsByStudentEmail(studentEmail);
    
    if (placements.length === 0) {
      return res.json({ found: false, placements: [] });
    }
    
    // Filter by name (email can be duplicate, verify name too)
    const verified = placements.filter(p => p.studentName === studentName);
    
    res.json({
      found: verified.length > 0,
      placements: verified.map(p => ({
        companyName: p.companyName,
        role: p.role,
        salary: p.salary,
        joiningDate: new Date(p.joiningDate * 1000).toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## Blockchain Service

### blockchainService.js
```javascript
const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.CONFLUX_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let contract;

const initContract = () => {
  const abi = require('./abi/PlacementRegistry.json');
  contract = new ethers.Contract(
    process.env.PLACEMENT_CONTRACT_ADDRESS,
    abi,
    signer
  );
  return contract;
};

const getReadContract = () => {
  const abi = require('./abi/PlacementRegistry.json');
  return new ethers.Contract(
    process.env.PLACEMENT_CONTRACT_ADDRESS,
    abi,
    provider
  );
};

module.exports = {
  initContract,
  getReadContract,
  provider,
  signer
};
```

---

## Environment Variables (.env)
```
NODE_ENV=production
PORT=3000

CONFLUX_RPC_URL=https://evm.confluxrpc.com
CONFLUX_CHAIN_ID=71
PLACEMENT_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

MONGODB_URI=mongodb://user:pass@localhost:27017/placement-db
JWT_SECRET=your-jwt-secret-key

CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

SPONSOR_BALANCE=10 # CFX
```

---

## Error Handling

### Custom Error Class
```javascript
class BlockchainError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// Usage in routes
catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    res.status(402).json({ error: 'Insufficient gas balance' });
  } else if (error.code === 'INVALID_ADDRESS') {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
}
```

---

## Middleware

### authMiddleware.js
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

---

## Database Models

### Company.js (MongoDB)
```javascript
const schema = {
  walletAddress: String,
  companyId: String,
  name: String,
  registrationNumber: String,
  industry: String,
  website: String,
  txHash: String,
  createdAt: Date,
  updatedAt: Date
};
```

### Placement.js (MongoDB)
```javascript
const schema = {
  placementId: String,
  companyWallet: String,
  studentName: String,
  studentEmail: String,
  role: String,
  salary: Number,
  joiningDate: Date,
  txHash: String,
  createdAt: Date
};
```

---

## Next Steps
1. Initialize Node.js project
2. Install dependencies (express, ethers, mongodb, etc.)
3. Set up MongoDB database
4. Implement controllers and routes
5. Test all endpoints with Postman
6. Deploy with Docker
