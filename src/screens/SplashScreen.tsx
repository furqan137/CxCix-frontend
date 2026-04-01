import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BRAND } from '../constants/brand';
import { Images } from '../constants/images';
import type { RootStackParamList } from '../navigation/types';

const SPLASH_MS = 2800;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/**
 * Brand splash — white canvas, logo asset, “Surf Your Mood” stack (design match).
 */
export default function SplashScreen({ navigation }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('WelcomeOnboarding');
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <StatusBar style="dark" />
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY }],
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Image
          source={Images.logo}
          resizeMode="contain"
          style={{ width: '88%', maxWidth: 340, height: 120 }}
          accessibilityLabel="CxCix logo"
        />
        <Text
          className="mt-3 text-center text-2xl font-bold"
          style={{ color: BRAND.ink }}
        >
          Surf Your Mood
        </Text>
        <Text
          className="mt-2 max-w-sm text-center text-sm leading-5"
          style={{ color: BRAND.subtitle }}
        >
          Emotion-Intelligent Social Platform
        </Text>
      </Animated.View>
    </View>
  );
}
