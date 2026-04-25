import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { apiUpdateProfile, checkUsernameAvailable, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import { USERNAME_RE } from '../../constants/validation';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

const BIO_MAX = 120;

export default function EditProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(
    () => (user?.fullName ?? user?.displayName ?? '').trim() || '',
  );
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameOk, setUsernameOk] = useState(true);

  const originalUsername = user?.username ?? '';

  useFocusEffect(
    useCallback(() => {
      const u = useAuthStore.getState().user;
      if (!u) return;
      setDisplayName((u.fullName ?? u.displayName ?? '').trim() || '');
      setUsername(u.username ?? '');
      setBio(u.bio ?? '');
      setAvatarUri(null);
    }, []),
  );

  const checkUser = useCallback(
    async (u: string) => {
      const t = u.trim();
      if (!USERNAME_RE.test(t)) {
        setUsernameOk(false);
        return;
      }
      if (t.toLowerCase() === originalUsername.toLowerCase()) {
        setUsernameOk(true);
        return;
      }
      try {
        const r = await checkUsernameAvailable(t);
        setUsernameOk(r.available);
      } catch {
        setUsernameOk(false);
      }
    },
    [originalUsername],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void checkUser(username);
    }, 400);
    return () => clearTimeout(t);
  }, [username, checkUser]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    const name = displayName.trim();
    const u = username.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!USERNAME_RE.test(u)) {
      Alert.alert('Username', 'Use 3–16 characters: letters, numbers, underscores only.');
      return;
    }
    if (!usernameOk) {
      Alert.alert('Username', 'This username is not available.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('fullName', name);
      form.append('displayName', name);
      form.append('username', u);
      form.append('bio', bio.trim().slice(0, BIO_MAX));

      if (avatarUri) {
        const ext = avatarUri.split('.').pop()?.toLowerCase();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        form.append('avatar', {
          uri: avatarUri,
          name: ext === 'png' ? 'avatar.png' : 'avatar.jpg',
          type: mime,
        } as unknown as Blob);
      }

      const updated = await apiUpdateProfile(form);
      setUser(updated);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', getApiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const avatarSource =
    avatarUri != null
      ? { uri: avatarUri }
      : user?.avatarUrl
        ? { uri: user.avatarUrl }
        : Images.avatarSplit;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#334155" />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900">Edit profile</Text>
          <View className="h-10 w-10" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <Pressable onPress={pickImage} className="relative">
              <Image
                source={avatarSource}
                style={{ width: 112, height: 112, borderRadius: 56 }}
                resizeMode="cover"
              />
              <View
                className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: BRAND.gradientAltStart }}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </Pressable>
            <Text className="mt-2 text-sm text-slate-500">Tap to change photo</Text>
          </View>

          <View className="mt-8">
            <Input
              label="Full name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              placeholder="Your name"
            />
            <Input
              label="Username"
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="username"
              error={
                username.length > 0 && !USERNAME_RE.test(username.trim())
                  ? '3–16 chars, letters, numbers, underscore'
                  : username.trim().toLowerCase() !== originalUsername.toLowerCase() &&
                      USERNAME_RE.test(username.trim()) &&
                      !usernameOk
                    ? 'Username taken'
                    : undefined
              }
            />
            <Text className="mb-2 text-sm font-medium text-zinc-600">Bio</Text>
            <Input
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
              placeholder="Tell others about you..."
              multiline
              numberOfLines={4}
              className="min-h-[100px]"
            />
            <Text className="mt-1 text-right text-xs text-slate-400">
              {bio.length}/{BIO_MAX}
            </Text>
          </View>

          <View className="mt-6 pb-10">
            <GradientButton variant="welcome" loading={loading} onPress={() => void onSave()}>
              Save changes
            </GradientButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
