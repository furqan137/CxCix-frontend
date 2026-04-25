import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BRAND } from '../constants/brand';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/useAuthStore';

const SPLASH_MS = 2200;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hydrate = useAuthStore((s) => s.hydrate);

  useLayoutEffect(() => {
    void ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    let cancelled = false;
    const run = async () => {
      await Promise.all([
        new Promise<void>((r) => setTimeout(r, SPLASH_MS)),
        hydrate(),
      ]);
      if (cancelled) return;
      const { isLoggedIn, user } = useAuthStore.getState();
      if (!isLoggedIn) {
        navigation.replace('WelcomeOnboarding');
        return;
      }
      if (user?.needsProfile) {
        navigation.replace('SignupStepName');
        return;
      }
      navigation.replace('Main');
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [hydrate, navigation, opacity, scale]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Animated.View
          style={{
            alignItems: 'center',
            opacity,
            transform: [{ scale }],
          }}
        >
          <Image
            source={require('../../assets/icons/logo.png')}
            resizeMode="contain"
            style={{
              width: 220,
              height: 220,
              marginRight: 70,
              marginBottom: -70,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#334155',
              marginBottom: 4,
            }}
          >
            Surf Your Mood
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            Emotion-Intelligent Social Platform
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
