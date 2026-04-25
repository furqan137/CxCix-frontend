#!/usr/bin/env node
/**
 * Runs `adb` from Android SDK platform-tools when `adb` is not on PATH.
 * Usage: npm run adb -- devices
 *        npm run adb -- kill-server && npm run adb -- start-server
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function findAdbPath() {
  const envHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const candidates = [];
  if (envHome) {
    candidates.push(path.join(envHome, 'platform-tools', 'adb'));
  }
  if (process.platform === 'darwin') {
    candidates.push(path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb'));
  }
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA;
    if (local) {
      candidates.push(path.join(local, 'Android', 'Sdk', 'platform-tools', 'adb.exe'));
    }
  }
  candidates.push('adb');
  for (const p of candidates) {
    try {
      if (p === 'adb') return p;
      if (fs.existsSync(p)) return p;
    } catch {
      /* continue */
    }
  }
  return 'adb';
}

const adb = findAdbPath();
const args = process.argv.slice(2);
const r = spawnSync(adb, args, { stdio: 'inherit', shell: false });
if (r.error) {
  // eslint-disable-next-line no-console
  console.error(
    '\n[adb] Could not run adb. Install Android Studio (or SDK command-line tools), then either:\n' +
      '  • Add platform-tools to your PATH, or\n' +
      '  • Set ANDROID_HOME to your SDK root (e.g. ~/Library/Android/sdk on macOS).\n',
  );
  process.exit(1);
}
process.exit(typeof r.status === 'number' ? r.status : 1);
