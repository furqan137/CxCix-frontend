import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { getApiMessage } from '../../api/auth';
import type { ReplyLocation, ReplyMediaItem, ReplyMeta, ReplyPoll } from '../../api/comments';
import { apiGetPost, formatRelativeTime, type ApiFeedPost } from '../../api/posts';
import { LocationTag } from '../../components/LocationTag';
import { PollModal } from '../../components/PollModal';
import { ReplyAISheet } from '../../components/ReplyAISheet';
import { ReplyToolbar } from '../../components/ReplyToolbar';
import { MOOD_LABELS } from '../../constants/moods';
import { Images } from '../../constants/images';
import { useAI } from '../../hooks/useAI';
import { useUpload } from '../../hooks/useUpload';
import type { MainStackParamList } from '../../navigation/types';
import { submitReply } from '../../services/postService';
import type { RewriteType } from '../../services/aiService';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import { showToast } from '../../utils/toast';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'Reply'>;

const MAX = 2000;

const EMOJI_QUICK = [
  '😀',
  '😂',
  '🥰',
  '😍',
  '🤔',
  '👍',
  '👏',
  '🙏',
  '🔥',
  '✨',
  '❤️',
  '💯',
  '🎉',
  '😮',
  '😢',
  '🙌',
  '💪',
  '🌟',
  '☕',
  '📍',
];

/** Quoted card in composer: nested original when post is a shift, else the post itself. */
function getQuoteFromPost(post: ApiFeedPost) {
  const o = post.originalPost;
  if (o?.user) {
    return {
      displayName: formatUserDisplayName({
        fullName: o.user.fullName,
        displayName: o.user.displayName,
        username: o.user.username,
      }),
      username: o.user.username,
      avatarUrl: o.user.avatarUrl,
      text: o.text,
      mediaUrl: o.mediaUrl,
      createdAt: o.createdAt,
    };
  }
  if (post.user) {
    return {
      displayName: formatUserDisplayName({
        fullName: post.user.fullName,
        displayName: post.user.displayName,
        username: post.user.username,
      }),
      username: post.user.username,
      avatarUrl: post.user.avatarUrl,
      text: post.text,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
    };
  }
  return null;
}

function buildReplyMeta(media: ReplyMediaItem[], poll: ReplyPoll | null, loc: ReplyLocation | null): ReplyMeta | undefined {
  const meta: ReplyMeta = {};
  if (media.length) meta.media = media;
  if (poll && poll.options.length >= 2) meta.poll = poll;
  if (loc) meta.location = loc;
  return Object.keys(meta).length ? meta : undefined;
}

