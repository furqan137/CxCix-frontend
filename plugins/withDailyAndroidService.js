const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Daily.co foreground meeting service (required for reliable Android meeting lifecycle).
 */
function withDailyAndroidService(config) {
  return withAndroidManifest(config, (configMod) => {
    const { manifest } = configMod.modResults;
    if (!manifest.application?.[0]) return configMod;
    const app = manifest.application[0];
    if (!app.service) app.service = [];
    const name = 'com.daily.reactlibrary.DailyOngoingMeetingForegroundService';
    const exists = app.service.some(
      (s) => s?.$?.['android:name'] === name || s?.$?.['android:name'] === `.${name.split('.').pop()}`,
    );
    if (!exists) {
      app.service.push({
        $: {
          'android:name': name,
          'android:exported': 'false',
        },
      });
    }
    return configMod;
  });
}

module.exports = withDailyAndroidService;
