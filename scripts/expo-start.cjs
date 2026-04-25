#!/usr/bin/env node
/**
 * Default: `expo start --go` → **Expo Go** on iOS/Android (no local native build).
 * Pass `-d` / `--dev-client` for a custom dev build. `CXCIX_QUIET_START=1` hides the tip.
 *
 * Uses the **local** `expo` from node_modules (no fragile `npx` + shell).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const expoPkg = path.join(root, 'node_modules', 'expo', 'package.json');
if (!fs.existsSync(expoPkg)) {
  // eslint-disable-next-line no-console
  console.error(
    '\n[cxcix] Expo is not installed in this project.\n' +
      '  Run from CxCix-frontend:\n' +
      '    npm install\n' +
      '  Then start with:\n' +
      '    npm run start\n' +
      '  Do not use: npx run start (different tool).\n',
  );
  process.exit(1);
}

let expoCli;
try {
  expoCli = require.resolve('expo/bin/cli', { paths: [root] });
} catch {
  // eslint-disable-next-line no-console
  console.error('[cxcix] Could not resolve expo/bin/cli. Run: npm install');
  process.exit(1);
}

const userArgs = process.argv.slice(2);
const hasGo = userArgs.includes('--go') || userArgs.includes('-g');
const hasDevClient = userArgs.includes('--dev-client') || userArgs.includes('-d');
const useGoByDefault = !hasGo && !hasDevClient;
const hasConnectionFlag =
  userArgs.includes('--lan') ||
  userArgs.includes('--tunnel') ||
  userArgs.includes('--localhost');

// Default to --tunnel for reliability across simulators/devices.
// This avoids LAN routing / firewall issues where Expo Go can't reach Metro at 192.168.x.x.
const defaultConnectionArgs = useGoByDefault && !hasConnectionFlag ? ['--tunnel'] : [];

const expoArgs = useGoByDefault
  ? ['start', '--go', ...defaultConnectionArgs, ...userArgs]
  : ['start', ...userArgs];

if (process.env.CXCIX_QUIET_START !== '1') {
  const y = '\x1b[33m';
  const d = '\x1b[2m';
  const r = '\x1b[0m';
  const goLine = useGoByDefault
    ? `${y}Expo Go${r} — press ${y}i${r} (iOS) or ${y}a${r} (Android), or scan the QR. Same Wi‑Fi as this machine for LAN API.  ${d}Quiet:${r} CXCIX_QUIET_START=1  ${d}|${r}  ${d}Same without this tip:${r} ${y}npm run start:expo${r}  ${d}|${r}  ${d}Dev build URL mode:${r} ${y}npm run start:devclient${r}`
    : `${y}Development client${r} — open your **CxCix** dev build so it loads this Metro URL.`;
  // eslint-disable-next-line no-console
  console.log(`${d}Tip:${r} ${goLine}\n`);
}

const child = spawn(process.execPath, [expoCli, ...expoArgs], {
  stdio: 'inherit',
  cwd: root,
  env: { ...process.env },
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(typeof code === 'number' ? code : 0);
});
