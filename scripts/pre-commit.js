#!/usr/bin/env node
/**
 * Pre-commit hook script
 * Runs web rebuild before committing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root (where this script is located)
const projectRoot = path.resolve(__dirname, '..');
const webDir = path.join(projectRoot, 'web');

console.log('🔄 Running web rebuild before commit...');
console.log(`   Project root: ${projectRoot}`);
console.log(`   Web directory: ${webDir}`);

// Verify web directory exists
if (!fs.existsSync(webDir)) {
  console.error(`❌ Web directory not found: ${webDir}`);
  process.exit(1);
}

try {
  process.chdir(webDir);
  execSync('npm run rebuild', { stdio: 'inherit' });
  console.log('✅ Web rebuild complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Web rebuild failed:', error.message);
  process.exit(1);
}

