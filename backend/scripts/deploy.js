const path = require('path');
const fs = require('fs');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // 1. Read contract
  const contractPath = path.resolve(__dirname, '../../contracts/PlacementRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  // 2. Compile contract
  const input = {
    language: 'Solidity',
    sources: {
      'PlacementRegistry.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['PlacementRegistry.sol']['PlacementRegistry'];

  // 3. Get ABI and bytecode
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  // 4. Connect to Conflux eSpace
  const provider = new ethers.JsonRpcProvider(process.env.CONFLUX_RPC_URL || 'https://evm.confluxrpc.com');
  
  // 5. Create wallet
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in .env file");
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 6. Create contract factory
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log('Deploying PlacementRegistry contract...');
  
  // 7. Deploy contract
  const deployedContract = await factory.deploy();
  
  await deployedContract.waitForDeployment();

  const contractAddress = await deployedContract.getAddress();

  console.log(`PlacementRegistry contract deployed to: ${contractAddress}`);

  // 8. (Optional) Save artifact
  const artifact = {
    address: contractAddress,
    abi: abi,
  };
  fs.writeFileSync('PlacementRegistry.json', JSON.stringify(artifact, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
