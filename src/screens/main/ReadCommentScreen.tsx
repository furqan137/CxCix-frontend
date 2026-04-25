import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiGetCommentsGrouped,
  apiRecordCommentView,
  apiToggleCommentLike,
  type ApiComment,
  type CommentsGroupedResponse,
} from '../../api/comments';
import {
  apiDeletePost,
  apiGetPost,
  apiPinPost,
  apiToggleLike,
  apiViewPost,
  formatCompactCount,
  formatRelativeTime,
  type ApiFeedPost,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { apiSetBlockedUser, apiSetHiddenPost, apiSetMutedUser } from '../../api/users';
import { mapShiftedPost } from '../../components/feed/mapShiftedPost';
import { ShiftedPostCard } from '../../components/feed/ShiftedPostCard';
import { PollInline } from '../../components/PollInline';
import { PostActionsSheet } from '../../components/sheets/PostActionsSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { inferMediaResourceType } from '../../utils/inferMediaResourceType';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MainStackParamList, 'ReadComment'>;

const PAGE_BG = '#F2F4F7';

function buildPostShareUrl(id: string) {
  const base = (process.env.EXPO_PUBLIC_POST_SHARE_BASE ?? 'https://cxcix.app/post').replace(/\/$/, '');
  return `${base}/${id}`;
}

/** Match `PostCard` / `ShiftedPostCard` like tint. */
const HEART_LIKED = '#4F7CFF';
const HEART_MUTED = '#94a3b8';

const FIGMA_PRIMARY = '#1A1A1B';
const FIGMA_SECONDARY = '#878A8C';
const FIGMA_ACCENT = '#3B82F6';
const FIGMA_CARD_BG = '#F2F4F5';
const FIGMA_ICON_TILE = '#E8EAED';

type CategoryDef = {
  id: string;
  title: string;
  /** Matches `Comment.category` from the API (e.g. Support). */
  apiCategory: string;
};

const CATEGORY_DEFS: CategoryDef[] = [
  { id: 'support', title: 'Support', apiCategory: 'Support' },
  { id: 'counterpoint', title: 'Counterpoint', apiCategory: 'Counterpoint' },
  { id: 'question', title: 'Question', apiCategory: 'Question' },
  { id: 'build', title: 'Build', apiCategory: 'Build' },
  { id: 'reflect', title: 'Reflect', apiCategory: 'Reflect' },
  { id: 'vawulence', title: 'Vawulence', apiCategory: 'Vawulence' },
];

/** Figma-style: blue outline glyph in a muted rounded square. */
function AccordionCategoryGlyph({ apiCategory }: { apiCategory: string }) {
  type IonName = keyof typeof Ionicons.glyphMap;
  const name = ((): IonName => {
    switch (apiCategory) {
      case 'Support':
        return 'heart-outline';
      case 'Counterpoint':
        return 'git-compare-outline';
      case 'Question':
        return 'help-circle-outline';
      case 'Build':
        return 'construct-outline';
      case 'Reflect':
        return 'sparkles-outline';
      case 'Vawulence':
        return 'flash-outline';
      default:
        return 'chatbubble-ellipses-outline';
    }
  })();
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-xl"
      style={{ width: 44, height: 44, backgroundColor: FIGMA_ICON_TILE }}
    >
      <Ionicons name={name} size={22} color={FIGMA_ACCENT} />
    </View>
  );
}

function categoryPillStyle(label: string) {
  const key = label.trim().toLowerCase();
  if (key.includes('support')) return { bg: '#DBEAFE', fg: '#1D4ED8' };
  if (key.includes('counter')) return { bg: '#FEE2E2', fg: '#B91C1C' };
  if (key.includes('question')) return { bg: '#E0E7FF', fg: '#4338CA' };
  if (key.includes('build')) return { bg: '#FFEDD5', fg: '#C2410C' };
  if (key.includes('reflect')) return { bg: '#DCFCE7', fg: '#15803D' };
  if (key.includes('vawulence') || key.includes('vaw')) return { bg: '#F3E8FF', fg: '#7E22CE' };
  return { bg: '#F1F5F9', fg: '#475569' };
}

