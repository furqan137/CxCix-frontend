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

const SPLASH_MS = 3000;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  /* ================= ANIMATION ================= */

  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // animation
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

    // navigation
    const t = setTimeout(() => {
      navigation.replace('WelcomeOnboarding');
    }, SPLASH_MS);

    return () => clearTimeout(t);
  }, []);

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
          {/* LOGO (FROM ICONS FOLDER) */}
          <Image
            source={require('../../assets/icons/logo.png')} // ✅ YOUR ICON PATH
            resizeMode="contain"
            style={{
              width: 220,
              height: 220,
              marginRight: 70,
              marginBottom: -70,
            }}
          />


          {/* SUBTITLE */}
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

          {/* TAGLINE */}
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