/**
 * Expo CLI uses AppleScript to detect/focus Simulator. macOS often blocks Apple Events
 * from embedded terminals (Cursor, VS Code) with error -1743, which crashes `expo start`
 * when pressing "i". This patch falls back to `pgrep` and ignores activate failures.
 *
 * Re-run after `npm install`: `node scripts/patch-expo-apple-events.js`
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ensurePath = path.join(
  root,
  'node_modules/expo/node_modules/@expo/cli/build/src/start/platforms/ios/ensureSimulatorAppRunning.js',
);
const appleDevicePath = path.join(
  root,
  'node_modules/expo/node_modules/@expo/cli/build/src/start/platforms/ios/AppleDeviceManager.js',
);

function patchEnsure() {
  let s = fs.readFileSync(ensurePath, 'utf8');
  if (s.includes('[CxCix] pgrep fallback')) {
    console.log('[patch-expo-apple-events] ensureSimulatorAppRunning: already patched');
    return;
  }
  // Expo source uses Unicode apostrophe (U+2019) in "isn't"
  const ap = String.fromCharCode(0x2019);
  const needle = `    } catch (error) {
        if (error.message.includes('Application isn${ap}t running')) {
            return false;
        }
        throw error;
    }`;
  if (!s.includes(needle)) {
    console.warn('[patch-expo-apple-events] ensureSimulatorAppRunning: pattern not found; skip');
    return;
  }
  const replacement = `    } catch (error) {
        if (error.message.includes('Application isn${ap}t running')) {
            return false;
        }
        // [CxCix] pgrep fallback when Apple Events blocked (-1743), e.g. Cursor terminal
        const errText = String(error.stderr || '') + String(error.message || '');
        if (errText.includes('-1743') || errText.includes('Not authorised')) {
            try {
                const { execSync } = require('child_process');
                execSync('pgrep -x Simulator', { stdio: 'ignore' });
                return true;
            } catch {
                return false;
            }
        }
        throw error;
    }`;
  fs.writeFileSync(ensurePath, s.replace(needle, replacement), 'utf8');
  console.log('[patch-expo-apple-events] ensureSimulatorAppRunning: patched');
}

function patchActivate() {
  let s = fs.readFileSync(appleDevicePath, 'utf8');
  if (s.includes('[CxCix] activate fallback')) {
    console.log('[patch-expo-apple-events] AppleDeviceManager: already patched');
    return;
  }
  const needle = `    async activateWindowAsync() {
        await (0, _ensureSimulatorAppRunning.ensureSimulatorAppRunningAsync)(this.device);
        // TODO: Focus the individual window
        await _osascript().execAsync(\`tell application "Simulator" to activate\`);
    }`;
  if (!s.includes(needle)) {
    console.warn('[patch-expo-apple-events] AppleDeviceManager: activateWindowAsync pattern not found; skip');
    return;
  }
  const replacement = `    async activateWindowAsync() {
        await (0, _ensureSimulatorAppRunning.ensureSimulatorAppRunningAsync)(this.device);
        // TODO: Focus the individual window
        try {
            await _osascript().execAsync(\`tell application "Simulator" to activate\`);
        } catch (error) {
            // [CxCix] activate fallback
            const errText = String(error.stderr || '') + String(error.message || '');
            if (errText.includes('-1743') || errText.includes('Not authorised')) {
                return;
            }
            throw error;
        }
    }`;
  fs.writeFileSync(appleDevicePath, s.replace(needle, replacement), 'utf8');
  console.log('[patch-expo-apple-events] AppleDeviceManager.activateWindowAsync: patched');
}

try {
  if (fs.existsSync(ensurePath)) patchEnsure();
  if (fs.existsSync(appleDevicePath)) patchActivate();
} catch (e) {
  console.error('[patch-expo-apple-events]', e.message);
  process.exit(1);
}