function formatScheduleLabel(c: ApiComment): string | null {
  if (c.publishStatus !== 'scheduled' && !c.scheduledFor) return null;
  if (c.scheduledFor) {
    const d = new Date(c.scheduledFor);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  return 'Scheduled';
}

function mediaSummary(meta: NonNullable<ApiComment['replyMeta']>) {
  const m = meta.media ?? [];
  if (!m.length) return null;
  const imgs = m.filter((x) => x.type !== 'video').length;
  const vids = m.filter((x) => x.type === 'video').length;
  const parts: string[] = [];
  if (imgs) parts.push(imgs === 1 ? '1 photo' : `${imgs} photos`);
  if (vids) parts.push(vids === 1 ? '1 video' : `${vids} videos`);
  return parts.join(' · ');
}

function findCommentById(cg: CommentsGroupedResponse, id: string): ApiComment | null {
  const walk = (rows: ApiComment[]): ApiComment | null => {
    for (const row of rows) {
      if (row._id === id) return row;
      if (row.replies?.length) {
        const inner = walk(row.replies);
        if (inner) return inner;
      }
    }
    return null;
  };
  for (const key of Object.keys(cg.grouped)) {
    const found = walk(cg.grouped[key] ?? []);
    if (found) return found;
  }
  return null;
}

function patchCommentInGrouped(
  cg: CommentsGroupedResponse,
  commentId: string,
  patch: Partial<Pick<ApiComment, 'likesCount' | 'isLiked' | 'viewsCount' | 'repliesCount'>>,
): CommentsGroupedResponse {
  const walk = (rows: ApiComment[]): ApiComment[] =>
    rows.map((row) => {
      const nextReplies = row.replies?.length ? walk(row.replies) : row.replies;
      if (row._id === commentId) {
        return { ...row, ...patch, replies: nextReplies ?? row.replies };
      }
      return { ...row, replies: nextReplies ?? row.replies };
    });

  const grouped: Record<string, ApiComment[]> = {};
  for (const key of Object.keys(cg.grouped)) {
    grouped[key] = walk(cg.grouped[key] ?? []);
  }
  const flat = cg.flat.map((row) => (row._id === commentId ? { ...row, ...patch } : row));
  return { ...cg, grouped, flat };
}

function ThreadCommentCard({
  c,
  postId,
  depth = 0,
  meId,
  onReply,
  onPollVoted,
  onToggleCommentLike,
  onRegisterView,
  onShift,
}: {
  c: ApiComment;
  postId: string;
  depth?: number;
  meId: string;
  onReply?: (comment: ApiComment) => void;
  onPollVoted?: () => void;
  onToggleCommentLike: (commentId: string) => void | Promise<void>;
  onRegisterView: (commentId: string) => void;
  onShift: () => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const u = c.author;
  const displayName = formatUserDisplayName({
    fullName: u?.fullName,
    displayName: u?.displayName,
    username: u?.username,
  });
  const handle = u ? formatAtUsername(u.username) : formatAtUsername(null);
  const meta = c.replyMeta;
  const sched = formatScheduleLabel(c);
  const mediaLabel = meta ? mediaSummary(meta) : null;
  const catStyle = categoryPillStyle(c.category || '');
  const hasPoll = !!meta?.poll;
  const showMetaRow =
    !!(c.category?.trim() || sched || mediaLabel || meta?.location?.name || hasPoll);
  const nested = c.replies ?? [];
  const replyTotal = nested.length > 0 ? nested.length : c.repliesCount ?? 0;
  const likesCount = c.likesCount ?? 0;
  const viewsCount = c.viewsCount ?? 0;
  const liked = Boolean(c.isLiked);

  useEffect(() => {
    onRegisterView(c._id);
  }, [c._id, onRegisterView]);

  const runLike = () => {
    if (likeBusy) return;
    setLikeBusy(true);
    void Promise.resolve(onToggleCommentLike(c._id)).finally(() => setLikeBusy(false));
  };

  return (
    <View className="mb-3" style={{ marginLeft: depth > 0 ? Math.min(depth * 12, 40) : 0 }}>
      <View className="rounded-[18px] px-4 py-4" style={{ backgroundColor: FIGMA_CARD_BG }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row">
            <Image
              source={u?.avatarUrl ? { uri: u.avatarUrl } : Images.readComment.avatarComment}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              resizeMode="cover"
              accessibilityLabel={displayName}
            />
            <View className="ml-3 flex-1 pr-1">
              <View className="flex-row flex-wrap items-center">
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: FIGMA_PRIMARY }}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text className="text-[15px] font-bold" style={{ color: FIGMA_SECONDARY }}>
                  {' '}
                  ·{' '}
                </Text>
                <Text className="text-[15px] font-medium" style={{ color: FIGMA_SECONDARY }}>
                  {formatRelativeTime(c.createdAt)}
                </Text>
              </View>
              <Text
                className="mt-0.5 text-[13px]"
                style={{ color: FIGMA_SECONDARY }}
                numberOfLines={1}
              >
                {handle}
              </Text>
            </View>
          </View>
          {onReply && u?._id ? (
            <Pressable
              onPress={() => onReply(c)}
              className="rounded-full border border-white bg-white px-2.5 py-1"
              style={{
                borderColor: '#E2E6E8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
              }}
              hitSlop={6}
              accessibilityLabel="Open reply panel"
            >
              <Text className="text-xs font-semibold" style={{ color: FIGMA_SECONDARY }}>
                Reply
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showMetaRow ? (
          <View className="mt-2.5 flex-row flex-wrap gap-y-1.5" style={{ columnGap: 6, rowGap: 6 }}>
            {c.category?.trim() ? (
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: catStyle.bg }}>
                <Text className="text-[11px] font-bold" style={{ color: catStyle.fg }}>
                  {c.category.trim()}
                </Text>
              </View>
            ) : null}
            {sched ? (
              <View className="flex-row items-center rounded-full bg-amber-100 px-2 py-1">
                <Ionicons name="time-outline" size={12} color="#B45309" />
                <Text className="ml-1 text-[11px] font-bold text-amber-800">
                  Scheduled · {sched}
                </Text>
              </View>
            ) : null}
            {mediaLabel ? (
              <View className="flex-row items-center rounded-full bg-indigo-50 px-2 py-1">
                <Ionicons name="images-outline" size={12} color="#4F46E5" />
                <Text className="ml-1 text-[11px] font-semibold text-indigo-800">{mediaLabel}</Text>
              </View>
            ) : null}
            {meta?.location?.name ? (
              <View className="max-w-[88%] flex-row items-center rounded-full bg-emerald-50 px-2 py-1">
                <Ionicons name="location-outline" size={12} color="#047857" />
                <Text className="ml-1 flex-1 text-[11px] font-semibold text-emerald-900" numberOfLines={1}>
                  {meta.location.name}
                </Text>
              </View>
            ) : null}
            {hasPoll ? (
              <View className="flex-row items-center rounded-full bg-sky-50 px-2 py-1">
                <Ionicons name="bar-chart-outline" size={12} color="#0369A1" />
                <Text className="ml-1 text-[11px] font-bold text-sky-800">Poll</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text className="mt-3 text-[15px] leading-[22px]" style={{ color: FIGMA_PRIMARY }}>
          {c.text}
        </Text>

        {meta?.media?.length ? (
          <ScrollView horizontal className="mt-3" showsHorizontalScrollIndicator={false}>
            {meta.media.map((m, idx) =>
              m.type === 'video' ? (
                <View
                  key={`${m.url}-${idx}`}
                  className="mr-2 h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-xl bg-slate-800"
                >
                  <Ionicons name="videocam" size={28} color="#fff" />
                </View>
              ) : (
                <Image
                  key={`${m.url}-${idx}`}
                  source={{ uri: m.url }}
                  className="mr-2 h-[110px] w-[110px] rounded-xl"
                  resizeMode="cover"
                />
              ),
            )}
          </ScrollView>
        ) : null}

        {hasPoll && meta?.poll ? (
          <PollInline postId={postId} comment={c} poll={meta.poll} onVoted={onPollVoted} />
        ) : null}

        <View className="mt-3 flex-row flex-wrap items-center border-t border-slate-200/70 pt-3">
          <Pressable
            onPress={() => {
              if (replyTotal > 0) setShowReplies((v) => !v);
            }}
            disabled={replyTotal === 0}
            className="mr-3 flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel={
              replyTotal > 0
                ? showReplies
                  ? 'Hide replies'
                  : `Show ${replyTotal} replies`
                : 'No replies'
            }
          >
            <Ionicons name="chatbubble-outline" size={18} color={replyTotal > 0 ? '#64748b' : '#cbd5e1'} />
            <Text
              className="ml-1 text-sm"
              style={{ color: replyTotal > 0 ? FIGMA_SECONDARY : '#cbd5e1' }}
            >
              {formatCompactCount(replyTotal)}
            </Text>
          </Pressable>
          <Pressable
            onPress={runLike}
            disabled={likeBusy}
            className="mr-3 flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? HEART_LIKED : HEART_MUTED}
            />
            <Text
              className="ml-1 text-sm"
              style={{ color: liked ? FIGMA_PRIMARY : FIGMA_SECONDARY }}
            >
              {formatCompactCount(likesCount)}
            </Text>
          </Pressable>
          <Pressable
            onPress={onShift}
            className="mr-3 flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel="Shift perspective"
          >
            <Ionicons name="sync" size={18} color="#64748b" />
            <Text className="ml-1 text-sm font-semibold text-slate-700">Shift</Text>
          </Pressable>
          <View className="mr-3 flex-row items-center">
            <Ionicons name="eye-outline" size={18} color="#64748b" />
            <Text className="ml-1 text-sm" style={{ color: FIGMA_SECONDARY }}>
              {formatCompactCount(viewsCount)}
            </Text>
          </View>
          {onReply && u?._id ? (
            <Pressable
              onPress={() => onReply(c)}
              className="ml-auto flex-row items-center rounded-full bg-white px-2.5 py-1"
              style={{ borderWidth: 1, borderColor: '#E2E6E8' }}
              hitSlop={6}
              accessibilityLabel="Reply in full panel"
            >
              <Ionicons name="arrow-undo-outline" size={16} color={FIGMA_ACCENT} />
              <Text className="ml-1 text-xs font-bold" style={{ color: FIGMA_ACCENT }}>
                Reply
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {showReplies && nested.length > 0
        ? nested.map((r) => (
            <ThreadCommentCard
              key={r._id}
              c={r}
              postId={postId}
              depth={depth + 1}
              meId={meId}
              onReply={onReply}
              onPollVoted={onPollVoted}
              onToggleCommentLike={onToggleCommentLike}
              onRegisterView={onRegisterView}
              onShift={onShift}
            />
          ))
        : null}
    </View>
  );
}

/**
 * Read Comment — main post + structured accordions (Figma-aligned).
 */
export default function ReadCommentScreen({ navigation, route }: Props) {
  const variant = route.params?.variant ?? 'standard';
  const routePostId = route.params?.postId;
  const focusParam = route.params?.focusInput === true;
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const meId = user?._id ? String(user._id) : '';
  const [openId, setOpenId] = useState<string | null>('support');
  const [feedPost, setFeedPost] = useState<ApiFeedPost | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [commentsGroup, setCommentsGroup] = useState<
    Awaited<ReturnType<typeof apiGetCommentsGrouped>> | null
  >(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewedCommentIds = useRef(new Set<string>());

  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [postMenuVariant, setPostMenuVariant] = useState<'own' | 'other'>('other');
  const [postMenuHandle, setPostMenuHandle] = useState('@username');
  const [postMenuAuthorId, setPostMenuAuthorId] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [hideBusy, setHideBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blockActionBusy, setBlockActionBusy] = useState(false);

  const loadPostAndComments = useCallback(async () => {
    if (!routePostId) {
      setFeedPost(null);
      setCommentsGroup(null);
      setPostError(null);
      return;
    }
    setPostLoading(true);
    setPostError(null);
    try {
      const [p, cg] = await Promise.all([
        apiGetPost(routePostId),
        apiGetCommentsGrouped(routePostId).catch(() => ({
          postId: routePostId,
          grouped: {} as Record<string, ApiComment[]>,
          flat: [] as ApiComment[],
        })),
      ]);
      setFeedPost(p);
      setCommentsGroup(cg);
      void apiViewPost(routePostId)
        .then((updated) => {
          setFeedPost((cur) => (cur && cur.id === updated.id ? { ...cur, ...updated } : cur));
        })
        .catch(() => undefined);
    } catch (e) {
      setFeedPost(null);
      setCommentsGroup(null);
      setPostError(getApiMessage(e));
    } finally {
      setPostLoading(false);
    }
  }, [routePostId]);

  useFocusEffect(
    useCallback(() => {
      void loadPostAndComments();
    }, [loadPostAndComments]),
  );

  useEffect(() => {
    viewedCommentIds.current.clear();
  }, [routePostId]);

  useEffect(() => {
    if (!focusParam || !routePostId || postLoading) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 320);
    return () => clearTimeout(t);
  }, [focusParam, routePostId, postLoading]);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  const runToggleLike = useCallback(() => {
    if (!routePostId) return;
    let snapshot: ApiFeedPost | null = null;
    setFeedPost((prev) => {
      if (!prev || prev.id !== routePostId) return prev;
      snapshot = { ...prev };
      const newLiked = !prev.isLiked;
      const nextCount = Math.max(0, prev.likesCount + (newLiked ? 1 : -1));
      return { ...prev, isLiked: newLiked, likesCount: nextCount };
    });
    if (!snapshot) return;
    void (async () => {
      try {
        const updated = await apiToggleLike(routePostId);
        setFeedPost((cur) => (cur && cur.id === routePostId ? { ...cur, ...updated } : cur));
      } catch (e) {
        setFeedPost((cur) => (cur && cur.id === routePostId ? snapshot : cur));
        Alert.alert('Like', getApiMessage(e));
      }
    })();
  }, [routePostId]);

  const scrollToThreadEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const openFullReply = () => {
    if (!routePostId || !feedPost) return;
    const uname =
      feedPost.originalPost?.user?.username ?? feedPost.user?.username ?? '';
    navigation.navigate('Reply', {
      postId: routePostId,
      replyToHandle: uname ? `@${uname}` : undefined,
    });
  };

  const onReplyToComment = useCallback(
    (c: ApiComment) => {
      if (!routePostId) return;
      const h = c.author?.username ? `@${c.author.username}` : undefined;
      navigation.navigate('Reply', {
        postId: routePostId,
        replyToHandle: h,
        inReplyToCommentId: c._id,
      });
    },
    [navigation, routePostId],
  );

  const handleRegisterCommentView = useCallback(
    (commentId: string) => {
      if (!routePostId || !meId) return;
      if (viewedCommentIds.current.has(commentId)) return;
      viewedCommentIds.current.add(commentId);
      void apiRecordCommentView(routePostId, commentId)
        .then(({ viewsCount }) => {
          setCommentsGroup((prev) =>
            prev ? patchCommentInGrouped(prev, commentId, { viewsCount }) : prev,
          );
        })
        .catch(() => {
          viewedCommentIds.current.delete(commentId);
        });
    },
    [meId, routePostId],
  );

  const handleToggleCommentLike = useCallback(
    async (commentId: string) => {
      if (!meId) {
        Alert.alert('Sign in', 'Log in to like comments.');
        return;
      }
      if (!routePostId) return;
      let snapshot: CommentsGroupedResponse | null = null;
      setCommentsGroup((prev) => {
        if (!prev) return prev;
        snapshot = prev;
        const cur = findCommentById(prev, commentId);
        if (!cur) return prev;
        return patchCommentInGrouped(prev, commentId, {
          likesCount: Math.max(0, (cur.likesCount ?? 0) + (cur.isLiked ? -1 : 1)),
          isLiked: !cur.isLiked,
        });
      });
      if (!snapshot) return;
      try {
        const r = await apiToggleCommentLike(routePostId, commentId);
        setCommentsGroup((prev) =>
          prev
            ? patchCommentInGrouped(prev, commentId, {
                likesCount: r.likesCount,
                isLiked: r.isLiked,
              })
            : prev,
        );
      } catch (e) {
        setCommentsGroup(snapshot);
        Alert.alert('Like', getApiMessage(e));
      }
    },
    [meId, routePostId],
  );

  const handleShiftFromComment = useCallback(() => {
    if (!routePostId) return;
    navigation.navigate('ShiftPerspective', { postId: routePostId });
  }, [navigation, routePostId]);

  const openPostMenu = useCallback(() => {
    if (!routePostId || !feedPost?.user?._id) return;
    const authorId = String(feedPost.user._id);
    const own = Boolean(meId && authorId === meId);
    setPostMenuVariant(own ? 'own' : 'other');
    setPostMenuHandle(`@${feedPost.user.username}`);
    setPostMenuAuthorId(authorId);
    setPostMenuOpen(true);
  }, [routePostId, feedPost, meId]);

  const postMenuPinned = useMemo(() => feedPost?.pinnedToProfile === true, [feedPost?.pinnedToProfile]);

  const sharePost = useCallback(async () => {
    if (!routePostId) return;
    const url = buildPostShareUrl(routePostId);
    const t = feedPost?.text?.trim() ?? '';
    const head = t.slice(0, 140);
    const msg = t ? `${head}${t.length > 140 ? '…' : ''}\n${url}` : url;
    try {
      await Share.share({ message: msg, url });
    } catch {
      /* dismissed */
    }
  }, [routePostId, feedPost?.text]);

  const copyPostLink = useCallback(async () => {
    if (!routePostId) return;
    await Clipboard.setStringAsync(buildPostShareUrl(routePostId));
    Alert.alert('Copied', 'Post link copied to clipboard.');
  }, [routePostId]);

  const handlePinToggle = useCallback(async () => {
    if (!routePostId || !feedPost) return;
    const nextPinned = !feedPost.pinnedToProfile;
    setPinBusy(true);
    try {
      await apiPinPost(routePostId, { pinned: nextPinned });
      setPostMenuOpen(false);
      await loadPostAndComments();
    } catch (e) {
      Alert.alert('Pin', getApiMessage(e));
    } finally {
      setPinBusy(false);
    }
  }, [routePostId, feedPost, loadPostAndComments]);

  const handleHidePost = useCallback(async () => {
    if (!routePostId) return;
    setHideBusy(true);
    try {
      await apiSetHiddenPost(routePostId, true);
      await refreshUser();
      setPostMenuOpen(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Hide post', getApiMessage(e));
    } finally {
      setHideBusy(false);
    }
  }, [routePostId, refreshUser, navigation]);

  const handleMuteUser = useCallback(() => {
    if (!postMenuAuthorId) {
      Alert.alert('Unavailable', 'Could not resolve this account.');
      return;
    }
    Alert.alert(
      `Mute ${postMenuHandle}?`,
      'Their posts won’t appear in Home, Explore, or Search.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiSetMutedUser(postMenuAuthorId, true);
              setPostMenuOpen(false);
              await refreshUser();
              navigation.goBack();
              Alert.alert('Muted', `You’ve muted ${postMenuHandle}.`);
            } catch (e) {
              Alert.alert('Mute', getApiMessage(e));
            }
          },
        },
      ],
    );
  }, [postMenuAuthorId, postMenuHandle, refreshUser, navigation]);

  const requestBlockUser = useCallback(() => {
    if (!postMenuAuthorId) {
      Alert.alert('Unavailable', 'Could not resolve this account.');
      return;
    }
    setPostMenuOpen(false);
    setBlockConfirmOpen(true);
  }, [postMenuAuthorId]);

  const runDeletePost = useCallback(async () => {
    if (!routePostId || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await apiDeletePost(routePostId);
      setDeleteOpen(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Delete', getApiMessage(e));
    } finally {
      setDeleteBusy(false);
    }
  }, [routePostId, deleteBusy, navigation]);

  const shiftedRead =
    feedPost?.user &&
    routePostId &&
    feedPost.shiftFrom &&
    feedPost.originalPost
      ? {
          mapped: mapShiftedPost(feedPost, feedPost.originalPost),
          originalId: feedPost.originalPost.id,
          authorId: feedPost.user._id,
          mediaUrl: feedPost.originalPost.mediaUrl,
        }
      : null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE_BG }} edges={['top', 'bottom']}>
      <View className="flex-1">
          <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-3 py-3">
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#334155" />
            </Pressable>
            <View className="items-center">
              <Text className="text-lg font-bold text-slate-900">Read Comment</Text>
              {variant === 'shifted' || feedPost?.originalPost ? (
                <Text className="mt-0.5 text-xs font-semibold text-sky-700">Shifted post</Text>
              ) : null}
            </View>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={20} color="#334155" />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 80 + Math.max(insets.bottom, 20),
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
        {/* Original post — live data when opened from feed with postId */}
        {postLoading && routePostId ? (
          <View
            className="items-center rounded-3xl bg-white p-10"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : null}

        {postError && routePostId && !postLoading ? (
          <Text className="mb-3 text-center text-sm text-amber-800">{postError}</Text>
        ) : null}

        {!postLoading && shiftedRead && feedPost ? (
          <ShiftedPostCard
            author={shiftedRead.mapped.author}
            handle={shiftedRead.mapped.handle}
            timeLabel={shiftedRead.mapped.timeLabel}
            avatar={shiftedRead.mapped.avatar}
            perspectiveLabel={shiftedRead.mapped.perspectiveLabel}
            body={shiftedRead.mapped.body}
            nested={shiftedRead.mapped.nested}
            comments={shiftedRead.mapped.comments}
            likes={shiftedRead.mapped.likes}
            views={shiftedRead.mapped.views}
            liked={feedPost.isLiked}
            onLike={runToggleLike}
            onPressComment={scrollToThreadEnd}
            onPressAuthor={
              shiftedRead.authorId && user?._id && shiftedRead.authorId !== user._id
                ? () => navigation.navigate('UserProfile', { userId: shiftedRead.authorId })
                : undefined
            }
            onShift={() => navigation.navigate('ShiftPerspective', { postId: shiftedRead.originalId })}
            onPressNestedImage={
              shiftedRead.mediaUrl?.trim() || feedPost.originalPost?.media?.length
                ? () => {
                    const op = feedPost.originalPost!;
                    const items = op.media?.length
                      ? op.media
                      : op.mediaUrl?.trim()
                        ? [
                            {
                              url: op.mediaUrl.trim(),
                              resourceType: inferMediaResourceType(op.mediaUrl),
                            },
                          ]
                        : [];
                    if (items.length) navigation.navigate('MediaViewer', { items, initialIndex: 0 });
                  }
                : undefined
            }
            onMore={openPostMenu}
          />
        ) : null}

        {feedPost?.user && routePostId && !postLoading && !(feedPost.shiftFrom && feedPost.originalPost) ? (
          <View
            className="rounded-3xl bg-white p-4"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row">
                <Image
                  source={
                    feedPost.user.avatarUrl
                      ? { uri: feedPost.user.avatarUrl }
                      : Images.readComment.avatarPost
                  }
                  className="h-12 w-12 rounded-full"
                  resizeMode="cover"
                  accessibilityLabel={formatUserDisplayName({
                    fullName: feedPost.user.fullName,
                    displayName: feedPost.user.displayName,
                    username: feedPost.user.username,
                  })}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[16px] font-bold text-slate-900" numberOfLines={2}>
                    {formatUserDisplayName({
                      fullName: feedPost.user.fullName,
                      displayName: feedPost.user.displayName,
                      username: feedPost.user.username,
                    })}
                  </Text>
                  <Text className="mt-0.5 text-sm text-slate-500">
                    <Text>{formatAtUsername(feedPost.user.username)}</Text>
                    <Text className="text-slate-400"> · </Text>
                    <Text className="text-slate-400">{formatRelativeTime(feedPost.createdAt)}</Text>
                  </Text>
                </View>
              </View>
              <Pressable hitSlop={8} accessibilityLabel="Bookmark">
                <Ionicons name="bookmark-outline" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Text className="mt-4 text-[15px] leading-6 text-slate-800">{feedPost.text}</Text>

            {feedPost.mediaUrl?.trim() || feedPost.media?.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View post media"
                onPress={() => {
                  const items = feedPost.media?.length
                    ? feedPost.media
                    : feedPost.mediaUrl?.trim()
                      ? [
                          {
                            url: feedPost.mediaUrl.trim(),
                            resourceType: inferMediaResourceType(feedPost.mediaUrl),
                          },
                        ]
                      : [];
                  if (items.length) navigation.navigate('MediaViewer', { items, initialIndex: 0 });
                }}
              >
                <Image
                  source={{
                    uri: (feedPost.media?.[0]?.url || feedPost.mediaUrl || '').trim(),
                  }}
                  className="mt-4 w-full overflow-hidden rounded-2xl"
                  style={{ height: 200 }}
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}

            {feedPost.isLiked ? (
              <Text className="mt-1 text-xs font-medium text-slate-500">Liked by you</Text>
            ) : null}

            <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
              <Pressable
                onPress={openFullReply}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="View comments"
              >
                <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
                <Text className="ml-1 text-sm text-slate-600">
                  {formatCompactCount(feedPost.commentsCount ?? 0)}
                </Text>
              </Pressable>
              <Pressable
                onPress={runToggleLike}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel={feedPost.isLiked ? 'Unlike post' : 'Like post'}
              >
                <Ionicons
                  name={feedPost.isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={feedPost.isLiked ? HEART_LIKED : HEART_MUTED}
                />
                <Text
                  className="ml-1 text-sm"
                  style={{ color: feedPost.isLiked ? '#334155' : '#64748b' }}
                  numberOfLines={1}
                >
                  {formatCompactCount(feedPost.likesCount)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('ShiftPerspective', { postId: routePostId })}
                className="flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Shift perspective"
              >
                <Ionicons name="sync" size={18} color="#64748b" />
                <Text className="ml-1 text-sm font-semibold text-slate-700">Shift</Text>
              </Pressable>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={18} color="#64748b" />
                <Text className="ml-1 text-sm text-slate-500">
                  {formatCompactCount(feedPost.viewsCount ?? 0)}
                </Text>
              </View>
              <Pressable
                hitSlop={14}
                className="ml-auto"
                onPress={openPostMenu}
                accessibilityLabel="Post options"
                accessibilityRole="button"
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {!routePostId ? (
          <View
            className="rounded-3xl bg-white p-4"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row">
                <Image
                  source={Images.readComment.avatarPost}
                  className="h-12 w-12 rounded-full"
                  resizeMode="cover"
                  accessibilityLabel="Annette Black"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[16px] font-bold text-slate-900">Annette Black</Text>
                  <Text className="mt-0.5 text-sm text-slate-500">
                    <Text className="text-slate-400">2h</Text>
                    {' · '}
                    <Text>@elenadesign</Text>
                  </Text>
                </View>
              </View>
              <Pressable hitSlop={8} accessibilityLabel="Bookmark">
                <Ionicons name="bookmark-outline" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Text className="mt-4 text-[15px] leading-6 text-slate-800">
              Everyone has different animal preferences. It&apos;s important to respect the choices people make about their
              pets and companions — calm isn&apos;t one-size-fits-all.
            </Text>

            <Image
              source={Images.mediaCat}
              className="mt-4 w-full overflow-hidden rounded-2xl"
              style={{ height: 200 }}
              resizeMode="cover"
            />

            <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
              <View className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
                <Text className="ml-1 text-sm text-slate-600">7.50k</Text>
              </View>
              <View className="flex-row items-center">
                <Image
                  source={Images.readComment.iconHeartMark}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text className="ml-1 text-sm text-slate-600">24.4k</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="sync" size={18} color="#64748b" />
                <Text className="ml-1 text-sm font-semibold text-slate-700">Shift</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={18} color="#64748b" />
                <Text className="ml-1 text-sm text-slate-600">900K</Text>
              </View>
              <Pressable hitSlop={8} className="ml-auto">
                <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Accordion categories — counts and bodies from GET /posts/:id/comments/grouped */}
        <View className="mt-5">
          {CATEGORY_DEFS.map((row) => {
            const expanded = openId === row.id;
            const list = commentsGroup?.grouped[row.apiCategory] ?? [];
            const count = list.length;
            return (
              <View
                key={row.id}
                className="mb-2 overflow-hidden rounded-2xl bg-white"
                style={{
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <Pressable
                  onPress={() => toggle(row.id)}
                  className="flex-row items-center justify-between px-4 py-3.5"
                >
                  <View className="flex-row items-center">
                    <AccordionCategoryGlyph apiCategory={row.apiCategory} />
                    <View className="ml-3 flex-row flex-wrap items-baseline">
                      <Text className="text-base font-bold" style={{ color: FIGMA_PRIMARY }}>
                        {row.title}
                      </Text>
                      <Text className="text-base font-bold" style={{ color: FIGMA_ACCENT }}>
                        {' '}
                        ({count})
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#C4C7CC"
                  />
                </Pressable>

                {expanded ? (
                  <View
                    className="border-t border-slate-100/80 px-4 pb-4 pt-2"
                    style={{ backgroundColor: '#F8F9FA' }}
                  >
                    {list.length === 0 ? (
                      <Text className="py-2 text-center text-sm text-slate-500">
                        No replies in this category yet.
                      </Text>
                    ) : (
                      list.map((c) => (
                        <ThreadCommentCard
                          key={c._id}
                          c={c}
                          postId={routePostId!}
                          meId={meId}
                          onReply={onReplyToComment}
                          onPollVoted={() => void loadPostAndComments()}
                          onToggleCommentLike={handleToggleCommentLike}
                          onRegisterView={handleRegisterCommentView}
                          onShift={handleShiftFromComment}
                        />
                      ))
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={openFullReply}
          disabled={!routePostId || postLoading || !feedPost}
          className="mt-2 items-center rounded-full border border-slate-200 bg-white py-3.5"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 1,
            opacity: !routePostId || postLoading || !feedPost ? 0.45 : 1,
          }}
        >
          <Text className="font-semibold text-blue-600">Open full reply panel</Text>
        </Pressable>
          </ScrollView>

        <PostActionsSheet
          key={`read-${routePostId ?? 'x'}-${postMenuVariant}`}
          visible={postMenuOpen}
          onClose={() => setPostMenuOpen(false)}
          variant={postMenuVariant}
          postId={routePostId ?? ''}
          postHandle={postMenuHandle}
          isPinned={postMenuPinned}
          pinBusy={pinBusy}
          onPinToggle={() => void handlePinToggle()}
          onViewInsights={() => {
            setPostMenuOpen(false);
            if (routePostId) navigation.navigate('PostInsights', { postId: routePostId });
          }}
          onEdit={() => {
            setPostMenuOpen(false);
            if (routePostId) navigation.navigate('EditPost', { postId: routePostId });
          }}
          onShare={() => {
            setPostMenuOpen(false);
            void sharePost();
          }}
          onCopyLink={() => {
            setPostMenuOpen(false);
            void copyPostLink();
          }}
          onHidePost={() => void handleHidePost()}
          onMuteUser={handleMuteUser}
          onBlockUser={requestBlockUser}
          hideBusy={hideBusy}
          onReport={() => {
            setPostMenuOpen(false);
            if (routePostId) navigation.navigate('Report', { postId: routePostId });
          }}
          onDelete={() => {
            setPostMenuOpen(false);
            setDeleteOpen(true);
          }}
        />

        <ConfirmDialog
          visible={deleteOpen}
          onClose={() => {
            if (!deleteBusy) setDeleteOpen(false);
          }}
          title="Delete?"
          message="This can’t be undone."
          primaryLabel="Delete"
          primaryDisabled={deleteBusy}
          onPrimary={() => void runDeletePost()}
          icon={<Ionicons name="trash-outline" size={22} color="#6366F1" />}
        />

        <ConfirmDialog
          visible={blockConfirmOpen}
          onClose={() => {
            if (!blockActionBusy) setBlockConfirmOpen(false);
          }}
          title={`Block ${postMenuHandle}?`}
          message="They won’t see your profile or interact with you. You won’t see their posts."
          primaryLabel="Block"
          primaryDisabled={blockActionBusy}
          onPrimary={async () => {
            if (!postMenuAuthorId || blockActionBusy) return;
            setBlockActionBusy(true);
            try {
              await apiSetBlockedUser(postMenuAuthorId, true);
              setBlockConfirmOpen(false);
              await refreshUser();
              navigation.goBack();
              Alert.alert('Blocked', `${postMenuHandle} has been blocked.`);
            } catch (e) {
              Alert.alert('Block', getApiMessage(e));
            } finally {
              setBlockActionBusy(false);
            }
          }}
          icon={<Ionicons name="ban-outline" size={22} color="#6366F1" />}
        />
      </View>
    </SafeAreaView>
  );
}
