#!/usr/bin/env node
/**
 * Removes generated native Android output so the next `expo prebuild` is fresh.
 * Does NOT remove node_modules (run `npm install` only if you deleted it yourself).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
for (const name of ['android', '.expo']) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log('removed', name);
  }
}
// eslint-disable-next-line no-console
console.log('\nNext: npx expo prebuild --platform android\n      npx expo run:android\n');
