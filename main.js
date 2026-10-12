/**
 * Root bootstrap entry for Hostinger / Node.js deployment.
 * Resolves the compiled NestJS backend entry file and boots the application.
 */
const path = require('path');
const fs = require('fs');

function resolveEntry() {
  const candidates = [
    path.join(__dirname, 'dist', 'main.js'),
    path.join(__dirname, 'apps', 'api', 'dist', 'main.js'),
    path.join(__dirname, 'dist', 'apps', 'api', 'src', 'main.js'),
    path.join(__dirname, 'apps', 'api', 'dist', 'src', 'main.js'),
    path.resolve(process.cwd(), 'dist', 'main.js'),
    path.resolve(process.cwd(), 'apps', 'api', 'dist', 'main.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // Diagnostic logging if no candidate was found
  console.error('[Washora Bootstrap Error] No compiled API entry point could be found.');
  console.error('Searched candidate paths:');
  candidates.forEach((c) => console.error(`  - ${c} (exists: false)`));
  console.error(`Current working directory: ${process.cwd()}`);
  console.error(`Bootstrap directory (__dirname): ${__dirname}`);
  try {
    console.error('Directory contents at __dirname:');
    fs.readdirSync(__dirname).forEach((f) => console.error(`  ${f}`));
  } catch (err) {
    console.error(`Failed to list directory contents: ${err.message}`);
  }
  process.exit(1);
}

const targetEntry = resolveEntry();
console.log(`[Washora Bootstrap] Starting application from: ${targetEntry}`);
require(targetEntry);
