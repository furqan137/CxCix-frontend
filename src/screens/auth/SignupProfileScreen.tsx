import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
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

import { apiRegister, apiUpdateProfile, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useSignupDraftStore } from '../../store/useSignupDraftStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupProfile'>;

const BIO_MAX = 120;

export default function SignupProfileScreen({ navigation }: Props) {
  const draft = useSignupDraftStore();
  const authMode = useSignupDraftStore((s) => s.authMode);
  const resetDraft = useSignupDraftStore((s) => s.reset);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);

  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPasswordFlow = authMode === 'password';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onContinue = async () => {
    if (!draft.username?.trim()) {
      Alert.alert('Session expired', 'Go back and enter your details again.');
      return;
    }
    if (isPasswordFlow && !draft.password) {
      Alert.alert('Session expired', 'Go back and enter your password again.');
      return;
    }

    setLoading(true);
    try {
      if (isPasswordFlow) {
        const form = new FormData();
        if (draft.email) form.append('email', draft.email);
        if (draft.phone) form.append('phone', draft.phone);
        form.append('password', draft.password);
        form.append('username', draft.username.trim());
        const legalName = draft.displayName.trim();
        form.append('fullName', legalName);
        form.append('displayName', legalName);
        form.append('bio', bio.trim().slice(0, BIO_MAX));

        if (avatarUri) {
          const name = avatarUri.split('/').pop() ?? 'avatar.jpg';
          const ext = name.split('.').pop()?.toLowerCase();
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          form.append('avatar', {
            uri: avatarUri,
            name: ext === 'png' ? 'avatar.png' : 'avatar.jpg',
            type: mime,
          } as unknown as Blob);
        }

        const res = await apiRegister(form);
        const payload = res.data;
        await setSession(payload.user, payload.accessToken ?? payload.token, {
          firebaseCustomToken: payload.firebaseCustomToken,
        });
      } else {
        const form = new FormData();
        form.append('username', draft.username.trim());
        const legalName = draft.displayName.trim();
        form.append('fullName', legalName);
        form.append('displayName', legalName);
        form.append('bio', bio.trim().slice(0, BIO_MAX));
        form.append('profileComplete', 'true');

        if (avatarUri) {
          const name = avatarUri.split('/').pop() ?? 'avatar.jpg';
          const ext = name.split('.').pop()?.toLowerCase();
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          form.append('avatar', {
            uri: avatarUri,
            name: ext === 'png' ? 'avatar.png' : 'avatar.jpg',
            type: mime,
          } as unknown as Blob);
        }

        const user = await apiUpdateProfile(form);
        setUser(user);
      }

      resetDraft();
      navigation.reset({
        index: 0,
        routes: [{ name: 'AIModeratorIntro', params: { signupFlow: true } }],
      });
    } catch (e) {
      Alert.alert('Could not save profile', getApiMessage(e));
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
              {isPasswordFlow ? 'Step 4 of 4 · Profile' : 'Profile'}
            </Text>
            <View className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full w-full rounded-full"
                style={{ backgroundColor: BRAND.gradientAltStart }}
              />
            </View>
          </View>

          <Text className="mt-8 text-2xl font-bold" style={{ color: BRAND.ink }}>
            Set up your profile
          </Text>

          <View className="mt-6 items-center">
            <View className="relative">
              <Image
                source={avatarUri ? { uri: avatarUri } : Images.logo}
                className="h-28 w-28 rounded-full border border-slate-200 bg-slate-50"
                resizeMode="cover"
                style={{ width: 112, height: 112, borderRadius: 56 }}
              />
              <Pressable
                onPress={pickImage}
                className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full"
                style={{
                  backgroundColor: BRAND.gradientAltStart,
                }}
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View className="mt-6">
            <Text className="mb-2 text-sm font-medium text-zinc-600">Bio (optional)</Text>
            <Input
              placeholder="Tell us a bit about yourself..."
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
              multiline
              numberOfLines={4}
              className="min-h-[100px] rounded-2xl px-4 py-3.5"
            />
            <View className="mt-1 flex-row items-center gap-2 px-1">
              <Text className="text-slate-500">ⓘ</Text>
              <Text className="text-sm text-slate-500">Up to {BIO_MAX} characters</Text>
            </View>
          </View>

          <View className="mt-6">
            <GradientButton variant="welcome" loading={loading} onPress={() => void onContinue()}>
              Continue
            </GradientButton>
          </View>

          <Pressable className="mt-4 py-2" onPress={() => navigation.goBack()}>
            <Text className="text-base font-semibold text-blue-600">{'< Back'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
