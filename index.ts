// Crypto polyfill (WebRTC) — before other imports that use randomness
import 'react-native-get-random-values';

import { NativeModules, Platform } from 'react-native';

if (NativeModules.WebRTCModule != null) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerGlobals } = require('@daily-co/react-native-webrtc') as {
    registerGlobals: () => void;
  };
  registerGlobals();
} else if (__DEV__ && Platform.OS !== 'web') {
  console.warn(
    '[CxCix] Daily / WebRTC native module not found. Use a dev build: npx expo prebuild && npx expo run:ios',
  );
}

// Gesture handler must be first — required by React Navigation + Reanimated
import 'react-native-gesture-handler';
// Reanimated 4: worklets core, then Reanimated (TurboModule init order)
import 'react-native-worklets';
import 'react-native-reanimated';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
