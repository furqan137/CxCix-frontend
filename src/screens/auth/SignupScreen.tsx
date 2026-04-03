import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onCreate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 700);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-1 px-6 pt-10">
          <View className="items-center">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{ width: '86%', maxWidth: 340, height: 120 }}
            />
            <Text className="mt-2 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
              Surf Your Mood
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
              Emotion-Intelligent Social Platform
            </Text>
          </View>

          <View className="mt-10">
            <Input
              label={undefined}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Email / Phone / Username"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-full px-5 py-4"
            />
            <Input
              label={undefined}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              className="rounded-full px-5 py-4"
            />

            <Pressable className="items-end pr-1">
              <Text className="text-sm font-semibold text-blue-600">Forget Password</Text>
            </Pressable>

            <View className="mt-6">
              <GradientButton variant="welcome" loading={loading} onPress={onCreate}>
                Create Account
              </GradientButton>
            </View>
          </View>

          <View className="flex-1" />

          <View className="items-center pb-4">
            <Text className="text-sm text-slate-700">
              Already have an account?{' '}
              <Text
                className="font-semibold text-blue-600"
                onPress={() => navigation.goBack()}
                suppressHighlighting
              >
                Log in
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
