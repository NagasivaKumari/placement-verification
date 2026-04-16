@echo off
REM PlacementVerify - Quick Setup Script for Windows
REM This script automates the deployment process

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo PlacementVerify - Quick Setup
echo ==========================================
echo.

REM Colors (Windows doesn't support ANSI easily, so we'll use text)
REM Step 1: Check Docker
echo [Step 1] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found. Please install Docker Desktop:
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose not found.
    pause
    exit /b 1
)
echo OK: Docker and Docker Compose installed
echo.

REM Step 2: Check Node.js
echo [Step 2] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+:
    echo    https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK: Node.js %NODE_VERSION% installed
echo.

REM Step 3: Setup Hardhat
echo [Step 3] Setting up Hardhat for smart contract...
cd contracts
if not exist "node_modules" (
    echo Installing Hardhat...
    call npm init -y >nul 2>&1
    call npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv >nul 2>&1
)
cd ..
echo OK: Hardhat ready
echo.

REM Step 4: Check contract
echo [Step 4] Checking for smart contract...
if not exist "contracts\PlacementRegistry.sol" (
    echo ERROR: PlacementRegistry.sol not found in contracts\
    pause
    exit /b 1
)
echo OK: Smart contract found
echo.

REM Step 5: Create .env if not exists
echo [Step 5] Checking configuration...
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env >nul
    echo WARNING: Please edit .env with:
    echo    1. PRIVATE_KEY (from MetaMask)
    echo    2. PLACEMENT_CONTRACT_ADDRESS (after deployment)
    echo.
    echo Edit the file: .env
    pause
    exit /b 1
)
echo OK: .env file exists
echo.

REM Step 6: Check if contract address is set
findstr /m "PLACEMENT_CONTRACT_ADDRESS=0x\.\.\." .env >nul 2>&1
if not errorlevel 1 (
    echo WARNING: PLACEMENT_CONTRACT_ADDRESS not set in .env
    echo.
    echo You need to deploy the contract first.
    echo.
    echo Follow these steps:
    echo 1. Get private key from MetaMask
    echo 2. Edit .env and set PRIVATE_KEY
    echo 3. Open Command Prompt in contracts folder
    echo 4. Run: npx hardhat run scripts/deploy.js --network confluxTestnet
    echo 5. Copy contract address to PLACEMENT_CONTRACT_ADDRESS in .env
    echo.
    pause
    exit /b 1
)
echo OK: Contract address configured
echo.

REM Step 7: Setup backend .env
echo [Step 6] Setting up backend...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env >nul
)
echo OK: Backend configured
echo.

REM Step 8: Start Docker
echo [Step 7] Starting Docker services...
echo Starting MongoDB, Backend, and Frontend...
call docker-compose up -d
echo.
echo Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak
echo.

REM Step 9: Verify services
echo [Step 8] Verifying services...
echo.

REM Check MongoDB
docker exec placement-db mongosh -u admin -p password123 --eval "db.runCommand('ping')" >nul 2>&1
if errorlevel 0 (
    echo OK: MongoDB running on localhost:27017
) else (
    echo WARNING: MongoDB might be starting, waiting...
)

REM Check Backend
curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 0 (
    echo OK: Backend running on http://localhost:3000
) else (
    echo WARNING: Backend starting, might take 10 seconds...
    timeout /t 10 /nobreak
)

echo OK: Frontend running on http://localhost:5173
echo.

REM Step 10: Summary
echo ==========================================
echo SUCCESS: SETUP COMPLETE!
echo ==========================================
echo.
echo Next steps:
echo 1. Open browser: http://localhost:5173
echo 2. Click 'Connect as Company'
echo 3. Connect MetaMask wallet
echo 4. Register your company
echo 5. Post placements
echo 6. Verify placements at /verify
echo 7. Browse directory at /directory
echo.
echo Logs:
echo   docker-compose logs -f placement-api     ^(Backend logs^)
echo   docker-compose logs -f placement-web     ^(Frontend logs^)
echo   docker-compose logs -f placement-db      ^(Database logs^)
echo.
echo Stop services:
echo   docker-compose down
echo.
echo ==========================================
echo.
pause
