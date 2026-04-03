import type { ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

type Props = {
  children: ReactNode;
  delayMs?: number;
  /** Fade only, or fade + slight upward slide */
  variant?: 'fade' | 'rise';
};

/**
 * Lightweight entrance using RN Animated (reliable when Reanimated entering is flaky).
 */
export function FadeStagger({ children, delayMs = 0, variant = 'fade' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(variant === 'rise' ? 14 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delayMs, opacity, translateY, variant]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}
