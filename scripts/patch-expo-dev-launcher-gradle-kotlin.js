/**
 * expo-dev-launcher's included Gradle build pins kotlin("jvm") 1.9.x; RN 0.81+ uses Kotlin 2.1 metadata.
 * EAS runs `eas-build-post-install` after prebuild + cache restore and before `gradlew` — use that hook
 * so the patch survives EAS cache overwriting node_modules (see Expo Android build steps 6–11).
 *
 * CLI: `node scripts/patch-expo-dev-launcher-gradle-kotlin.js`
 */
const fs = require('fs');
const path = require('path');

const TARGET_KOTLIN_JVM = '2.1.20';

/**
 * @param {string} [projectRoot] defaults to repo root (parent of `scripts/`)
 * @returns {{ ok: boolean, reason?: string, path?: string }}
 */
function applyExpoDevLauncherKotlinPatch(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..');
  const file = path.join(
    root,
    'node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin/build.gradle.kts',
  );
  if (!fs.existsSync(file)) {
    return { ok: true, reason: 'expo-dev-launcher not installed; skip' };
  }
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(
    /kotlin\("jvm"\) version "[\d.]+"/,
    `kotlin("jvm") version "${TARGET_KOTLIN_JVM}"`,
  );
  if (before === after) {
    if (before.includes(`kotlin("jvm") version "${TARGET_KOTLIN_JVM}"`)) {
      return { ok: true, reason: `already at ${TARGET_KOTLIN_JVM}`, path: file };
    }
    return { ok: true, reason: 'pattern not found; skip', path: file };
  }
  fs.writeFileSync(file, after, 'utf8');
  return { ok: true, reason: `patched to ${TARGET_KOTLIN_JVM}`, path: file };
}

function logResult(r) {
  const label = '[patch-expo-dev-launcher-gradle-kotlin]';
  if (r.reason) console.log(`${label} ${r.reason}${r.path ? ' — ' + r.path : ''}`);
}

if (require.main === module) {
  try {
    logResult(applyExpoDevLauncherKotlinPatch());
  } catch (e) {
    console.error('[patch-expo-dev-launcher-gradle-kotlin]', e.message);
    process.exit(1);
  }
}

module.exports = {
  applyExpoDevLauncherKotlinPatch,
  TARGET_KOTLIN_JVM,
};
