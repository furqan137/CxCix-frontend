import './global.css';

import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { initFirebaseAuthListener } from './src/services/firebaseAuthService';
import { promptForPushPermissionsOnFirstLaunch } from './src/services/pushNotifications';

void ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    initFirebaseAuthListener();
    void promptForPushPermissionsOnFirstLaunch();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
