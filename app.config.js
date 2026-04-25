/**
 * Expo config (single source of truth). EAS Build reads this file; use `eas.json` → `env` for cloud `EXPO_PUBLIC_*`.
 * @type {import('@expo/config').ExpoConfig}
 */
module.exports = {
  name: 'CxCix',
  /** Must match the Expo project slug linked to `extra.eas.projectId` (EAS error if mismatched). */
  slug: 'CxCix',
  scheme: 'cxcix',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/ui/splash-aapt.png',
    resizeMode: 'contain',
    backgroundColor: '#6366F1',
  },
  ios: {
    bundleIdentifier: 'com.cxcix.app',
    supportsTablet: true,
    infoPlist: {
      UIBackgroundModes: ['voip', 'audio', 'remote-notification'],
      NSMicrophoneUsageDescription:
        'Allow CxCix for calls, voice messages, and the microphone.',
      NSCameraUsageDescription: 'Allow CxCix to use the camera for video calls.',
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: 'com.cxcix.app',
    versionCode: 1,
    usesCleartextTraffic: true,
    permissions: [
      'INTERNET',
      'CAMERA',
      'RECORD_AUDIO',
      'MODIFY_AUDIO_SETTINGS',
      'ACCESS_NETWORK_STATE',
      'WAKE_LOCK',
      'FOREGROUND_SERVICE',
      'POST_NOTIFICATIONS',
      'VIBRATE',
      'BLUETOOTH',
      'BLUETOOTH_CONNECT',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#6366F1',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: '899eecfa-7bac-46f7-96df-a5aaf25213bd',
    },
  },
  owner: 'furqan_jee',
  plugins: [
    'expo-font',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow CxCix to access your photos for your profile picture.',
        cameraPermission: 'Allow CxCix to take a profile photo.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow CxCix to attach your current location to replies.',
        isAndroidBackgroundLocationEnabled: false,
        isIosBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: 'Allow CxCix to record and send voice messages.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#6366F1',
        defaultChannel: 'default',
        sounds: [],
        enableBackgroundRemoteNotifications: true,
      },
    ],
    './plugins/withDailyAndroidService.js',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
        ios: {
          deploymentTarget: '15.1',
        },
      },
    ],
    '@react-native-community/datetimepicker',
  ],
};
