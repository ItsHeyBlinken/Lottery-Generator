/**
 * Script to prepare files for Coolify deployment
 * Run: node prepare-for-coolify.js
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const outputPath = path.join(__dirname, 'coolify-deploy');

// Create output directory
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Copy HTML file and rename to index.html
const htmlSource = path.join(__dirname, 'download-page.html');
const htmlDest = path.join(outputPath, 'index.html');

if (fs.existsSync(htmlSource)) {
  fs.copyFileSync(htmlSource, htmlDest);
  console.log('✅ Copied download-page.html → index.html');
} else {
  console.error('❌ download-page.html not found!');
}

// Find and copy the .exe file
const exeName = 'PowerBall Lottery Generator Setup.exe';
const exeSource = path.join(distPath, exeName);
const exeDest = path.join(outputPath, exeName);

if (fs.existsSync(exeSource)) {
  fs.copyFileSync(exeSource, exeDest);
  const stats = fs.statSync(exeDest);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Copied ${exeName} (${fileSizeMB} MB)`);
} else {
  console.error(`❌ ${exeName} not found in dist folder!`);
  console.log('   Make sure you run: npm run build:win');
}

console.log('\n📦 Files ready in: coolify-deploy/');
console.log('   Upload this folder to your Coolify static site!');

