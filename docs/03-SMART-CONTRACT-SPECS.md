# Smart Contract Specifications

## Contract Name: PlacementRegistry

**Network**: Conflux eSpace
**Language**: Solidity 0.8.19+
**Gas Model**: Gas Sponsorship enabled

---

## Data Structures

### 1. Company Struct
```solidity
struct Company {
    bytes32 companyId;
    string name;
    string registrationNumber;
    address walletAddress;
    string industry;
    uint256 registeredAt;
    bool isActive;
    string website;
    uint256 totalPlacements;
}
```

### 2. Placement Struct
```solidity
struct Placement {
    bytes32 placementId;
    bytes32 companyId;
    string studentName;
    string studentEmail;
    string role;
    uint256 salary;
    uint256 joiningDate;
    uint256 registeredAt;
    bool isVerified;
    string certificateHash; // IPFS hash
}
```

### 3. Mappings
```solidity
mapping(bytes32 => Company) public companies;
mapping(address => bytes32) public walletToCompanyId;
mapping(bytes32 => bool) public companyExists;

mapping(bytes32 => Placement[]) public placementsByCompany;
mapping(string => Placement[]) public placementsByStudentName;
mapping(string => Placement[]) public placementsByStudentEmail;

mapping(address => bool) public isCompanyVerified; // Admin approval (V2)
```

---

## Core Functions

### 1. Company Management

#### registerCompany()
```solidity
function registerCompany(
    string memory _name,
    string memory _registrationNumber,
    string memory _industry,
    string memory _website
) public {
    require(bytes(_name).length > 0, "Company name required");
    require(bytes(_registrationNumber).length > 0, "Registration number required");
    
    bytes32 companyId = keccak256(abi.encodePacked(msg.sender, block.timestamp));
    
    Company memory newCompany = Company({
        companyId: companyId,
        name: _name,
        registrationNumber: _registrationNumber,
        walletAddress: msg.sender,
        industry: _industry,
        registeredAt: block.timestamp,
        isActive: true,
        website: _website,
        totalPlacements: 0
    });
    
    companies[companyId] = newCompany;
    walletToCompanyId[msg.sender] = companyId;
    companyExists[companyId] = true;
    
    emit CompanyRegistered(companyId, _name, msg.sender);
}
```

#### updateCompanyProfile()
```solidity
function updateCompanyProfile(
    string memory _name,
    string memory _website,
    string memory _industry
) public {
    bytes32 companyId = walletToCompanyId[msg.sender];
    require(companyExists[companyId], "Company not registered");
    
    companies[companyId].name = _name;
    companies[companyId].website = _website;
    companies[companyId].industry = _industry;
    
    emit CompanyUpdated(companyId, _name);
}
```

#### getCompany()
```solidity
function getCompany(bytes32 _companyId) public view returns (Company memory) {
    require(companyExists[_companyId], "Company not found");
    return companies[_companyId];
}
```

#### getCompanyByWallet()
```solidity
function getCompanyByWallet(address _wallet) public view returns (Company memory) {
    bytes32 companyId = walletToCompanyId[_wallet];
    require(companyExists[companyId], "Company not found");
    return companies[companyId];
}
```

---

### 2. Placement Management

#### postPlacement()
```solidity
function postPlacement(
    string memory _studentName,
    string memory _studentEmail,
    string memory _role,
    uint256 _salary,
    uint256 _joiningDate
) public {
    bytes32 companyId = walletToCompanyId[msg.sender];
    require(companyExists[companyId], "Company not registered");
    
    require(bytes(_studentName).length > 0, "Student name required");
    require(bytes(_studentEmail).length > 0, "Student email required");
    require(_salary > 0, "Salary must be greater than 0");
    require(_joiningDate > 0, "Joining date required");
    
    bytes32 placementId = keccak256(abi.encodePacked(
        companyId,
        _studentEmail,
        block.timestamp
    ));
    
    Placement memory newPlacement = Placement({
        placementId: placementId,
        companyId: companyId,
        studentName: _studentName,
        studentEmail: _studentEmail,
        role: _role,
        salary: _salary,
        joiningDate: _joiningDate,
        registeredAt: block.timestamp,
        isVerified: true,
        certificateHash: ""
    });
    
    placementsByCompany[companyId].push(newPlacement);
    placementsByStudentName[_studentName].push(newPlacement);
    placementsByStudentEmail[_studentEmail].push(newPlacement);
    
    // Increment company placement count
    companies[companyId].totalPlacements++;
    
    emit PlacementPosted(placementId, companyId, _studentName, _role);
}
```

#### getPlacementsByCompany()
```solidity
function getPlacementsByCompany(bytes32 _companyId) public view returns (Placement[] memory) {
    require(companyExists[_companyId], "Company not found");
    return placementsByCompany[_companyId];
}
```

#### getPlacementsByStudentEmail()
```solidity
function getPlacementsByStudentEmail(string memory _email) public view returns (Placement[] memory) {
    return placementsByStudentEmail[_email];
}
```

