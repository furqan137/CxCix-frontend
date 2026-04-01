import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BRAND_GRADIENT } from '../../constants/brand';

type Props = {
  children: ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Use alternate blue→gold curve for welcome-style CTAs */
  variant?: 'primary' | 'welcome';
  className?: string;
};

const VARIANTS = {
  primary: BRAND_GRADIENT,
  welcome: ['#5E72EB', '#FFD194'] as const,
};

/**
 * Pill CTA with brand gradient — matches mock “Get Started” / “Train Your AI” / “Finish”.
 */
export function GradientButton({
  children,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  className = '',
}: Props) {
  const colors = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full overflow-hidden rounded-full ${disabled || loading ? 'opacity-60' : ''} ${className}`}
      style={{
        shadowColor: '#1e1b4b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          width: '100%',
          paddingVertical: 16,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : typeof children === 'string' ? (
          <Text className="text-center text-base font-bold text-white">{children}</Text>
        ) : (
          <View className="flex-row items-center">{children}</View>
        )}
      </LinearGradient>
    </Pressable>
  );
}
