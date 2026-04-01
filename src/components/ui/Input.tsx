import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Rounded, bordered text field — Threads-style density.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, containerClassName = '', className = '', ...rest },
  ref,
) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-zinc-600">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#A1A1AA"
        className={`rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base text-zinc-900 shadow-soft ${error ? 'border-red-400' : ''} ${className}`}
        {...rest}
      />
      {error ? <Text className="mt-1.5 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
});
