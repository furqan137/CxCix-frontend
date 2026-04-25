import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import {
  apiGetPost,
  apiShiftPost,
  formatRelativeTime,
  type ApiFeedPost,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { apiSearchUsers, type PublicUser } from '../../api/users';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'AddCommentary'>;

const BG = '#F8F9FA';
const EMOJIS = ['😀', '😂', '🥹', '😍', '😮', '😢', '😡', '🙏', '✨', '🔥', '💙', '🎉', '😌', '🤍', '💭', '💡', '🌿', '🌙', '☀️', '📍', '📸', '🎥'] as const;

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

/**
 * Add Commentary — shift composer: loads the original post, posts via `POST /posts/:id/shift`.
 */
export default function AddCommentaryScreen({ navigation, route }: Props) {
  const postId = route.params?.postId;
  const perspectiveLabel = route.params?.perspectiveLabel ?? 'Advice';

  const [text, setText] = useState('');
  const [imageAsset, setImageAsset] = useState<PickedAsset | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionResults, setMentionResults] = useState<PublicUser[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<PublicUser[]>([]);

  const [original, setOriginal] = useState<ApiFeedPost | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [posting, setPosting] = useState(false);

  const max = 280;

  const loadOriginal = useCallback(async () => {
    if (!postId) {
      setLoadingPost(false);
      setLoadError('Missing post.');
      return;
    }
    setLoadError(null);
    setLoadingPost(true);
    try {
      const p = await apiGetPost(postId);
      setOriginal(p);
    } catch (e) {
      setOriginal(null);
      setLoadError(getApiMessage(e));
    } finally {
      setLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadOriginal();
  }, [loadOriginal]);

  useEffect(() => {
    if (!mentionOpen) return;
    const q = mentionQuery.trim();
    if (q.length < 2) {
      setMentionResults([]);
      return;
    }
    setMentionLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const users = await apiSearchUsers(q);
          setMentionResults(users);
        } catch {
          setMentionResults([]);
        } finally {
          setMentionLoading(false);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [mentionOpen, mentionQuery]);

  const canPost = useMemo(() => {
    if (posting || loadingPost || !!loadError || !original || !postId) return false;
    return Boolean(text.trim().length || imageAsset);
  }, [posting, loadingPost, loadError, original, postId, text, imageAsset]);

  const pickCommentImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Allow photo access to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    if (!a) return;
    setImageAsset({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName });
  };

  const insertMention = (u: PublicUser) => {
    setText((prev) => {
      const base = prev.trimEnd();
      const suffix = ` @${u.username} `;
      const next = (base ? `${base}${suffix}` : suffix).slice(0, max);
      return next;
    });
    setTaggedUsers((prev) => {
      if (prev.some((x) => x._id === u._id)) return prev;
      return [...prev, u].slice(0, 20);
    });
    setMentionOpen(false);
    setMentionQuery('');
  };

  const addEmoji = (e: string) => {
    setText((prev) => (prev + e).slice(0, max));
  };

  const submit = async () => {
    if (!postId || !original || posting) return;
    const trimmed = text.trim();
    setPosting(true);
    try {
      const media =
        imageAsset?.uri
          ? {
              uri: imageAsset.uri,
              name: imageAsset.fileName?.trim() || 'commentary.jpg',
              type: imageAsset.mimeType?.trim() || 'image/jpeg',
            }
          : undefined;
      await apiShiftPost(postId, {
        perspective: perspectiveLabel,
        text: trimmed,
        taggedUsers: taggedUsers.map((u) => u._id),
        media,
      });
      navigation.popToTop();
    } catch (e) {
      Alert.alert('Could not post', getApiMessage(e));
    } finally {
      setPosting(false);
    }
  };

  const u = original?.user;
  const avatarSrc =
    u?.avatarUrl && u.avatarUrl.length > 0 ? { uri: u.avatarUrl } : Images.avatarSplit;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Modal visible={mentionOpen} animationType="slide" onRequestClose={() => setMentionOpen(false)}>
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3">
            <Text className="text-base font-bold text-slate-900">Mention someone</Text>
            <Pressable onPress={() => setMentionOpen(false)} hitSlop={8}>
              <Text className="text-sm font-bold text-blue-600">Done</Text>
            </Pressable>
          </View>
          <View className="px-4 pt-3">
            <TextInput
              value={mentionQuery}
              onChangeText={setMentionQuery}
              placeholder="Search username or name…"
              placeholderTextColor="#94a3b8"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-[15px] text-slate-900"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {mentionLoading ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null}
            <ScrollView className="mt-2">
              {mentionResults.map((u) => (
                <Pressable
                  key={u._id}
                  onPress={() => insertMention(u)}
                  className="flex-row items-center border-b border-slate-100 py-3"
                >
                  <Image
                    source={u.avatarUrl ? { uri: u.avatarUrl } : Images.avatarSplit}
                    className="h-9 w-9 rounded-full bg-slate-100"
                    resizeMode="cover"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      {formatUserDisplayName({
                        fullName: u.fullName,
                        displayName: u.displayName,
                        username: u.username,
                      })}
                    </Text>
                    <Text className="text-xs text-slate-500">{formatAtUsername(u.username)}</Text>
                  </View>
                </Pressable>
              ))}
              {!mentionLoading && mentionQuery.trim().length >= 2 && mentionResults.length === 0 ? (
                <Text className="py-4 text-center text-sm text-slate-500">No users found.</Text>
              ) : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={emojiOpen} transparent animationType="fade" onRequestClose={() => setEmojiOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setEmojiOpen(false)}>
          <View className="mt-auto rounded-t-3xl bg-white px-4 pb-8 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900">Emoji</Text>
              <Pressable onPress={() => setEmojiOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#334155" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => addEmoji(e)}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-50"
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Add Commentary</Text>
        <Pressable
          onPress={submit}
          disabled={!canPost}
          className="overflow-hidden rounded-full"
          style={{ minWidth: 72, opacity: canPost ? 1 : 0.45 }}
        >
          <LinearGradient
            colors={['#8E8FFA', '#F9D949']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', minHeight: 40 }}
          >
            {posting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-sm font-bold text-white">Post</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              style={{ backgroundColor: BG }}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            >
              <View className="mb-4 flex-row items-center rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
                <Image
                  source={Images.perspectiveLightbulb}
                  resizeMode="contain"
                  style={{ width: 22, height: 22 }}
                  accessibilityLabel="Perspective"
                />
                <Text className="ml-2 text-sm font-semibold text-slate-700">
                  Perspective: {perspectiveLabel}
                </Text>
              </View>

              {loadingPost ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text className="mt-2 text-sm text-slate-500">Loading original post…</Text>
                </View>
              ) : null}

              {loadError ? (
                <Text className="mb-4 text-center text-sm text-amber-800">{loadError}</Text>
              ) : null}

              <View
                className="rounded-3xl bg-white p-4 shadow-soft"
                style={{
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                <TextInput
                  className="min-h-[100px] text-[16px] leading-6 text-slate-900"
                  placeholder="Write your commentary here..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  value={text}
                  onChangeText={setText}
                  maxLength={max}
                  textAlignVertical="top"
                  editable={!loadingPost && !!original}
                />

                {imageAsset ? (
                  <View className="mt-3">
                    <Image
                      source={{ uri: imageAsset.uri }}
                      className="w-full overflow-hidden rounded-2xl"
                      style={{ height: 150 }}
                      resizeMode="cover"
                    />
                    <Pressable onPress={() => setImageAsset(null)} className="mt-2 self-start">
                      <Text className="text-sm font-semibold text-blue-600">Remove image</Text>
                    </Pressable>
                  </View>
                ) : null}

                {taggedUsers.length ? (
                  <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
                    {taggedUsers.slice(0, 6).map((u) => (
                      <View
                        key={u._id}
                        className="flex-row items-center rounded-full bg-slate-100 px-3 py-1.5"
                      >
                        <Text className="text-xs font-bold text-slate-700">@{u.username}</Text>
                      </View>
                    ))}
                    {taggedUsers.length > 6 ? (
                      <Text className="py-1.5 text-xs text-slate-500">
                        +{taggedUsers.length - 6} more
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {original && u ? (
                  <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <View className="flex-row items-center">
                      <Image
                        source={avatarSrc}
                        className="h-9 w-9 rounded-full"
                        resizeMode="cover"
                      />
                      <View className="ml-2">
                        <Text className="text-sm font-bold text-slate-900">
                          {formatUserDisplayName({
                            fullName: u.fullName,
                            displayName: u.displayName,
                            username: u.username,
                          })}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {formatAtUsername(u.username)} · {formatRelativeTime(original.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-2 text-sm leading-5 text-slate-800">{original.text}</Text>
                    {original.mediaUrl ? (
                      <Image
                        source={{ uri: original.mediaUrl }}
                        className="mt-2 w-full overflow-hidden rounded-2xl"
                        style={{ height: 140 }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View className="mt-4 flex-row items-center justify-between px-1">
                <View className="flex-row gap-5">
                  <Pressable onPress={() => void pickCommentImage()} hitSlop={8}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={imageAsset ? '#2563eb' : '#94a3b8'}
                    />
                  </Pressable>
                  <Pressable onPress={() => setMentionOpen(true)} hitSlop={8}>
                    <Ionicons
                      name="at"
                      size={24}
                      color={taggedUsers.length ? '#2563eb' : '#94a3b8'}
                    />
                  </Pressable>
                  <Pressable onPress={() => setEmojiOpen((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name="happy-outline"
                      size={24}
                      color={emojiOpen ? '#2563eb' : '#94a3b8'}
                    />
                  </Pressable>
                </View>
                <Text className="text-sm text-slate-400">
                  {text.length} / {max}
                </Text>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
