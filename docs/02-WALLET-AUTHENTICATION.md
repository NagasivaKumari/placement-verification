# Wallet & Authentication Architecture

## Wallet Types & Usage

### 1. Company Wallet (MetaMask / Wallet Connect)
**Purpose**: Register company, post placements, pay gas (optional)

**Creation**:
```
User downloads MetaMask → Creates wallet on Conflux eSpace
MetaMask Network: https://evm.confluxrpc.com
Chain ID: 71
```

**Wallet Details**:
- **Network**: Conflux eSpace
- **RPC URL**: https://evm.confluxrpc.com
- **Chain ID**: 71
- **Currency**: CFX (Conflux coin)

**Company Registration TX**:
```solidity
// Smart Contract function
function registerCompany(
    string memory name,
    string memory registrationNumber,
    string memory industry
) public {
    // Creates company record
    // Caller's wallet address = company ID
}
```

---

### 2. Student Verification (Email-based or Web3)
**Purpose**: Verify placement without needing wallet setup

**Two Options**:

#### Option A: Email-based (No Wallet Required)
```
Student enters: Email + Name
Backend queries: Smart Contract with student filters
Returns: Placements matching that student
No blockchain interaction on student side
```

#### Option B: Web3 Wallet (Optional)
```
Student connects MetaMask
Signs message to prove ownership
Can create on-chain verification record
```

**Recommended**: Email-based for mass adoption (no crypto knowledge needed)

---

### 3. Parent Verification (Read-only)
**Purpose**: View placement data (no transaction needed)

**Access**:
- No wallet required
- Web app connects to public RPC endpoint
- Reads smart contract data (free, no gas)
- Can search by center name, company, or student

---

## Authentication Methods

### Method 1: MetaMask (Company/Advanced Users)
```javascript
// Frontend code (React)
const [account, setAccount] = useState(null);

const connectWallet = async () => {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    setAccount(accounts[0]);
    // Now user can interact with smart contracts
  }
};
```

### Method 2: Email-based (Students/Parents)
```javascript
// Backend validates via email verification
// No wallet needed
const verifyStudent = async (email, name) => {
  // Query smart contract
  const placements = await contract.getPlacementsByStudent(name, email);
  return placements;
};
```

### Method 3: Social Login (Future)
```
Google/GitHub login → Backend maps to wallet → Interaction via backend
(No crypto knowledge required from user)
```

---

## Network Configuration

### Conflux eSpace (Primary)
```
Network Name: Conflux eSpace
RPC URL: https://evm.confluxrpc.com
Chain ID: 71
Currency Symbol: CFX
Block Explorer: https://evm.confluxscan.io
```

**Why eSpace?**
- EVM-compatible (standard Ethereum tools work)
- Gas Sponsorship support
- Easy MetaMask integration

### Conflux Core Space (Optional, Future)
```
Network Name: Conflux Core
RPC URL: https://main.confluxrpc.com
Chain ID: 1029
Currency: CFX
Block Explorer: https://confluxscan.io
```

**When to use**: Higher security requirements, larger placements

---

## Gas & Sponsorship Model

### Current Setup (Company Pays)
```
Company deploys smart contract
Company sets gas sponsorship
When student verifies → Backend pays gas
Cost: ~0.0001 CFX per verification (~$0.0001)
Annual cost: Negligible for company
```

**Smart Contract**:
```solidity
// Enable gas sponsorship
event GasSponsored(address indexed student, uint256 amount);
```

### User Experience
```
Student: Clicks "Verify Placement"
↓
Backend: Calls smart contract with sponsorship
↓
Student: Sees result instantly (no wallet prompts)
↓
Company: Pays gas (transparent, ~$0.01 per 100 verifications)
```

---

## API Authentication Flow

### Company Registration
```
POST /api/auth/company/register
{
  "walletAddress": "0x...",
  "companyName": "Tech Corp",
  "registrationNumber": "REG123",
  "industry": "IT"
}
```

### Company Login (Sign Message)
```
1. Frontend: GET /api/auth/nonce → receives random string
2. User: Signs message with MetaMask
3. Frontend: POST /api/auth/verify-signature with signed message
4. Backend: Verifies signature = wallet owner
5. Backend: Issues JWT token
```

**Code**:
```javascript
// Frontend
const message = "Sign to verify ownership";
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, account]
});

// Backend validates
const recoveredAddress = ethers.utils.recoverAddress(message, signature);
if (recoveredAddress === walletAddress) {
  // Login successful, issue JWT
}
```

### Student Verification (No Login)
```
POST /api/verify/placement
{
  "studentName": "John Doe",
  "studentEmail": "john@email.com"
}
↓
Backend queries smart contract
↓
Returns: All placements for this student
```

---

## Smart Contract Interaction Pattern

### Company Posting Placement
```javascript
// Company wallet connects to app
const contract = new ethers.Contract(
  PLACEMENT_CONTRACT_ADDRESS,
  PLACEMENT_ABI,
  signer // Company's signer
);

const tx = await contract.postPlacement(
  "Student Name",
  "student@email.com",
  "Software Engineer",
  50000, // salary in USD
  Math.floor(Date.now() / 1000) // joining date
);

// Transaction recorded on-chain
// Gas paid by company (or sponsored)
```

### Student Querying Placement
```javascript
// Anyone can read (no signer needed)
const contract = new ethers.Contract(
  PLACEMENT_CONTRACT_ADDRESS,
  PLACEMENT_ABI,
  provider // public RPC provider
);

const placements = await contract.getPlacementsByStudent(
  "John Doe",
  "john@email.com"
);

// Returns: [
//   {
//     companyName: "Tech Corp",
//     role: "Engineer",
//     salary: 50000,
//     joinDate: 1704067200,
//     verified: true
//   }
// ]
```

---

## Wallet Setup Instructions (for Documentation)

### For Companies
1. Download MetaMask extension
2. Create new wallet (save seed phrase safely)
3. Add Conflux eSpace network:
   - RPC: https://evm.confluxrpc.com
   - Chain ID: 71
4. Request testnet CFX (if on testnet)
5. Register company via web app

### For Students
- No wallet needed (email-based verification)
- Or optionally connect MetaMask for on-chain record

### For Parents
- No setup needed
- Visit website, search placement center name
- View data publicly

---

## Environment Variables (.env)

```
CONFLUX_RPC_URL=https://evm.confluxrpc.com
CONFLUX_CHAIN_ID=71
PLACEMENT_CONTRACT_ADDRESS=0x...
CONTRACT_OWNER_PRIVATE_KEY=0x... (for backend)
JWT_SECRET=your-secret-key
DATABASE_URL=mongodb://...
```

---

## Security Notes

1. **Never expose private keys** in frontend code
2. **Backend only**: Store contract owner's private key
3. **Frontend**: Use MetaMask for user interactions (never ask for private key)
4. **RPC Endpoint**: Use public endpoint (free tier) or dedicated service
5. **Smart Contract**: Deployed once, immutable code (use proxy pattern for upgrades)

---

## Testing Wallets (Testnet)

If using Conflux testnet:
```
Network: Conflux testnet
RPC: https://testnet-evm-rpc.confluxrpc.com
Faucet: https://confluxscan.io/faucet (request testnet CFX)
```

**Test Company Wallet**:
- Address: 0x... (your test wallet)
- Has testnet CFX for gas

**Test Student Verification**:
- No wallet needed
- Query public smart contract

---

## Next: Smart Contract Specifications
See `02-SMART-CONTRACT-SPECS.md` for contract functions and deployment details.
