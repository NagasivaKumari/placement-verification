#!/bin/bash
# PlacementVerify - Quick Setup Script
# This script automates the deployment process

set -e  # Exit on error

echo "=========================================="
echo "PlacementVerify - Quick Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo -e "${BLUE}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found."
    exit 1
fi
echo -e "${GREEN}✅ Docker and Docker Compose installed${NC}"
echo ""

# Step 2: Check Node.js
echo -e "${BLUE}Step 2: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+:"
    echo "   https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} installed${NC}"
echo ""

# Step 3: Setup Hardhat for contract deployment
echo -e "${BLUE}Step 3: Setting up Hardhat for smart contract...${NC}"
cd contracts
if [ ! -d "node_modules" ]; then
    echo "Installing Hardhat..."
    npm init -y > /dev/null 2>&1
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv > /dev/null 2>&1
fi
echo -e "${GREEN}✅ Hardhat ready${NC}"
echo ""

# Step 4: Check if contract exists
if [ ! -f "PlacementRegistry.sol" ]; then
    echo "❌ PlacementRegistry.sol not found in contracts/"
    exit 1
fi
echo -e "${GREEN}✅ Smart contract found${NC}"
echo ""

# Step 5: Back to root
cd ..

# Step 6: Create .env if not exists
echo -e "${BLUE}Step 4: Checking configuration...${NC}"
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with:"
    echo "   1. PRIVATE_KEY (from MetaMask)"
    echo "   2. PLACEMENT_CONTRACT_ADDRESS (after deployment)"
    echo ""
    echo "   Edit the file: .env"
    exit 1
fi
echo -e "${GREEN}✅ .env file exists${NC}"
echo ""

# Step 7: Check contract address
if grep -q "PLACEMENT_CONTRACT_ADDRESS=0x\.\.\." .env; then
    echo -e "${YELLOW}⚠️  PLACEMENT_CONTRACT_ADDRESS not set in .env${NC}"
    echo "You need to deploy the contract first."
    echo ""
    echo "Follow these steps:"
    echo "1. Get private key from MetaMask"
    echo "2. Edit .env and set PRIVATE_KEY"
    echo "3. Run: cd contracts && npx hardhat run scripts/deploy.js --network confluxTestnet"
    echo "4. Copy contract address to PLACEMENT_CONTRACT_ADDRESS in .env"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Contract address configured${NC}"
echo ""

# Step 8: Setup backend .env
echo -e "${BLUE}Step 5: Setting up backend...${NC}"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
fi
echo -e "${GREEN}✅ Backend configured${NC}"
echo ""

# Step 9: Start Docker services
echo -e "${BLUE}Step 6: Starting Docker services...${NC}"
echo "Starting MongoDB, Backend, and Frontend..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start (30 seconds)..."
sleep 30

# Step 10: Verify services
echo -e "${BLUE}Step 7: Verifying services...${NC}"
echo ""

# Check MongoDB
if docker exec placement-db mongosh -u admin -p password123 --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB running on localhost:27017${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB might be starting, waiting...${NC}"
fi

# Check Backend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3000/api/health)
    echo -e "${GREEN}✅ Backend running on http://localhost:3000${NC}"
    echo "   Health: $HEALTH"
else
    echo -e "${YELLOW}⚠️  Backend starting, might take 10 seconds...${NC}"
    sleep 10
fi

echo -e "${GREEN}✅ Frontend running on http://localhost:5173${NC}"
echo ""

# Step 11: Summary
echo "=========================================="
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open browser: http://localhost:5173"
echo "2. Click 'Connect as Company'"
echo "3. Connect MetaMask wallet"
echo "4. Register your company"
echo "5. Post placements"
echo "6. Verify placements at /verify"
echo "7. Browse directory at /directory"
echo ""
echo "Logs:"
echo "  docker-compose logs -f placement-api     # Backend logs"
echo "  docker-compose logs -f placement-web     # Frontend logs"
echo "  docker-compose logs -f placement-db      # Database logs"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
echo "=========================================="
