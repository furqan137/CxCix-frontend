import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetPost, apiUpdatePost } from '../../api/posts';
import { BRAND_GRADIENT } from '../../constants/brand';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'EditPost'>;

const PAGE = '#F4F7F9';
const MAX = 280;

/**
 * Edit post text (`PATCH /posts/:id`). Media is unchanged on the server for this flow.
 */
export default function EditPostScreen({ navigation, route }: Props) {
  const postId = route.params?.postId ?? '';
  const [text, setText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!postId) {
      setLoading(false);
      return;
    }
    try {
      const p = await apiGetPost(postId);
      setText(p.text ?? '');
      setHasMedia(Boolean(p.mediaUrl?.trim()));
    } catch (e) {
      Alert.alert('Couldn’t load post', getApiMessage(e), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [navigation, postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const t = text.trim();
    if (t.length > MAX) {
      Alert.alert('Too long', `Posts are limited to ${MAX} characters.`);
      return;
    }
    if (!t && !hasMedia) {
      Alert.alert('Empty post', 'Add text or keep your media attached.');
      return;
    }
    setSaving(true);
    try {
      await apiUpdatePost(postId, { text: t });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Couldn’t save', getApiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remaining = MAX - text.length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="close" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Edit post</Text>
        <Pressable
          onPress={() => void save()}
          disabled={saving || loading}
          className="rounded-full overflow-hidden opacity-100"
          style={{ opacity: saving || loading ? 0.5 : 1 }}
        >
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingHorizontal: 18, paddingVertical: 10 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white">Save</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <Text className="mb-2 text-sm font-semibold text-slate-500">Post text</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX + 50}
            placeholder="What’s on your mind?"
            placeholderTextColor="#94a3b8"
            className="min-h-[160px] rounded-3xl border border-slate-200 bg-white p-4 text-base leading-6 text-slate-900"
            style={{ textAlignVertical: 'top' }}
          />
          <Text
            className={`mt-2 text-right text-sm font-medium ${
              remaining < 0 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {remaining} left
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
