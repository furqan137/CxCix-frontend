import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupSecurity'>;

export default function SignupSecurityScreen({ navigation }: Props) {
  const setPassword = useSignupDraftStore((s) => s.setPassword);
  const [password, setPasswordField] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onContinue = () => {
    if (password.length < 8) {
      Alert.alert('Password', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      setPassword(password);
      navigation.navigate('SignupProfile');
    } finally {
      setLoading(false);
    }
  };

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
              Step 3 of 4 · Security
            </Text>
            <View className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full w-3/4 rounded-full"
                style={{ backgroundColor: BRAND.gradientAltStart }}
              />
            </View>
          </View>

          <Text
            className="mt-8 text-2xl font-bold"
            style={{ color: BRAND.ink }}
          >
            Set your password
          </Text>
          <Text className="mt-2 text-sm" style={{ color: BRAND.muted }}>
            Choose a strong password. You’ll use it to sign in to CxCix.
          </Text>

          <View className="mt-6">
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPasswordField}
              className="rounded-2xl px-4 py-3.5"
            />
            <Input
              placeholder="Confirm password"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              className="mt-2 rounded-2xl px-4 py-3.5"
            />
            <View className="mt-2 flex-row items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Text className="text-slate-500">ⓘ</Text>
              <Text className="flex-1 text-sm text-slate-600">At least 8 characters</Text>
            </View>
          </View>

          <View className="mt-6">
            <GradientButton variant="welcome" loading={loading} onPress={onContinue}>
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
