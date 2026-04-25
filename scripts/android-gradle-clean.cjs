#!/usr/bin/env node
/**
 * Runs `./gradlew clean` when `android/` exists (after prebuild).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
if (!fs.existsSync(androidDir)) {
  // eslint-disable-next-line no-console
  console.error('[android] No android/ folder. Run: npx expo prebuild --platform android');
  process.exit(1);
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const r = spawnSync(gradlew, ['clean'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(typeof r.status === 'number' ? r.status : 1);
