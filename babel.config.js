/**
 * Expo + NativeWind v4 + Reanimated 4.
 * With `react-native-worklets` installed, babel-preset-expo injects
 * `react-native-worklets/plugin` (must be last). Do not add
 * `react-native-reanimated/plugin` here — it breaks plugin order and causes
 * TurboModule / HostFunction errors on Android.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
  };
};
