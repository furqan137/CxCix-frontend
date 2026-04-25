import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiResetPassword, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const paramToken = route.params?.token?.trim() ?? '';
  const [token, setToken] = useState(paramToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramToken) setToken(paramToken);
  }, [paramToken]);

  const onReset = async () => {
    const t = token.trim();
    if (!t) {
      Alert.alert(
        'Reset code required',
        'Paste the reset code from your email. It’s the long code in the reset link (after the last /).',
      );
      return;
    }
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
      const res = await apiResetPassword(t, password);
      Alert.alert('Success', res.message, [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
      ]);
    } catch (e) {
      Alert.alert('Could not reset', getApiMessage(e));
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
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
            hitSlop={8}
          >
            <Text className="text-lg text-slate-700">‹</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-4">
          <View className="items-center">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{ width: '80%', maxWidth: 300, height: 100 }}
            />
            <Text className="mt-4 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
              New password
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
              Enter the reset code from your email, then choose a new password for your CxCix
              account.
            </Text>
          </View>

          <View className="mt-8">
            <Input
              placeholder="Reset code (from email)"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-full px-5 py-4"
            />
            <Input
              placeholder="New password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="mt-2 rounded-full px-5 py-4"
            />
            <Input
              placeholder="Confirm password"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              className="rounded-full px-5 py-4"
            />
            <GradientButton variant="welcome" loading={loading} onPress={() => void onReset()}>
              Reset password
            </GradientButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
