/**
 * Root entry point for Hostinger Node.js Web App deployment.
 * Forwards execution to the compiled NestJS backend.
 */
const path = require('path');
const fs = require('fs');

const compiledEntry = path.join(__dirname, 'apps', 'api', 'dist', 'main.js');

if (!fs.existsSync(compiledEntry)) {
  console.error(`[Washora Bootstrap Error] Compiled entry file not found at: ${compiledEntry}`);
  console.error('Ensure that "npm run build" has executed successfully before starting the application.');
  process.exit(1);
}

require(compiledEntry);
