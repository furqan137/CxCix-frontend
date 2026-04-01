import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import AIModeratorScreen from '../screens/onboarding/AIModeratorScreen';
import AIModeratorIntroScreen from '../screens/onboarding/AIModeratorIntroScreen';
import WelcomeOnboardingScreen from '../screens/onboarding/WelcomeOnboardingScreen';
import SplashScreen from '../screens/SplashScreen';
import { MainStackNavigator } from './MainStack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Splash → onboarding → AI setup → Auth → Main (tabs + Shift modal).
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="AIModeratorIntro" component={AIModeratorIntroScreen} />
        <Stack.Screen name="AIModerator" component={AIModeratorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Main" component={MainStackNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
