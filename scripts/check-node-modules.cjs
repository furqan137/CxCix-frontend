#!/usr/bin/env node
/**
 * Runs before `npm run start` (prestart). Fails fast if dependencies are missing.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const expoPkg = path.join(root, 'node_modules', 'expo', 'package.json');
if (!fs.existsSync(expoPkg)) {
  // eslint-disable-next-line no-console
  console.error(
    '\n[cxcix] Dependencies are missing (no node_modules/expo).\n' +
      '  From this folder run:\n' +
      '    npm install\n' +
      '  Then:\n' +
      '    npm run start\n' +
      '  (Use npm run start — not npx run start.)\n',
  );
  process.exit(1);
}
