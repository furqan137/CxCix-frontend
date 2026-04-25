import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiChangeEmail, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import type { MainStackParamList } from '../../navigation/types';
import { buildEmailLinkContinueUrl, firebaseAuth } from '../../services/firebaseAuth';
import { useAuthStore } from '../../store/useAuthStore';
import { reload, verifyBeforeUpdateEmail } from 'firebase/auth';

type Props = NativeStackScreenProps<MainStackParamList, 'UpdateEmail'>;

const PAGE = '#F4F7F9';

export default function UpdateEmailScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [email, setEmail] = useState(user?.email?.trim() || '');
  const [sending, setSending] = useState(false);
  const [watching, setWatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const didPersistRef = useRef(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const send = async () => {
    const e = normalizedEmail;
    if (!e || !e.includes('@')) {
      Alert.alert('Email', 'Enter a valid email.');
      return;
    }
    setSending(true);
    try {
      const auth = firebaseAuth();
      if (!auth.currentUser) {
        Alert.alert('Sign in', 'Please sign in again to change your email.');
        return;
      }
      const actionCodeSettings = {
        // Must be an authorized domain in Firebase Auth settings.
        url: buildEmailLinkContinueUrl(),
        // No deep linking — user completes in browser.
        handleCodeInApp: false,
      };
      await verifyBeforeUpdateEmail(auth.currentUser, e, actionCodeSettings);
      didPersistRef.current = false;
      setWatching(true);
      Alert.alert(
        'Check your new email',
        'We sent a verification link to your new email address. Open it to confirm the change. We’ll automatically detect it here.',
      );
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/requires-recent-login') {
        Alert.alert('Re-auth required', 'For security, please log in again and retry changing your email.');
        return;
      }
      Alert.alert('Could not send', getApiMessage(err));
    } finally {
      setSending(false);
    }
  };

  const stopWatching = () => setWatching(false);

  useEffect(() => {
    if (!watching) return;
    let cancelled = false;
    const auth = firebaseAuth();

    const tick = async () => {
      if (cancelled) return;
      if (!auth.currentUser) {
        stopWatching();
        return;
      }
      try {
        await reload(auth.currentUser);
      } catch {
        // ignore transient reload failures
      }

      const currentEmail = auth.currentUser?.email?.trim().toLowerCase();
      if (!currentEmail || currentEmail !== normalizedEmail) return;

      if (didPersistRef.current) return;
      didPersistRef.current = true;

      setSaving(true);
      try {
        const token = await auth.currentUser.getIdToken(true);
        await apiChangeEmail({ email: normalizedEmail, firebaseIdToken: token });
        await refreshUser();
        stopWatching();
        Alert.alert('Updated', 'Your email address has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (err) {
        didPersistRef.current = false;
        Alert.alert('Could not update', getApiMessage(err));
      } finally {
        setSaving(false);
      }
    };

    void tick();
    const interval = setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [normalizedEmail, refreshUser, watching, navigation]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Email Address</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <Input
          label="New email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!sending && !saving}
        />
        <GradientButton
          variant="welcome"
          loading={sending}
          disabled={saving}
          onPress={() => void send()}
          className="mb-3"
        >
          Send verification link
        </GradientButton>
        {watching ? (
          <View className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-sm font-semibold text-slate-900">Waiting for confirmation…</Text>
            <Text className="mt-1 text-[13px] leading-5 text-slate-600">
              Open the verification link in your new email address. Keep this screen open — it will update automatically.
            </Text>
            <Pressable onPress={stopWatching} className="mt-3 self-start rounded-full bg-slate-100 px-4 py-2">
              <Text className="text-xs font-bold text-slate-700">Stop</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

