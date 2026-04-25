import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import { firebaseSendPasswordReset, isFirebaseConfigured } from '../../services/firebaseAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      Alert.alert('Email', 'Enter the email address for your account.');
      return;
    }
    if (!isFirebaseConfigured()) {
      Alert.alert('Firebase', 'Set EXPO_PUBLIC_FIREBASE_* keys in .env first.');
      return;
    }
    setLoading(true);
    try {
      await firebaseSendPasswordReset(e);
      Alert.alert('Password reset', 'Check your email to reset your password.', [
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert('Request failed', getApiMessage(err));
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
              Forgot password
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
              We’ll email you a secure link. Open it on your phone, or copy the reset code from the
              email and enter it on the next screen.
            </Text>
          </View>

          <View className="mt-10">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="rounded-full px-5 py-4"
            />
            <GradientButton variant="welcome" loading={loading} onPress={() => void onSend()}>
              Send reset link
            </GradientButton>
          </View>

          <View className="mt-6 items-center">
            <Pressable className="py-2" onPress={() => navigation.navigate('Login')}>
              <Text className="text-sm font-semibold text-slate-600">Back to log in</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
