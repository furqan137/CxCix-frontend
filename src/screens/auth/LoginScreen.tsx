import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Auth entry — minimal Threads-like layout; wires to Zustand when API exists.
 */
export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignIn = () => {
    setLoading(true);
    // Placeholder — replace with axios + session, then navigate to main app
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 }}
        >
          <View className="mb-10 mt-4">
            <Text className="text-3xl font-bold tracking-tight text-zinc-900">Welcome back</Text>
            <Text className="mt-2 text-base leading-6 text-zinc-500">
              Sign in to shape your feed with moods and AI moderation.
            </Text>
          </View>

          <View className="rounded-3xl bg-surface-card p-5 shadow-soft">
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />
            <View className="mt-2">
              <GradientButton loading={loading} onPress={onSignIn}>
                Sign in
              </GradientButton>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Signup')}
              className="mt-6 items-center py-2"
            >
              <Text className="text-center text-sm text-zinc-500">
                New here?{' '}
                <Text className="font-semibold" style={{ color: BRAND.purpleDeep }}>
                  Create an account
                </Text>
              </Text>
            </Pressable>
          </View>

          <Text className="mt-8 text-center text-xs leading-5 text-zinc-400">
            By continuing you agree to our Terms and acknowledge how CxCix uses AI to rank and
            moderate content.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
