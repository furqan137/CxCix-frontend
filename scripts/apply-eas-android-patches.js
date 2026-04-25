/**
 * Run all Android node_modules Gradle patches (EAS: after cache restore, before `gradlew`).
 * CLI: `node scripts/apply-eas-android-patches.js`
 */
const { applyExpoDevLauncherKotlinPatch } = require('./patch-expo-dev-launcher-gradle-kotlin');
const { applyExpoDevMenuPackageAssetsFix } = require('./patch-expo-dev-menu-assets-tasks');

function log(label, r) {
  if (r.reason) console.log(`${label} ${r.reason}${r.path ? ' — ' + r.path : ''}`);
}

function applyAllEasAndroidPatches(projectRoot) {
  log('[apply-eas-android-patches] dev-launcher', applyExpoDevLauncherKotlinPatch(projectRoot));
  log('[apply-eas-android-patches] dev-menu', applyExpoDevMenuPackageAssetsFix(projectRoot));
}

if (require.main === module) {
  try {
    applyAllEasAndroidPatches();
  } catch (e) {
    console.error('[apply-eas-android-patches]', e.message);
    process.exit(1);
  }
}

module.exports = { applyAllEasAndroidPatches };
