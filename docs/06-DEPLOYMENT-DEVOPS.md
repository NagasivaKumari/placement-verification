# Deployment, Docker & DevOps Guide

## Tech Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| **Blockchain** | Conflux eSpace | EVM-compatible |
| **Smart Contract** | Solidity | 0.8.19+ |
| **Backend** | Node.js + Express | 18.x+ |
| **Frontend** | React + Vite | 18.x+ |
| **Database** | MongoDB | 5.0+ |
| **Web3 Library** | ethers.js | 6.x+ |
| **API Client** | Axios | 1.x+ |
| **Containerization** | Docker | Latest |
| **Orchestration** | Docker Compose | 2.x+ |

---

## Backend Docker Setup

### Dockerfile (Backend)
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Security: Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### .dockerignore
```
node_modules
npm-debug.log
.env.local
.git
.gitignore
README.md
```

### docker-compose.yml (Full Stack)
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0-alpine
    container_name: placement-db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: placement-api
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/placement-db?authSource=admin
      CONFLUX_RPC_URL: https://evm.confluxrpc.com
      CONFLUX_CHAIN_ID: 71
      PLACEMENT_CONTRACT_ADDRESS: ${PLACEMENT_CONTRACT_ADDRESS}
      PRIVATE_KEY: ${PRIVATE_KEY}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    volumes:
      - ./backend/src:/app/src
    healthcheck:
      test: curl -f http://localhost:3000/api/health || exit 1
      interval: 10s
      timeout: 5s
      retries: 3

  # Frontend (Development)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: placement-web
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:3000
      VITE_CONTRACT_ADDRESS: ${PLACEMENT_CONTRACT_ADDRESS}
      VITE_CHAIN_ID: 71
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev

volumes:
  mongo_data:

networks:
  default:
    name: placement-network
```

---

## Build & Run Commands

### Local Development
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Production Build
```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Push to Docker Hub (if needed)
docker tag placement-api:latest yourusername/placement-api:latest
docker push yourusername/placement-api:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## Database Migrations

### MongoDB Indexes
```javascript
// scripts/setupDatabase.js
const { MongoClient } = require('mongodb');

const setup = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  await client.connect();
  const db = client.db('placement-db');
  
  // Create indexes
  await db.collection('companies').createIndex({ walletAddress: 1 }, { unique: true });
  await db.collection('placements').createIndex({ studentEmail: 1 });
  await db.collection('placements').createIndex({ companyWallet: 1 });
  
  console.log('Indexes created');
  await client.close();
};

setup().catch(console.error);
```

### Run Migration
```bash
# Inside backend container
docker-compose exec backend node scripts/setupDatabase.js
```

---

## Smart Contract Deployment

### Hardhat Setup
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    confluxESpace: {
      url: "https://evm.confluxrpc.com",
      accounts: [process.env.PRIVATE_KEY]
    },
    confluxTestnet: {
      url: "https://testnet-evm-rpc.confluxrpc.com",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Deploy Script
```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying PlacementRegistry...");
  
  const PlacementRegistry = await hre.ethers.getContractFactory("PlacementRegistry");
  const contract = await PlacementRegistry.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`✓ Deployed to: ${address}`);
  
  // Save address to config
  const fs = require('fs');
  fs.writeFileSync(
    './config/contractAddress.json',
    JSON.stringify({ address }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy Commands
```bash
# Install Hardhat
cd contracts && npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compile
npx hardhat compile

# Deploy to testnet
PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network confluxTestnet

# Deploy to mainnet
PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network confluxESpace

# Verify contract
npx hardhat verify --network confluxESpace CONTRACT_ADDRESS
```

---

## Environment Variables

### .env (Root)
```
# Blockchain
PRIVATE_KEY=0x... # Company owner's private key
PLACEMENT_CONTRACT_ADDRESS=0x... # Deployed contract address
CONFLUX_RPC_URL=https://evm.confluxrpc.com
CONFLUX_CHAIN_ID=71

# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/placement-db?authSource=admin

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_CHAIN_ID=71
```

---

## Health Checks & Monitoring

### Backend Health Endpoint
```javascript
// routes/health.js
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    mongodb: mongodbConnected ? 'connected' : 'disconnected',
    contract: contractAddress ? 'loaded' : 'not loaded'
  });
});
```

### Docker Healthcheck
```yaml
healthcheck:
  test: curl -f http://localhost:3000/api/health || exit 1
  interval: 10s
  timeout: 5s
  retries: 3
```

---

## Scaling Considerations

### For Production
1. **Database**: Use managed MongoDB (Atlas)
2. **API**: Use load balancer (NGINX)
3. **Frontend**: Use CDN (CloudFlare)
4. **RPC**: Use Conflux's official endpoints or Infura

### Kubernetes Deployment (Optional)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: placement-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: placement-api
  template:
    metadata:
      labels:
        app: placement-api
    spec:
      containers:
      - name: placement-api
        image: yourusername/placement-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: placement-secrets
              key: mongodb-uri
        - name: PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: placement-secrets
              key: private-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## CI/CD Pipeline (GitHub Actions)

### .github/workflows/deploy.yml
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker-compose build
    
    - name: Run tests
      run: docker-compose run backend npm test
    
    - name: Push to registry
      run: |
        docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker-compose push
    
    - name: Deploy to production
      run: |
        ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
      env:
        SSH_KEY: ${{ secrets.SSH_KEY }}
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# View logs
docker-compose logs mongodb

# Test connection
docker-compose exec backend mongosh "mongodb://admin:password123@mongodb:27017"
```

### Contract Interaction Issues
```bash
# Verify contract address is set
echo $PLACEMENT_CONTRACT_ADDRESS

# Test RPC connection
curl https://evm.confluxrpc.com -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Frontend API Connection
```javascript
// Debug in console
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## Security Best Practices

1. **Never commit .env** to git (use .env.example)
2. **Use secrets management** (GitHub Secrets, AWS Secrets Manager)
3. **Rotate JWT secrets** regularly
4. **Use HTTPS** in production
5. **Enable CORS** only for trusted domains
6. **Rate limit** API endpoints
7. **Validate** all user inputs
8. **Use non-root user** in Docker

---

## Backup & Disaster Recovery

### MongoDB Backup
```bash
# Backup database
docker-compose exec mongodb mongodump --uri="mongodb://admin:password123@localhost:27017" --out=/backup

# Restore database
docker-compose exec mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017" /backup
```

---

## Next: Development Getting Started

See README.md for step-by-step development setup instructions.
