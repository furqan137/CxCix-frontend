import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'outline' | 'ghost';

const variantStyles: Record<
  Variant,
  { container: string; label: string; pressed: string }
> = {
  primary: {
    container:
      'rounded-2xl bg-mood-calm px-6 py-4 shadow-soft items-center justify-center active:opacity-90',
    label: 'text-center text-base font-semibold text-white',
    pressed: 'opacity-90',
  },
  outline: {
    container:
      'rounded-2xl border border-zinc-200 bg-white px-6 py-4 items-center justify-center',
    label: 'text-center text-base font-semibold text-zinc-900',
    pressed: 'bg-zinc-50',
  },
  ghost: {
    container: 'rounded-2xl px-4 py-3 items-center justify-center',
    label: 'text-center text-base font-medium text-zinc-600',
    pressed: 'bg-zinc-100',
  },
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  className?: string;
  labelClassName?: string;
}

/**
 * Primary action button — supports loading state and NativeWind classes.
 */
export function Button({
  children,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  labelClassName = '',
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`${v.container} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {() =>
        loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#18181B'} />
        ) : typeof children === 'string' ? (
          <Text className={`${v.label} ${labelClassName}`}>{children}</Text>
        ) : (
          children
        )
      }
    </Pressable>
  );
}
