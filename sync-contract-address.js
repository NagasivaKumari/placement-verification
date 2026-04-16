// sync-contract-address.js
const fs = require('fs');
const path = require('path');

const backendEnv = path.join(__dirname, 'backend', '.env');
const frontendEnv = path.join(__dirname, 'frontend', '.env');

const envContent = fs.readFileSync(backendEnv, 'utf-8');
// Try all possible keys for contract address
const match = envContent.match(/PLACEMENT_REGISTRY_APP_ID=(.*)/) || envContent.match(/PLACEMENT_STUDENT_APP_ID=(.*)/);

if (match) {
  let frontendContent = fs.existsSync(frontendEnv) ? fs.readFileSync(frontendEnv, 'utf-8') : '';
  // Remove any existing VITE_PLACEMENT_REGISTRY_ADDRESS line
  frontendContent = frontendContent.replace(/VITE_PLACEMENT_REGISTRY_ADDRESS=.*/g, '');
  frontendContent += `\nVITE_PLACEMENT_REGISTRY_ADDRESS=${match[1]}\n`;
  fs.writeFileSync(frontendEnv, frontendContent.trim() + '\n');
  console.log('Synced contract address to frontend/.env');
} else {
  console.error('PLACEMENT_REGISTRY_APP_ID or PLACEMENT_STUDENT_APP_ID not found in backend/.env');
}
