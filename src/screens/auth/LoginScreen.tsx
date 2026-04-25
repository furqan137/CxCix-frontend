import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { checkAccountExists, getApiMessage } from '../../api/auth';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import {
  firebaseAuth,
  firebaseSignInWithEmailPassword,
  firebaseSignInWithGoogleIdToken,
  isFirebaseConfigured,
} from '../../services/firebaseAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';
import { reload } from 'firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const signInWithFirebaseIdToken = useAuthStore((s) => s.signInWithFirebaseIdToken);
  const setAuthMode = useSignupDraftStore((s) => s.setAuthMode);

  const goAfterLogin = () => {
    const u = useAuthStore.getState().user;
    if (u?.needsProfile) {
      navigation.reset({ index: 0, routes: [{ name: 'SignupStepName' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const onSignIn = async () => {
    const id = identifier.trim();
    if (!id || !password) {
      Alert.alert('Missing fields', 'Enter email, phone, or username and your password.');
      return;
    }
    setLoading(true);
    try {
      const isEmail = id.includes('@');
      if (isEmail && isFirebaseConfigured()) {
        try {
          const idToken = await firebaseSignInWithEmailPassword(id, password);
          // Ensure verification state is fresh.
          const auth = firebaseAuth();
          if (auth.currentUser) {
            await reload(auth.currentUser);
          }
          if (auth.currentUser && !auth.currentUser.emailVerified) {
            navigation.navigate('VerifyEmail', { email: id.trim().toLowerCase() });
            return;
          }
          await signInWithFirebaseIdToken(idToken);
          goAfterLogin();
          return;
        } catch {
          // try Mongo / legacy password
        }
      }
      if (!isEmail) {
        const { exists } = await checkAccountExists(id);
        if (!exists) {
          Alert.alert(
            'No account',
            'No account exists for this phone or username. Create one first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign up', onPress: () => navigation.navigate('CreateAccount') },
            ],
          );
          return;
        }
      }
      await login(id, password);
      goAfterLogin();
    } catch (e) {
      Alert.alert('Sign in failed', getApiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async (googleIdToken: string) => {
    if (!isFirebaseConfigured()) {
      Alert.alert('Firebase', 'Set EXPO_PUBLIC_FIREBASE_* in .env');
      return;
    }
    setLoading(true);
    try {
      const idToken = await firebaseSignInWithGoogleIdToken(googleIdToken);
      await signInWithFirebaseIdToken(idToken);
      setAuthMode('google');
      goAfterLogin();
    } catch (e) {
      Alert.alert('Google', getApiMessage(e));
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
              placeholder="Email / Phone / Username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-full px-5 py-4"
            />
            <Input
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              className="rounded-full px-5 py-4"
            />

            <View className="flex-row flex-wrap items-center justify-end pr-1">
              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
              >
                <Text className="text-sm font-semibold text-blue-600">Forgot password</Text>
              </Pressable>
            </View>

            <View className="mt-6 gap-3">
              <GradientButton variant="welcome" loading={loading} onPress={() => void onSignIn()}>
                Log in
              </GradientButton>
              <GoogleSignInButton
                label="Log in with Google"
                disabled={loading}
                onIdToken={(t) => void onGoogleLogin(t)}
                onError={(m) => Alert.alert('Google', m)}
              />
            </View>
          </View>

          <View className="flex-1" />

          <View className="items-center pb-4">
            <Text className="text-sm text-slate-700">
              Don’t have an account?{' '}
              <Text
                className="font-semibold text-blue-600"
                onPress={() => navigation.navigate('CreateAccount')}
                suppressHighlighting
              >
                Create account
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
