import { reload } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
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
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import { firebaseAuth, firebaseSendEmailVerificationForCurrentUser } from '../../services/firebaseAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const email = useMemo(() => route.params?.email?.trim().toLowerCase() ?? '', [route.params?.email]);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);

  const setAuthMode = useSignupDraftStore((s) => s.setAuthMode);
  const setContact = useSignupDraftStore((s) => s.setContact);
  const signInWithFirebaseIdToken = useAuthStore((s) => s.signInWithFirebaseIdToken);

  const lastSeenVerifiedRef = useRef(false);

  const checkVerification = useCallback(async () => {
    const auth = firebaseAuth();
    const u = auth.currentUser;
    if (!u) return false;
    if (email && u.email?.toLowerCase() !== email) return false;

    setChecking(true);
    try {
      await reload(u);
      const ok = Boolean(auth.currentUser?.emailVerified);
      setVerified(ok);
      lastSeenVerifiedRef.current = ok;
      return ok;
    } catch {
      // ignore transient reload failures
      return lastSeenVerifiedRef.current;
    } finally {
      setChecking(false);
    }
  }, [email]);

  useEffect(() => {
    void checkVerification();
    const id = setInterval(() => void checkVerification(), 2000);
    return () => clearInterval(id);
  }, [checkVerification]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void checkVerification();
    });
    return () => sub.remove();
  }, [checkVerification]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((v) => (v <= 1 ? 0 : v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const onResend = async () => {
    if (resendBusy || resendIn > 0) return;
    const auth = firebaseAuth();
    const u = auth.currentUser;
    if (!u) {
      Alert.alert('Session', 'Please log in again.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    if (email && u.email?.toLowerCase() !== email) {
      Alert.alert('Email', 'You are signed in with a different email. Please log in again.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    setResendBusy(true);
    try {
      await firebaseSendEmailVerificationForCurrentUser();
      setResendIn(RESEND_COOLDOWN_S);
      Alert.alert('Sent', 'We sent a new verification email. Check your inbox.');
    } catch (e) {
      Alert.alert('Could not resend', getApiMessage(e));
    } finally {
      setResendBusy(false);
    }
  };

  const onContinue = async () => {
    const auth = firebaseAuth();
    const u = auth.currentUser;
    if (!u) {
      Alert.alert('Session', 'Please log in again.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    setContinueBusy(true);
    try {
      await reload(u);
      const ok = Boolean(auth.currentUser?.emailVerified);
      setVerified(ok);
      if (!ok) {
        Alert.alert('Not verified', 'Please verify your email first, then come back and tap “I have verified”.');
        return;
      }

      // Establish backend session from Firebase token.
      const idToken = await auth.currentUser!.getIdToken();
      await signInWithFirebaseIdToken(idToken, auth.currentUser!.email ?? email);

      setAuthMode('firebase');
      setContact({ email: auth.currentUser!.email?.toLowerCase() ?? email, phone: '' });

      const me = useAuthStore.getState().user;
      navigation.reset({
        index: 0,
        routes: [{ name: me?.needsProfile ? 'SignupStepName' : 'Main' }],
      });
    } catch (e) {
      Alert.alert('Could not continue', getApiMessage(e));
    } finally {
      setContinueBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
            hitSlop={8}
          >
            <Text className="text-lg text-slate-700">‹</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-2">
          <View className="items-center">
            <Image source={Images.logo} resizeMode="contain" style={{ width: '80%', maxWidth: 300, height: 90 }} />
            <Text className="mt-6 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
              Verify your email
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
              We sent a verification email to{' '}
              <Text className="font-bold" style={{ color: BRAND.ink }}>
                {email || 'your email'}
              </Text>
              . Open it, click the link, then come back here.
            </Text>
          </View>

          <View className="mt-6 flex-row items-center justify-center rounded-2xl bg-slate-50 px-4 py-3">
            {verified ? (
              <Text className="text-center text-sm font-semibold text-emerald-600">Email verified. You can continue.</Text>
            ) : (
              <Text className="text-center text-sm text-slate-600">
                {checking ? 'Checking verification…' : 'Not verified yet — we’ll keep checking.'}
              </Text>
            )}
          </View>

          <View className="mt-6 gap-3">
            <Pressable
              onPress={() => void onResend()}
              disabled={resendBusy || resendIn > 0}
              className="w-full overflow-hidden rounded-full border border-slate-200 bg-slate-50 py-3.5"
              style={{ opacity: resendBusy || resendIn > 0 ? 0.6 : 1 }}
            >
              {resendBusy ? (
                <ActivityIndicator color={BRAND.ink} />
              ) : (
                <Text className="text-center text-base font-bold text-blue-600">
                  {resendIn > 0 ? `Resend email (${resendIn}s)` : 'Resend email'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => void checkVerification()}
              className="w-full overflow-hidden rounded-full border border-slate-200 bg-white py-3.5"
            >
              <Text className="text-center text-base font-bold text-slate-700">I have verified</Text>
            </Pressable>

            <GradientButton
              variant="welcome"
              loading={continueBusy}
              disabled={!verified}
              onPress={() => void onContinue()}
            >
              Continue
            </GradientButton>

            {!verified ? (
              <Text className="mt-1 text-center text-xs text-slate-500">
                Continue turns on automatically after we detect verification.
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

