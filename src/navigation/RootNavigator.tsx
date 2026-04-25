import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountCreatedScreen from '../screens/auth/AccountCreatedScreen';
import CheckEmailScreen from '../screens/auth/CheckEmailScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import SignupProfileScreen from '../screens/auth/SignupProfileScreen';
import SignupSecurityScreen from '../screens/auth/SignupSecurityScreen';
import SignupStepNameScreen from '../screens/auth/SignupStepNameScreen';
import AIModeratorScreen from '../screens/onboarding/AIModeratorScreen';
import AIModeratorIntroScreen from '../screens/onboarding/AIModeratorIntroScreen';
import WelcomeOnboardingScreen from '../screens/onboarding/WelcomeOnboardingScreen';
import SplashScreen from '../screens/SplashScreen';
import { MainStackNavigator } from './MainStack';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import * as Notifications from 'expo-notifications';
import {
  navigateFromPushData,
  registerForPushAndSyncToken,
  startForegroundIncomingCallListener,
  startNotificationResponseListener,
  usePushTokenRefreshOnForeground,
} from '../services/pushNotifications';
import { ensureSocketConnected } from '../api/socket';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Splash → welcome → auth → optional AI onboarding → Main.
 */
export function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  usePushTokenRefreshOnForeground(isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;
    void registerForPushAndSyncToken();
    const unsub = startNotificationResponseListener();
    const unsubForeground = startForegroundIncomingCallListener();
    void ensureSocketConnected().catch(() => {});
    return () => {
      unsub();
      unsubForeground();
    };
  }, [isLoggedIn]);

  /** If the app was opened from a notification (e.g. cold start), deep link after auth + mount. */
  useEffect(() => {
    if (!isLoggedIn) return;
    const t = setTimeout(() => {
      void Notifications.getLastNotificationResponseAsync().then((r) => {
        const d = r?.notification?.request?.content?.data;
        if (d && typeof d === 'object') {
          navigateFromPushData(d as Record<string, unknown>);
        }
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="WelcomeOnboarding" component={WelcomeOnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
        <Stack.Screen name="SignupStepName" component={SignupStepNameScreen} />
        <Stack.Screen name="SignupSecurity" component={SignupSecurityScreen} />
        <Stack.Screen name="SignupProfile" component={SignupProfileScreen} />
        <Stack.Screen name="AIModeratorIntro" component={AIModeratorIntroScreen} />
        <Stack.Screen name="AIModerator" component={AIModeratorScreen} />
        <Stack.Screen name="AccountCreated" component={AccountCreatedScreen} />
        <Stack.Screen name="Main" component={MainStackNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
