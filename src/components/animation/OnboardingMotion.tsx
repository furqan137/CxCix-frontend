import type { ReactNode } from 'react';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  /** Delay in ms */
  delay?: number;
  /** Slightly stronger rise for CTAs */
  variant?: 'title' | 'body' | 'media' | 'cta';
};

const DURATION = 520;

const enteringByVariant = {
  title: (delay = 0) =>
    FadeInDown.duration(DURATION).delay(delay).easing(Easing.out(Easing.cubic)),
  body: (delay = 0) =>
    FadeIn.duration(DURATION).delay(delay).easing(Easing.out(Easing.cubic)),
  media: (delay = 0) =>
    FadeInUp.duration(DURATION).delay(delay).easing(Easing.out(Easing.cubic)),
  cta: (delay = 0) =>
    FadeInUp.duration(DURATION)
      .delay(delay)
      .easing(Easing.out(Easing.cubic)),
} as const;

/**
 * Simple, consistent onboarding motion primitives to match Figma “step-by-step” reveals.
 */
export function OnboardingMotion({ children, delay = 0, variant = 'body' }: Props) {
  return (
    <Animated.View entering={enteringByVariant[variant](delay)}>
      {children}
    </Animated.View>
  );
}