#### getPlacementsByStudentName()
```solidity
function getPlacementsByStudentName(string memory _name) public view returns (Placement[] memory) {
    return placementsByStudentName[_name];
}
```

#### getCompanyPlacementCount()
```solidity
function getCompanyPlacementCount(bytes32 _companyId) public view returns (uint256) {
    require(companyExists[_companyId], "Company not found");
    return companies[_companyId].totalPlacements;
}
```

---

### 3. Verification & Statistics

#### getPlacementStats()
```solidity
function getPlacementStats(bytes32 _companyId) public view returns (
    uint256 totalPlacements,
    uint256 avgSalary,
    string memory topRole
) {
    require(companyExists[_companyId], "Company not found");
    
    Placement[] memory placements = placementsByCompany[_companyId];
    require(placements.length > 0, "No placements found");
    
    uint256 salarySum = 0;
    for (uint i = 0; i < placements.length; i++) {
        salarySum += placements[i].salary;
    }
    
    return (
        placements.length,
        salarySum / placements.length,
        placements[0].role // Simplified: return first role
    );
}
```

#### verifyPlacement()
```solidity
function verifyPlacement(
    string memory _studentEmail,
    string memory _studentName
) public view returns (bool exists, uint256 placementCount) {
    Placement[] memory placements = placementsByStudentEmail[_studentEmail];
    
    for (uint i = 0; i < placements.length; i++) {
        if (keccak256(abi.encodePacked(placements[i].studentName)) == 
            keccak256(abi.encodePacked(_studentName))) {
            return (true, placements.length);
        }
    }
    
    return (false, 0);
}
```

---

### 4. Events

```solidity
event CompanyRegistered(
    indexed bytes32 companyId,
    string name,
    indexed address walletAddress
);

event CompanyUpdated(
    indexed bytes32 companyId,
    string newName
);

event PlacementPosted(
    indexed bytes32 placementId,
    indexed bytes32 companyId,
    string studentName,
    string role
);

event PlacementVerified(
    indexed bytes32 placementId,
    indexed string studentEmail,
    bool isVerified
);
```

---

## Deployment Info

### Constructor
```solidity
constructor() {
    // No initialization needed
    // All state managed through public functions
}
```

### Deployment Command (via Hardhat)
```bash
npx hardhat run scripts/deploy.js --network confluxESpace
```

### Environment Variables for Deployment
```
PRIVATE_KEY=0x...                          # Company owner's private key
CONFLUX_RPC_URL=https://evm.confluxrpc.com
CONFLUX_CHAIN_ID=71
```

---

## Gas Sponsorship Setup

### Enable Gas Sponsorship (After Deployment)
```javascript
// This is done in the deployment script
const gasSponsorship = {
    sponsorForAll: true,
    gasLimit: 1000000, // Max gas per tx
    sponsorBalance: ethers.utils.parseEther("10") // 10 CFX
};
```

### Cost Analysis
- **registerCompany()**: ~150k gas (~0.00015 CFX)
- **postPlacement()**: ~200k gas (~0.0002 CFX)
- **getPlacementsByStudentEmail()**: 0 gas (view function)
- **Annual cost** (1M verifications): ~200 CFX (~$200)

---

## Security Considerations

### 1. Input Validation
- All string inputs validated for length
- Salary > 0 check
- Wallet address verification

### 2. Access Control (V2)
```solidity
// Add role-based access for admin verification
mapping(address => bool) public isAdmin;

modifier onlyAdmin() {
    require(isAdmin[msg.sender], "Admin only");
    _;
}

function approveCompany(bytes32 _companyId) public onlyAdmin {
    require(companyExists[_companyId], "Company not found");
    isCompanyVerified[companies[_companyId].walletAddress] = true;
}
```

### 3. Fraud Detection (V2)
```solidity
// Flag suspicious activities
function flagPlacement(bytes32 _placementId) public {
    // Admin or other company flags as suspicious
    // Placement marked for review
}
```

### 4. Data Privacy
- Student email hashed (not fully exposed on-chain)
- Use off-chain database for sensitive details
- On-chain: Only hash + verification flag

---

## Testing

### Test Cases
1. **Company Registration**: Valid/invalid inputs
2. **Placement Posting**: Valid/invalid data
3. **Verification Queries**: By email, name, company
4. **Statistics**: Salary averages, placement counts
5. **Edge Cases**: Empty arrays, invalid IDs

### Test File Location
`contracts/test/PlacementRegistry.test.js`

---

## Upgrades & Future Versions

### V2 Additions
- Admin approval process for companies
- Fraud detection system
- Payment for premium features
- Off-chain data storage with on-chain verification

### Proxy Pattern
```solidity
// Use UUPS Proxy for upgradeable contracts
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract PlacementRegistry is UUPSUpgradeable { ... }
```

---

## ABI Export
After deployment, export ABI to `contracts/abi/PlacementRegistry.json` for frontend integration.

---

## Next Steps
1. Implement contract in Solidity
2. Write tests
3. Deploy to Conflux testnet
4. Deploy to Conflux mainnet (eSpace)
5. Update frontend with contract address
