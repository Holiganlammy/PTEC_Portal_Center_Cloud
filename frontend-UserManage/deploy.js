const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('Starting deployment process...\n');

// 1. Build
console.log('Building application...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Copy static files
console.log('\nCopying static files...');
const staticSource = path.join(process.cwd(), '.next', 'static');
const staticDest = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');

if (fs.existsSync(staticSource)) {
  fs.copySync(staticSource, staticDest);
  console.log('Static files copied');
} else {
  console.log('No static files found');
}

// 3. Copy public files
console.log('\nCopying public files...');
const publicSource = path.join(process.cwd(), 'public');
const publicDest = path.join(process.cwd(), '.next', 'standalone', 'public');

if (fs.existsSync(publicSource)) {
  fs.copySync(publicSource, publicDest);
  console.log('Public files copied');
} else {
  console.log('No public files found');
}

console.log('\nDeployment ready!');
console.log('Start with: cd .next/standalone && set PORT=33003 && node server.js\n');