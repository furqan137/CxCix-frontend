import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Easing, Image, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { BRAND } from '../../constants/brand';

type Props = {
  source: ImageSourcePropType;
  /** Max width of the brain artwork */
  maxWidth?: number;
};

/**
 * Brain illustration with gentle scale pulse + rotating gears (Figma “active AI” feel).
 * Uses RN Animated so motion works even when Reanimated layout animations misbehave.
 */
export function AnimatedBrainHero({ source, maxWidth = 300 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const g1 = useRef(new Animated.Value(0)).current;
  const g2 = useRef(new Animated.Value(0)).current;
  const g3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.07,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const spin = (v: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true },
      );
    pulse.start();
    const s1 = spin(g1, 8000);
    const s2 = spin(g2, 11000);
    const s3 = spin(g3, 9500);
    s1.start();
    s2.start();
    s3.start();
    return () => {
      pulse.stop();
      s1.stop();
      s2.stop();
      s3.stop();
    };
  }, [g1, g2, g3, scale]);

  const r1 = g1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = g2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const r3 = g3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const gear = (
    rotation: Animated.AnimatedInterpolation<string>,
    top: number,
    left: `${number}%` | number,
    size: number,
  ) => (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: rotation }],
      }}
    >
      <Ionicons name="settings-outline" size={size * 0.85} color={BRAND.subtitle} />
    </Animated.View>
  );

  return (
    <View
      style={{
        width: '100%',
        maxWidth,
        alignSelf: 'center',
        minHeight: 280,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {gear(r1, 8, '4%', 28)}
      {gear(r2, 120, '82%', 24)}
      {gear(r3, 200, '10%', 22)}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
          source={source}
          resizeMode="contain"
          style={{ width: maxWidth, height: maxWidth * 0.92 }}
          accessibilityLabel="AI brain illustration"
        />
      </Animated.View>
    </View>
  );
}