export default function ReplyScreen({ navigation, route }: Props) {
  const postId = route.params?.postId;
  const paramHandle = route.params?.replyToHandle;
  const inReplyToCommentId = route.params?.inReplyToCommentId;

  const currentMood = useMoodStore((s) => s.currentMood);
  const me = useAuthStore((s) => s.user);

  const [post, setPost] = useState<ApiFeedPost | null>(null);
  const [loading, setLoading] = useState(!!postId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [submitting, setSubmitting] = useState(false);

  const [media, setMedia] = useState<ReplyMediaItem[]>([]);
  const [poll, setPoll] = useState<ReplyPoll | null>(null);
  const [location, setLocation] = useState<ReplyLocation | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  const [pollModal, setPollModal] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedDraft, setSchedDraft] = useState(() => new Date(Date.now() + 60 * 60 * 1000));

  const { phase: uploadPhase, progress: uploadProgress, pickAndUploadMedia, reset: resetUpload } = useUpload();
  const { loading: aiLoading, rewrite } = useAI();

  const loadPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const p = await apiGetPost(postId);
      setPost(p);
    } catch (e) {
      setPost(null);
      setLoadError(getApiMessage(e));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      void loadPost();
    }, [loadPost]),
  );

  const quote = useMemo(() => (post ? getQuoteFromPost(post) : null), [post]);

  const replyToHandle = useMemo(() => {
    if (paramHandle) return paramHandle.startsWith('@') ? paramHandle : `@${paramHandle}`;
    if (quote) return `@${quote.username}`;
    return '@…';
  }, [paramHandle, quote]);

  const myName = formatUserDisplayName(
    {
      fullName: me?.fullName,
      displayName: me?.displayName,
      username: me?.username,
      email: me?.email,
    },
    'You',
  );
  const myHandle = me ? formatAtUsername(me.username) : formatAtUsername(null, 'you');
  const myAvatar = me?.avatarUrl ? { uri: me.avatarUrl } : Images.avatarWade;

  const remaining = MAX - reply.length;

  const hasText = reply.trim().length > 0;
  const canSend =
    !!postId &&
    !!quote &&
    (hasText || media.length > 0 || !!poll || !!location) &&
    !(poll && poll.options.length < 2);

  const toolbarActive = useMemo(
    () => ({
      image: media.length > 0,
      ai: aiOpen || aiLoading,
      poll: !!poll,
      schedule: !!scheduledAt,
      location: !!location,
      emoji: emojiOpen,
    }),
    [media.length, aiOpen, aiLoading, poll, scheduledAt, location, emojiOpen],
  );

  const onPickMedia = async () => {
    try {
      const item = await pickAndUploadMedia();
      if (item) setMedia((m) => [...m, item]);
    } catch (e) {
      Alert.alert('Media', getApiMessage(e));
    }
  };

  const onRetryUpload = () => {
    Alert.alert('Upload failed', 'Try uploading again?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: () => void onPickMedia() },
    ]);
  };

  const onLocationPress = async () => {
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted) {
        Alert.alert(
          'Location',
          'Location permission is required to attach where you are.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const g = geo[0];
      const name =
        [g?.name, g?.street, g?.city, g?.region].filter(Boolean).join(', ') || 'Current location';
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name,
      });
      showToast('Location attached');
    } catch (e) {
      Alert.alert('Location', getApiMessage(e));
    }
  };

  const onAIRewrite = async (type: RewriteType) => {
    const base = reply.trim();
    if (!base) {
      showToast('Write something first');
      return;
    }
    try {
      const next = await rewrite(base, type);
      setReply(next.slice(0, MAX));
      setAiOpen(false);
    } catch (e) {
      Alert.alert('AI', getApiMessage(e));
    }
  };

  const insertEmoji = (emoji: string) => {
    const { start, end } = selection;
    const a = reply.slice(0, start);
    const b = reply.slice(end);
    const next = `${a}${emoji}${b}`;
    const pos = start + emoji.length;
    setReply(next.slice(0, MAX));
    setSelection({ start: pos, end: pos });
    setEmojiOpen(false);
  };

  const confirmSchedule = () => {
    if (schedDraft.getTime() < Date.now() + 5000) {
      Alert.alert('Schedule', 'Pick a time at least a few minutes in the future.');
      return;
    }
    setScheduledAt(schedDraft);
    setScheduleOpen(false);
    showToast('Reply scheduled');
  };

  const clearSchedule = () => {
    setScheduledAt(null);
  };

  const onSubmit = async () => {
    if (!postId || !canSend) return;
    const meta = buildReplyMeta(media, poll, location);
    setSubmitting(true);
    try {
      const comment = await submitReply(postId, {
        text: reply.trim(),
        replyMeta: meta,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        inReplyToCommentId,
      });
      setReply('');
      setMedia([]);
      setPoll(null);
      setLocation(null);
      setScheduledAt(null);
      resetUpload();
      const isScheduled = comment.publishStatus === 'scheduled';
      Alert.alert(isScheduled ? 'Scheduled' : 'Sent', isScheduled ? 'Your reply will post at the chosen time.' : 'Your reply was posted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      showToast(getApiMessage(e));
      Alert.alert('Could not post', getApiMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const uploadBusy = uploadPhase === 'picking' || uploadPhase === 'compressing' || uploadPhase === 'uploading';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1">
            <View className="flex-row items-center justify-between px-3 py-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="h-9 w-9 items-center justify-center rounded-full border border-slate-200"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={22} color="#334155" />
              </Pressable>
              <LinearGradient
                colors={['#5D7CFF', '#FFC371']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text className="text-xs font-bold text-white">
                  You are in {MOOD_LABELS[currentMood]}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </LinearGradient>
              <Pressable className="h-9 w-9 items-center justify-center rounded-full border border-slate-200">
                <Ionicons name="settings-outline" size={18} color="#334155" />
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-2">
              <View className="max-w-[78%] flex-row items-center">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
                <Text className="ml-2 text-sm text-slate-700" numberOfLines={2}>
                  Replying to <Text className="font-semibold text-blue-600">{replyToHandle}</Text>
                </Text>
              </View>
              <Text className="text-sm font-semibold text-slate-500">Drafts</Text>
            </View>

            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              className="flex-1 px-4"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {!postId ? <Text className="mt-6 text-center text-slate-600">No post selected.</Text> : null}

          {loading ? (
            <View className="mt-8 items-center py-10">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="mt-3 text-sm text-slate-500">Loading post…</Text>
            </View>
          ) : null}

          {loadError && postId ? <Text className="mt-4 text-center text-sm text-amber-800">{loadError}</Text> : null}

          {!loading && quote ? (
            <View className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-row">
                  <Image
                    source={quote.avatarUrl ? { uri: quote.avatarUrl } : Images.avatarSplit}
                    className="h-10 w-10 rounded-full"
                    resizeMode="cover"
                  />
                  <View className="ml-2">
                    <Text className="font-bold text-slate-900">{quote.displayName}</Text>
                    <Text className="text-xs text-slate-500">
                      {formatAtUsername(quote.username)} · {formatRelativeTime(quote.createdAt)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
              </View>
              <Text className="mt-3 text-[15px] leading-6 text-slate-800">{quote.text}</Text>
              {quote.mediaUrl ? (
                <Image
                  source={{ uri: quote.mediaUrl }}
                  className="mt-3 w-full overflow-hidden rounded-2xl"
                  style={{ height: 180 }}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          ) : null}

          {!loading && postId && !quote && !loadError ? (
            <Text className="mt-4 text-sm text-slate-500">Could not load post details.</Text>
          ) : null}

          <View className="mt-6 flex-row items-center">
            <Image source={myAvatar} className="h-10 w-10 rounded-full" resizeMode="cover" />
            <View className="ml-2">
              <Text className="font-bold text-slate-900">{myName}</Text>
              <Text className="text-xs text-slate-500">{myHandle}</Text>
            </View>
          </View>

          <TextInput
            className="mt-4 min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-[16px] text-slate-900"
            placeholder="Write your reply..."
            placeholderTextColor="#94a3b8"
            multiline
            value={reply}
            onChangeText={(t) => setReply(t.slice(0, MAX))}
            maxLength={MAX}
            editable={!!postId && !loading && !!quote}
            selection={selection}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          />

          {scheduledAt ? (
            <View className="mt-2 flex-row items-center self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
              <Ionicons name="time" size={16} color="#b45309" />
              <Text className="ml-1.5 text-sm font-medium text-amber-900">
                Scheduled · {scheduledAt.toLocaleString()}
              </Text>
              <Pressable onPress={clearSchedule} hitSlop={8} className="ml-1">
                <Ionicons name="close-circle" size={20} color="#92400e" />
              </Pressable>
            </View>
          ) : null}

          {location ? <LocationTag location={location} onClear={() => setLocation(null)} /> : null}

          {poll ? (
            <View className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3 py-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-indigo-900" numberOfLines={2}>
                  📊 {poll.question}
                </Text>
                <Pressable onPress={() => setPoll(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color="#4338ca" />
                </Pressable>
              </View>
              <Text className="mt-1 text-xs text-indigo-800">{poll.options.length} options</Text>
            </View>
          ) : null}

          {media.length > 0 ? (
            <ScrollView horizontal className="mt-3" showsHorizontalScrollIndicator={false}>
              {media.map((m, i) => (
                <View key={`${m.url}-${i}`} className="mr-2 w-24">
                  {m.type === 'video' ? (
                    <View className="h-24 items-center justify-center rounded-xl bg-slate-800">
                      <Ionicons name="videocam" size={32} color="#fff" />
                    </View>
                  ) : (
                    <Image source={{ uri: m.url }} className="h-24 rounded-xl" resizeMode="cover" />
                  )}
                  <Pressable
                    onPress={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1"
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {uploadPhase === 'uploading' ? (
            <View className="mt-2">
              <View className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <View className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round(uploadProgress * 100)}%` }} />
              </View>
              <Text className="mt-1 text-center text-xs text-slate-500">Uploading…</Text>
            </View>
          ) : null}

          {uploadPhase === 'error' ? (
            <Pressable onPress={onRetryUpload} className="mt-2 self-center rounded-full bg-rose-50 px-4 py-2">
              <Text className="text-sm font-semibold text-rose-700">Upload failed — tap to retry</Text>
            </Pressable>
          ) : null}

          <ReplyToolbar
            remaining={remaining}
            max={MAX}
            active={toolbarActive}
            onImage={() => void onPickMedia()}
            onAI={() => setAiOpen(true)}
            onPoll={() => setPollModal(true)}
            onSchedule={() => {
              setSchedDraft(scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000));
              setScheduleOpen(true);
            }}
            onLocation={() => void onLocationPress()}
            onEmoji={() => setEmojiOpen(true)}
            onSend={() => void onSubmit()}
            sendDisabled={!canSend}
            sending={submitting}
            uploadBusy={uploadBusy}
          />

          <View className="mt-6 items-center">
            <Text className="text-center text-xs text-slate-500">
              Media uploads use Cloudinary. Rich data syncs to Firestore when rules allow.
            </Text>
          </View>
            </KeyboardAwareScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <PollModal
        visible={pollModal}
        onClose={() => setPollModal(false)}
        initial={poll}
        onConfirm={(p) => {
          setPoll({
            question: p.question,
            options: p.options.map((o) => ({ ...o, id: o.id || `o-${Math.random().toString(36).slice(2, 9)}`, votes: 0 })),
            voters: [],
          });
        }}
      />

      <ReplyAISheet visible={aiOpen} onClose={() => setAiOpen(false)} onSelect={(t) => void onAIRewrite(t)} loading={aiLoading} />

      <Modal visible={emojiOpen} animationType="fade" transparent onRequestClose={() => setEmojiOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setEmojiOpen(false)}>
          <Pressable className="rounded-t-3xl bg-white px-3 pb-8 pt-4" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-3 text-center text-sm font-bold text-slate-800">Emoji</Text>
            <FlatList
              data={EMOJI_QUICK}
              numColumns={8}
              keyExtractor={(item) => item}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => insertEmoji(item)} className="h-10 w-10 items-center justify-center">
                  <Text className="text-2xl">{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={scheduleOpen} animationType="slide" transparent onRequestClose={() => setScheduleOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setScheduleOpen(false)}>
          <View className="rounded-t-3xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-bold text-slate-900">Schedule reply</Text>
            <Text className="mt-1 text-sm text-slate-500">Choose when this reply should go live.</Text>

            <DateTimePicker
              value={schedDraft}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="light"
              onChange={(_, d) => {
                if (d) setSchedDraft(d);
              }}
            />

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setScheduleOpen(false)} className="flex-1 items-center rounded-2xl border border-slate-200 py-3">
                <Text className="font-semibold text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmSchedule} className="flex-1 items-center rounded-2xl bg-indigo-600 py-3">
                <Text className="font-bold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
