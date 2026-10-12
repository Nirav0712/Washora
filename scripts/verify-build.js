const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDistDir = path.join(rootDir, 'apps', 'api', 'dist');
const sharedDistDir = path.join(rootDir, 'packages', 'shared', 'dist');
const sharedEntryFile = path.join(sharedDistDir, 'index.js');
const rootDistDir = path.join(rootDir, 'dist');

console.log('[Washora Build Verification] Starting post-build validation...');

// 1. Verify shared package compilation
if (!fs.existsSync(sharedEntryFile)) {
  console.error(`[Washora Build Error] Shared library build missing: ${sharedEntryFile}`);
  console.error('Expected @washora/shared to be built before apps/api.');
  process.exit(1);
}
console.log(`[Washora Build Verification] Verified shared package: ${sharedEntryFile}`);

// 2. Locate the actual emitted API entry point in apps/api/dist
if (!fs.existsSync(apiDistDir)) {
  console.error(`[Washora Build Error] Compiled API output directory does not exist: ${apiDistDir}`);
  console.error('NestJS build failed to emit output artifacts. Check if stale .tsbuildinfo suppressed emission.');
  process.exit(1);
}

const candidateRelativePaths = ['main.js', path.join('src', 'main.js')];
let detectedRelativeEntry = null;

for (const relPath of candidateRelativePaths) {
  const candidate = path.join(apiDistDir, relPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    detectedRelativeEntry = relPath;
    break;
  }
}

if (!detectedRelativeEntry) {
  console.error(`[Washora Build Error] Emitted API entry file not found in: ${apiDistDir}`);
  console.error('Checked candidates:');
  candidateRelativePaths.forEach((rel) => {
    console.error(`  - ${path.join(apiDistDir, rel)} (exists: false)`);
  });
  try {
    const contents = fs.readdirSync(apiDistDir);
    console.error(`Found contents in apps/api/dist: ${JSON.stringify(contents)}`);
  } catch (err) {
    console.error(`Failed to read apps/api/dist: ${err.message}`);
  }
  process.exit(1);
}

const apiEntryFile = path.join(apiDistDir, detectedRelativeEntry);
console.log(`[Washora Build Verification] Located emitted API entry point: ${apiEntryFile}`);

// 3. Verify required compiled modules exist alongside entry
const relativeModulePath = detectedRelativeEntry.startsWith('src')
  ? path.join('src', 'app.module.js')
  : 'app.module.js';
const apiModuleFile = path.join(apiDistDir, relativeModulePath);

if (!fs.existsSync(apiModuleFile)) {
  console.error(`[Washora Build Error] Required compiled module missing: ${apiModuleFile}`);
  process.exit(1);
}
console.log(`[Washora Build Verification] Verified required compiled module: ${apiModuleFile}`);

// 4. Mirror complete compiled directory structure to root dist/ for root-level deployment compatibility
try {
  fs.cpSync(apiDistDir, rootDistDir, { recursive: true });
  console.log(`[Washora Build Verification] Successfully mirrored complete API dist to root dist: ${rootDistDir}`);
} catch (err) {
  console.error(`[Washora Build Error] Failed to mirror API dist to root dist: ${err.message}`);
  process.exit(1);
}

// 5. Verify root dist entry file
const rootEntryFile = path.join(rootDistDir, detectedRelativeEntry);
if (!fs.existsSync(rootEntryFile)) {
  console.error(`[Washora Build Error] Root dist entry missing: ${rootEntryFile}`);
  process.exit(1);
}

console.log('[Washora Build Verification] ========================================');
console.log(`[Washora Build Verification] REAL EMITTED API ENTRY: ${apiEntryFile}`);
console.log(`[Washora Build Verification] MIRRORED ROOT ENTRY:     ${rootEntryFile}`);
console.log(`[Washora Build Verification] RELATIVE ENTRY PATH:     ${detectedRelativeEntry.replace(/\\/g, '/')}`);
console.log('[Washora Build Verification] SUCCESS: Production build artifacts verified.');
console.log('[Washora Build Verification] ========================================');
