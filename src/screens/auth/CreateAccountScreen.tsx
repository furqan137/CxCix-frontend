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
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import {
  firebaseAuth,
  firebaseSendEmailVerificationForCurrentUser,
  firebaseSignInWithGoogleIdToken,
  isFirebaseConfigured,
} from '../../services/firebaseAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export default function CreateAccountScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setContact = useSignupDraftStore((s) => s.setContact);
  const setAuthMode = useSignupDraftStore((s) => s.setAuthMode);
  const signInWithFirebaseIdToken = useAuthStore((s) => s.signInWithFirebaseIdToken);

  const onCreateAccount = async () => {
    if (!isFirebaseConfigured()) {
      Alert.alert('Firebase', 'Set EXPO_PUBLIC_FIREBASE_* keys in .env to enable email sign-in.');
      return;
    }
    const e = email.trim().toLowerCase();
    if (!e.includes('@')) {
      Alert.alert('Email', 'Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password', 'Use at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const auth = firebaseAuth();
      await createUserWithEmailAndPassword(auth, e, password);
      await firebaseSendEmailVerificationForCurrentUser();
      setAuthMode('firebase');
      setContact({ email: e, phone: '' });
      navigation.navigate('VerifyEmail', { email: e });
    } catch (err) {
      Alert.alert('Could not send', getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUp = async (googleIdToken: string) => {
    if (!isFirebaseConfigured()) {
      Alert.alert('Firebase', 'Set EXPO_PUBLIC_FIREBASE_* in .env first.');
      return;
    }
    setLoading(true);
    try {
      const idToken = await firebaseSignInWithGoogleIdToken(googleIdToken);
      await signInWithFirebaseIdToken(idToken);
      setAuthMode('google');
      const u = useAuthStore.getState().user;
      if (u?.needsProfile) {
        navigation.replace('SignupStepName');
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (e) {
      Alert.alert('Google sign-in', getApiMessage(e));
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
        <View className="flex-1 px-6 pt-8">
          <View className="items-center">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{ width: '86%', maxWidth: 340, height: 110 }}
            />
            <Text className="mt-3 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
              Create Account
            </Text>
            <Text className="mt-1 text-center text-base" style={{ color: BRAND.muted }}>
              Surf Your Mood
            </Text>
            <Text className="mt-2 text-sm" style={{ color: BRAND.muted }}>
              Step 1 of 4 · Basic info
            </Text>
            <View className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full w-1/4 rounded-full"
                style={{ backgroundColor: BRAND.gradientAltStart }}
              />
            </View>
          </View>

          <View className="mt-8">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="rounded-full px-5 py-4"
            />
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="mt-2 rounded-full px-5 py-4"
            />
            <Text className="mt-2 px-1 text-sm text-slate-500">
              We’ll send a verification email. After you verify, you can continue in the app.
            </Text>
            <View className="mt-4 gap-3">
              <GradientButton variant="welcome" loading={loading} onPress={() => void onCreateAccount()}>
                Create account
              </GradientButton>
              <GoogleSignInButton
                label="Sign up with Google"
                disabled={loading}
                onIdToken={(t) => void onGoogleSignUp(t)}
                onError={(m) => Alert.alert('Google', m)}
              />
            </View>
          </View>

          <View className="flex-1" />

          <View className="items-center pb-4">
            <Text className="text-sm text-slate-700">
              Already have an account?{' '}
              <Text
                className="font-semibold text-blue-600"
                onPress={() => navigation.navigate('Login')}
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
