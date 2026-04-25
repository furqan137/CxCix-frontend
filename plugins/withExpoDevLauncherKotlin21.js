const { withDangerousMod } = require('@expo/config-plugins');
const { applyAllEasAndroidPatches } = require('../scripts/apply-eas-android-patches.js');

/**
 * node_modules Android Gradle fixes (expo-dev-launcher Kotlin, expo-dev-menu AGP 8.9+ tasks).
 * Redundant with eas-build-post-install on EAS, but helps local prebuild.
 */
function withExpoDevLauncherKotlin21(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      applyAllEasAndroidPatches(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);
}

module.exports = withExpoDevLauncherKotlin21;
