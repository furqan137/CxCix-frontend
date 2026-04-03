import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FadeStagger } from '../../components/animation/FadeStagger';
import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeOnboarding'>;

export default function WelcomeOnboardingScreen({ navigation }: Props) {
  /* ================= ANIMATION ================= */

  const translateX = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* ================= TOP ================= */}
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          
          {/* LOGO */}
          <FadeStagger delayMs={40} variant="rise">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{
                width: 260,
                height: 120,
                marginBottom:-20
              }}
            />
          </FadeStagger>

          {/* TITLE */}
          <FadeStagger delayMs={100} variant="rise">
            <Text
              style={{
                marginTop: 12,
                fontSize: 22,
                fontWeight: '700',
                color: '#0f172a',
                textAlign: 'center',
              }}
            >
              Surf Your Mood
            </Text>
          </FadeStagger>

          {/* SUBTITLE */}
          <FadeStagger delayMs={160} variant="fade">
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              Emotion-Intelligent Social Platform
            </Text>
          </FadeStagger>
        </View>

        {/* ================= SURF IMAGE ================= */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateX }],
              opacity,
            }}
          >
            <Image
              source={Images.welcomeSurf}
              resizeMode="contain"
              style={{
                width: 340,
                height: 300,
              }}
            />
          </Animated.View>
        </View>

        {/* ================= BUTTON ================= */}
        <View style={{ paddingBottom: 20 }}>
          <FadeStagger delayMs={300} variant="rise">
            <GradientButton
              variant="welcome"
              onPress={() => navigation.navigate('AIModeratorIntro')}
            >
              Get Started
            </GradientButton>
          </FadeStagger>
        </View>
      </View>
    </SafeAreaView>
  );
}