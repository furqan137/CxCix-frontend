import { onAuthStateChanged, reload } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  apiPollEmailLink,
  apiStartPendingEmailLink,
  getApiMessage,
  PENDING_LINK_SESSION_KEY,
} from '../../api/auth';
import { BRAND, BRAND_GRADIENT_ALT } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import {
  firebaseAuth,
  firebaseSendEmailSignInLink,
  firebaseSignInWithCustomToken,
  isFirebaseConfigured,
  PENDING_LINK_EMAIL_KEY,
  trySignInWithEmailLinkFromIncomingUrl,
} from '../../services/firebaseAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckEmail'>;

const RESEND_S = 80;

export default function CheckEmailScreen({ navigation, route }: Props) {
  const email = route.params?.email?.trim().toLowerCase() ?? '';
  const [resendIn, setResendIn] = useState(RESEND_S);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pasteLine, setPasteLine] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
  const customTokenSignRef = useRef(false);
  /** iOS simulator / Android emulator: email link on another device never reaches this app instance. */
  const isSimulator = !Device.isDevice;

  const signInWithFirebaseIdToken = useAuthStore((s) => s.signInWithFirebaseIdToken);
  const setAuthMode = useSignupDraftStore((s) => s.setAuthMode);
  const setContact = useSignupDraftStore((s) => s.setContact);

  const syncFirebaseSession = useCallback(
    (u: { email: string | null } | null) => {
      const m = u?.email?.trim().toLowerCase();
      setFirebaseReady(Boolean(m && email && m === email));
    },
    [email],
  );

  useEffect(() => {
    const auth = firebaseAuth();
    syncFirebaseSession(auth.currentUser);
    const unsub = onAuthStateChanged(auth, syncFirebaseSession);
    return () => unsub();
  }, [email, syncFirebaseSession]);

  /** Re-check session when returning from browser / email client (deep link or AsyncStorage). */
  useFocusEffect(
    useCallback(() => {
      const auth = firebaseAuth();
      const u = auth.currentUser;
      if (u && email && u.email?.toLowerCase() === email) {
        void reload(u)
          .catch(() => undefined)
          .finally(() => syncFirebaseSession(auth.currentUser));
      } else {
        syncFirebaseSession(auth.currentUser);
      }
    }, [email, syncFirebaseSession]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const auth = firebaseAuth();
      const u = auth.currentUser;
      if (u && email && u.email?.toLowerCase() === email) {
        void reload(u)
          .catch(() => undefined)
          .finally(() => syncFirebaseSession(auth.currentUser));
      } else {
        syncFirebaseSession(auth.currentUser);
      }
    });
    return () => sub.remove();
  }, [email, syncFirebaseSession]);

  /**
   * Same as root `EmailLinkHandler`, but bound to this screen so the sign-in link is
   * consumed as soon as Safari hands off to the app (some builds deliver URL here more reliably).
   */
  useEffect(() => {
    if (!email) return;
    const consume = (url: string) => {
      void (async () => {
        try {
          await trySignInWithEmailLinkFromIncomingUrl(email, url);
        } catch {
          /* duplicate attempt or link already used — ignore */
        }
      })();
    };
    void Linking.getInitialURL().then((u) => {
      if (u) consume(u);
    });
    const sub = Linking.addEventListener('url', ({ url }) => consume(url));
    return () => sub.remove();
  }, [email]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => {
      setResendIn((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const ensurePendingServerSession = useCallback(async () => {
    if (!email) return;
    const { sessionKey } = await apiStartPendingEmailLink(email);
    await SecureStore.setItemAsync(PENDING_LINK_SESSION_KEY, sessionKey);
  }, [email]);

  /**
   * When the user opens the sign-in link on another device, Firebase session updates on the server;
   * we poll and exchange for a custom token so this app instance can sign in (simulator/phone split).
   */
  useEffect(() => {
    if (!email) return;
    if (firebaseReady) return;

    const tick = async () => {
      if (customTokenSignRef.current) return;
      const auth = firebaseAuth();
      const u = auth.currentUser;
      if (u && u.email?.toLowerCase() === email) return;

      let sessionKey: string | null = null;
      try {
        sessionKey = await SecureStore.getItemAsync(PENDING_LINK_SESSION_KEY);
      } catch {
        return;
      }
      if (!sessionKey) {
        try {
          await ensurePendingServerSession();
        } catch {
          return;
        }
        return;
      }

      let poll: Awaited<ReturnType<typeof apiPollEmailLink>>;
      try {
        poll = await apiPollEmailLink(email, sessionKey);
      } catch {
        try {
          await ensurePendingServerSession();
        } catch {
          // ignore; next tick
        }
        return;
      }

      if (poll.reason === 'no_session') {
        try {
          await ensurePendingServerSession();
        } catch {
          // ignore
        }
        return;
      }

      if (poll.ready && poll.customToken) {
        customTokenSignRef.current = true;
        try {
          await firebaseSignInWithCustomToken(poll.customToken);
        } catch {
          customTokenSignRef.current = false;
        }
      }
    };

    const id = setInterval(() => {
      void tick();
    }, 2500);
    void tick();
    return () => clearInterval(id);
  }, [email, ensurePendingServerSession, firebaseReady]);

  useEffect(() => {
    customTokenSignRef.current = false;
  }, [email]);

  const canResend = resendIn === 0 && !resendLoading;

  const applyPastedLink = async (raw: string) => {
    if (!email) return;
    const t = raw.trim();
    if (!t) {
      Alert.alert('Empty', 'Paste the full https:// link (from the email or the browser address bar).');
      return;
    }
    setPasteBusy(true);
    try {
      const ok = await trySignInWithEmailLinkFromIncomingUrl(email, t);
      if (!ok) {
        Alert.alert(
          'Could not use this link',
          'It must be the full Firebase link (https://… with oobCode=). If you only verified on your phone, copy the page URL and paste it here for the simulator to sign in.',
        );
      }
    } catch (e) {
      Alert.alert('Sign-in failed', getApiMessage(e));
    } finally {
      setPasteBusy(false);
    }
  };

  const onReadClipboard = async () => {
    const t = (await Clipboard.getStringAsync()).trim();
    if (t) setPasteLine(t);
    if (!t) {
      Alert.alert(
        'Clipboard empty',
        'On your phone, copy the long https:// address from the browser after you opened the sign-in link, then on your Mac use Universal Paste or paste that URL here.',
      );
      return;
    }
    await applyPastedLink(t);
  };

  const onResend = async () => {
    if (!canResend || !isFirebaseConfigured()) return;
    if (!email) return;
    setResendLoading(true);
    try {
      await firebaseSendEmailSignInLink(email);
      await SecureStore.setItemAsync(PENDING_LINK_EMAIL_KEY, email);
      try {
        await ensurePendingServerSession();
      } catch {
        /* poll may 503 until new session; user can resend */
      }
      setResendIn(RESEND_S);
      Alert.alert('Email sent', 'Check your inbox for a new sign-in link.');
    } catch (e) {
      Alert.alert('Could not send', getApiMessage(e));
    } finally {
      setResendLoading(false);
    }
  };

  const onContinue = async () => {
    const auth = firebaseAuth();
    const fu = auth.currentUser;
    if (!fu || fu.email?.toLowerCase() !== email) {
      Alert.alert('Not verified yet', 'Open the sign-in link from your email on this phone first.');
      return;
    }
    setContinueBusy(true);
    try {
      const idToken = await fu.getIdToken();
      await signInWithFirebaseIdToken(idToken);
      setAuthMode('firebase');
      setContact({ email, phone: '' });
      await SecureStore.deleteItemAsync(PENDING_LINK_EMAIL_KEY);
      try {
        await SecureStore.deleteItemAsync(PENDING_LINK_SESSION_KEY);
      } catch {
        // optional key
      }
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
        <View className="flex-1 px-6 pt-2">
          <View className="items-center">
            <Image
              source={Images.logo}
              resizeMode="contain"
              style={{ width: '80%', maxWidth: 300, height: 90 }}
            />
            <Text className="mt-2 text-sm" style={{ color: BRAND.muted }}>
              Step 2 of 4 · Verify email
            </Text>
            <View className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full w-1/2 rounded-full"
                style={{ backgroundColor: BRAND.gradientAltStart }}
              />
            </View>
            <Text className="mt-6 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
              Next step: verify your email
            </Text>
            <Text className="mt-2 text-center text-sm" style={{ color: BRAND.muted }}>
              {isSimulator ? (
                <>
                  We sent a link to{' '}
                  <Text className="font-bold" style={{ color: BRAND.ink }}>
                    {email || 'your address'}
                  </Text>
                  . You can open it on your phone—when that completes, this screen should detect it and
                  turn Continue on. If it does not within a few seconds, open the same link in Simulator
                  Safari, or use the “Simulator” options below to paste the long https URL.
                </>
              ) : (
                <>
                  We sent a sign-in link to{' '}
                  <Text className="font-bold" style={{ color: BRAND.ink }}>
                    {email || 'your address'}
                  </Text>
                  . Open the link in Mail on <Text className="font-semibold">this device</Text>, or on
                  another device—this app will refresh when the link is used. When sign-in is ready,
                  Continue will turn on.
                </>
              )}
            </Text>
          </View>

          <View className="mt-6 flex-row items-center justify-center rounded-2xl bg-slate-50 px-4 py-3">
            {firebaseReady ? (
              <Text className="text-center text-sm font-semibold text-emerald-600">
                Your email is verified. You can continue.
              </Text>
            ) : isSimulator ? (
              <Text className="text-center text-sm text-slate-600">
                Not confirmed yet — we keep checking if you already opened the link on your phone, or
                open it here and paste the URL below.
              </Text>
            ) : (
              <Text className="text-center text-sm text-slate-600">
                Waiting for the sign-in link to be used (any device)…
              </Text>
            )}
          </View>

          {isSimulator && !firebaseReady ? (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
              <Text className="text-center text-sm font-semibold text-amber-900">Simulator: finish sign-in here</Text>
              <Text className="mt-1 text-center text-xs leading-5 text-amber-800/90">
                After you open the link on your phone, copy the long https:// page URL, then:
              </Text>
              <View className="mt-2 gap-2">
                <Pressable
                  onPress={() => void onReadClipboard()}
                  disabled={pasteBusy}
                  className="rounded-xl bg-amber-200/80 py-2.5"
                >
                  {pasteBusy ? (
                    <ActivityIndicator color="#78350f" />
                  ) : (
                    <Text className="text-center text-sm font-bold text-amber-950">Read from clipboard & sign in</Text>
                  )}
                </Pressable>
                <TextInput
                  value={pasteLine}
                  onChangeText={setPasteLine}
                  placeholder="Or paste the full https://… link (includes oobCode=)"
                  placeholderTextColor="#a16207"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  className="min-h-[44px] rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-sm text-amber-950"
                />
                <Pressable
                  onPress={() => void applyPastedLink(pasteLine)}
                  disabled={pasteBusy || !pasteLine.trim()}
                  className="rounded-xl bg-amber-600 py-2.5"
                  style={{ opacity: pasteLine.trim() ? 1 : 0.5 }}
                >
                  <Text className="text-center text-sm font-bold text-white">Sign in with pasted link</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Resend: one button, countdown in label, active when timer ends */}
          <View className="mt-6">
            <Pressable
              onPress={() => void onResend()}
              disabled={!canResend}
              className="w-full overflow-hidden rounded-full border border-slate-200"
              style={{ opacity: canResend ? 1 : 0.55 }}
            >
              {resendLoading ? (
                <View className="items-center bg-slate-50 py-3.5">
                  <ActivityIndicator color={BRAND.ink} />
                </View>
              ) : (
                <View className="items-center bg-slate-50 py-3.5">
                  <Text
                    className={`text-base font-bold ${canResend ? 'text-blue-600' : 'text-slate-500'}`}
                  >
                    {resendIn > 0 ? `Resend (${resendIn}s)` : 'Resend link'}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Continue: muted until verified, full gradient when ready */}
          <View className="mt-4">
            {firebaseReady ? (
              <Pressable
                onPress={() => void onContinue()}
                disabled={continueBusy}
                className="w-full overflow-hidden rounded-full"
                style={{
                  shadowColor: '#5E72EB',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={[...BRAND_GRADIENT_ALT]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {continueBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center text-base font-bold text-white">Continue</Text>
                  )}
                </LinearGradient>
              </Pressable>
            ) : (
              <View
                className="w-full items-center justify-center rounded-full border border-slate-200 bg-slate-100 py-4"
                style={{ opacity: 0.9 }}
              >
                <Text className="text-center text-base font-bold text-slate-400">Continue</Text>
              </View>
            )}
            {!firebaseReady ? (
              <Text className="mt-3 text-center text-xs text-slate-500">
                Continue turns on when the link has been used—on this device or another—and we can finish
                sign-in here.
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
