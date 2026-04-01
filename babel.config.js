/**
 * Babel config for Expo + NativeWind v4 + Reanimated.
 * Reanimated plugin must remain last.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
