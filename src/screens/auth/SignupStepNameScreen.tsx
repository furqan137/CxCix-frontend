import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { checkUsernameAvailable } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import { USERNAME_RE } from '../../constants/validation';
import type { RootStackParamList } from '../../navigation/types';
import { useSignupDraftStore, type SignupAuthMode } from '../../store/useSignupDraftStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupStepName'>;

export default function SignupStepNameScreen({ navigation }: Props) {
  const setIdentity = useSignupDraftStore((s) => s.setIdentity);
  const authMode = useSignupDraftStore((s) => s.authMode) as SignupAuthMode;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = useCallback(async (u: string) => {
    const trimmed = u.trim();
    if (!USERNAME_RE.test(trimmed)) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    try {
      const r = await checkUsernameAvailable(trimmed);
      setAvailable(r.available);
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void runCheck(username);
    }, 450);
    return () => clearTimeout(t);
  }, [username, runCheck]);

  const onContinue = () => {
    const u = username.trim();
    const name = fullName.trim();
    if (!name) {
      return;
    }
    if (!USERNAME_RE.test(u)) {
      return;
    }
    if (!available) {
      return;
    }
    setLoading(true);
    try {
      setIdentity({ displayName: name, username: u });
      if (authMode === 'password') {
        navigation.navigate('SignupSecurity');
      } else {
        navigation.navigate('SignupProfile');
      }
    } finally {
      setLoading(false);
    }
  };

  const usernameError =
    username.length > 0 && !USERNAME_RE.test(username.trim())
      ? '3–16 characters, no spaces'
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-6">
          <View className="items-center">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{ width: 260, height: 100 }}
            />
            <Text className="mt-2 text-sm" style={{ color: BRAND.muted }}>
              Step 2 of 4 · Account details
            </Text>
            <View className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full rounded-full"
                style={{
                  width: '50%',
                  backgroundColor: BRAND.gradientAltStart,
                }}
              />
            </View>
          </View>

          <Text
            className="mt-8 text-2xl font-bold"
            style={{ color: BRAND.ink }}
          >
            Tell us about you
          </Text>

          <View className="mt-4">
            <Input
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              className="rounded-2xl px-4 py-3.5"
            />
            <Input
              placeholder="Username"
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              error={usernameError}
              className="rounded-2xl px-4 py-3.5"
            />
            <View className="-mt-2 mb-4 flex-row items-center gap-2 px-1">
              {checking ? (
                <ActivityIndicator size="small" />
              ) : available === true && USERNAME_RE.test(username.trim()) ? (
                <Text className="text-sm font-medium text-emerald-600">
                  ✓ Username available
                </Text>
              ) : available === false && USERNAME_RE.test(username.trim()) ? (
                <Text className="text-sm font-medium text-red-500">Username taken</Text>
              ) : null}
            </View>
            <View className="flex-row items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Text className="text-slate-500">ⓘ</Text>
              <Text className="flex-1 text-sm text-slate-600">
                3-16 characters, no spaces
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <GradientButton
              variant="welcome"
              loading={loading}
              disabled={
                !fullName.trim() ||
                !USERNAME_RE.test(username.trim()) ||
                !available ||
                checking
              }
              onPress={onContinue}
            >
              Continue
            </GradientButton>
          </View>

          <Pressable
            className="mt-4 py-2"
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Text className="text-base font-semibold text-blue-600">{'< Back'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
