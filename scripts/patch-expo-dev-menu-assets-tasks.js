/**
 * AGP 8.9+ no longer exposes `packageDebugAssets` on the project; expo-dev-menu still uses
 * `project.afterEvaluate { packageDebugAssets.dependsOn ... }` (see expo#36217).
 * Hook the same work via `tasks.findByName` and both legacy `package*` and `merge*` task names.
 *
 * Called from `apply-eas-android-patches.js` and postinstall; EAS: `eas-build-post-install` after cache.
 */
const fs = require('fs');
const path = require('path');

const OLD = `project.afterEvaluate {
  packageDebugAssets.dependsOn copyAssets
  packageReleaseWithDevMenuAssets.dependsOn copyAssets
}`;

const REPLACEMENT = `project.afterEvaluate {
  // AGP 8.9+ library modules: use tasks (package*Assets and merge*Assets both exist by version)
  [ 'packageDebugAssets', 'mergeDebugAssets' ].each { n ->
    def t = project.tasks.findByName(n)
    if (t != null) t.dependsOn copyAssets
  }
  [ 'packageReleaseWithDevMenuAssets', 'mergeReleaseWithDevMenuAssets' ].each { n ->
    def t = project.tasks.findByName(n)
    if (t != null) t.dependsOn copyAssets
  }
}`;

/**
 * @param {string} [projectRoot]
 * @returns {{ ok: boolean, reason?: string, path?: string }}
 */
function applyExpoDevMenuPackageAssetsFix(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..');
  const file = path.join(root, 'node_modules/expo-dev-menu/android/build.gradle');
  if (!fs.existsSync(file)) {
    return { ok: true, reason: 'expo-dev-menu not installed; skip' };
  }
  const before = fs.readFileSync(file, 'utf8');
  if (before.includes('tasks.findByName(n)')) {
    return { ok: true, reason: 'already patched', path: file };
  }
  if (!before.includes(OLD)) {
    if (before.includes('mergeDebugAssets') && before.includes('afterEvaluate')) {
      return { ok: true, reason: 'unrecognized build.gradle; may already be fixed upstream', path: file };
    }
    return { ok: true, reason: 'expected afterEvaluate block not found; skip', path: file };
  }
  fs.writeFileSync(file, before.replace(OLD, REPLACEMENT), 'utf8');
  return { ok: true, reason: 'expo-dev-menu afterEvaluate -> tasks.findByName', path: file };
}

function logResult(r) {
  const label = '[patch-expo-dev-menu-assets-tasks]';
  if (r.reason) console.log(`${label} ${r.reason}${r.path ? ' — ' + r.path : ''}`);
}

if (require.main === module) {
  try {
    logResult(applyExpoDevMenuPackageAssetsFix());
  } catch (e) {
    console.error('[patch-expo-dev-menu-assets-tasks]', e.message);
    process.exit(1);
  }
}

module.exports = {
  applyExpoDevMenuPackageAssetsFix,
};
