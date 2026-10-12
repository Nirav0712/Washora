const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDistDir = path.join(rootDir, 'apps', 'api', 'dist');
const apiEntryFile = path.join(apiDistDir, 'main.js');
const sharedDistDir = path.join(rootDir, 'packages', 'shared', 'dist');
const sharedEntryFile = path.join(sharedDistDir, 'index.js');
const rootDistDir = path.join(rootDir, 'dist');
const rootEntryFile = path.join(rootDistDir, 'main.js');

console.log('[Washora Build Verification] Starting post-build validation...');

// 1. Verify shared package compilation
if (!fs.existsSync(sharedEntryFile)) {
  console.error(`[Washora Build Error] Shared library build missing: ${sharedEntryFile}`);
  process.exit(1);
}
console.log(`[Washora Build Verification] Verified shared package: ${sharedEntryFile}`);

// 2. Verify API compilation in apps/api/dist
if (!fs.existsSync(apiEntryFile)) {
  console.error(`[Washora Build Error] API build missing: ${apiEntryFile}`);
  process.exit(1);
}
console.log(`[Washora Build Verification] Verified API build artifact: ${apiEntryFile}`);

// 3. Mirror apps/api/dist to root dist/ for root-level deployment compatibility
try {
  fs.cpSync(apiDistDir, rootDistDir, { recursive: true });
  console.log(`[Washora Build Verification] Mirrored compiled API to root dist: ${rootDistDir}`);
} catch (err) {
  console.error(`[Washora Build Error] Failed to mirror API to root dist: ${err.message}`);
  process.exit(1);
}

// 4. Verify root dist entry file exists
if (!fs.existsSync(rootEntryFile)) {
  console.error(`[Washora Build Error] Root dist entry missing: ${rootEntryFile}`);
  process.exit(1);
}

console.log(`[Washora Build Verification] SUCCESS: Verified entry file at: ${rootEntryFile}`);
console.log(`[Washora Build Verification] SUCCESS: Verified entry file at: ${apiEntryFile}`);
