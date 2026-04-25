#!/usr/bin/env node
/**
 * Fallback when something runs `node …/start` (e.g. mistaken `npx run start`).
 * Prefer: **npm run start**
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const expoPkg = path.join(root, 'node_modules', 'expo', 'package.json');
if (!fs.existsSync(expoPkg)) {
  // eslint-disable-next-line no-console
  console.error(
    '\n[cxcix] Run **npm install** in this folder first, then:\n' +
      '  npm run start\n' +
      '(Do not use: npx run start — that is a different tool.)\n',
  );
  process.exit(1);
}

const wrapper = path.join(root, 'scripts', 'expo-start.cjs');
const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [wrapper, ...args], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
