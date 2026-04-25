import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiBookmarkPost,
  apiDeletePost,
  apiGetFeed,
  apiPinPost,
  apiToggleLike,
  apiViewPost,
  formatCompactCount,
  formatRelativeTime,
  type ApiFeedPost,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { apiSetBlockedUser, apiSetHiddenPost, apiSetMutedUser, apiSetMyMood } from '../../api/users';
import { mapShiftedPost } from '../../components/feed/mapShiftedPost';
import { PostCard } from '../../components/feed/PostCard';
import { ShiftedPostCard } from '../../components/feed/ShiftedPostCard';
import { MoodBridgesSheet } from '../../components/sheets/MoodBridgesSheet';
import { PostActionsSheet } from '../../components/sheets/PostActionsSheet';
import { SaveBookmarkSheet } from '../../components/sheets/SaveBookmarkSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Images } from '../../constants/images';
import type { MediaId } from '../../constants/mediaMap';
import { MOOD_LABELS } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { useMoodStore } from '../../store/useMoodStore';
import type { MoodId } from '../../constants/moods';
import { inferMediaResourceType } from '../../utils/inferMediaResourceType';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

const PAGE = '#F8FAFC';

function buildPostShareUrl(id: string) {
  const base = (process.env.EXPO_PUBLIC_POST_SHARE_BASE ?? 'https://cxcix.app/post').replace(
    /\/$/,
    '',
  );
  return `${base}/${id}`;
}

/**
 * Home feed — mood filter + posts from `GET /posts/feed`. Refetches when the screen gains focus (e.g. after creating a post).
 */
export default function FeedScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const myHandle = user ? `@${user.username}` : '';

  const currentMood = useMoodStore((s) => s.currentMood);
  const setMood = useMoodStore((s) => s.setMood);
  const [moodSheetOpen, setMoodSheetOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkPostId, setBookmarkPostId] = useState<string | null>(null);
  const [bookmarkCollectionMood, setBookmarkCollectionMood] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsVariant, setActionsVariant] = useState<'own' | 'other'>('other');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionsPostId, setActionsPostId] = useState<string>('');
  const [actionsPostHandle, setActionsPostHandle] = useState<string>('@username');
  const [actionsAuthorUserId, setActionsAuthorUserId] = useState<string>('');
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [hideBusy, setHideBusy] = useState(false);
  const [blockActionBusy, setBlockActionBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [posts, setPosts] = useState<ApiFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const viewedRef = useRef(new Set<string>());

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const moodLabel = MOOD_LABELS[currentMood];
      const res = await apiGetFeed({ mood: moodLabel });
      setPosts(res.posts);
    } catch (e) {
      setError(getApiMessage(e));
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMood]);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed();
  }, [loadFeed]);

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openShift = useCallback(
    (postId: string) => {
      stackNav()?.navigate('ShiftPerspective', { postId });
    },
    [stackNav],
  );

  const openRead = useCallback(
    (postId: string, variant: 'standard' | 'shifted' = 'standard', focusInput = false) => {
      stackNav()?.navigate('ReadComment', { postId, variant, focusInput });
    },
    [stackNav],
  );

  const runToggleLike = useCallback((postId: string) => {
    let before: ApiFeedPost | null = null;
    setPosts((prev) => {
      const p = prev.find((x) => x.id === postId);
      if (!p) return prev;
      before = { ...p };
      const newLiked = !p.isLiked;
      const nextCount = Math.max(0, p.likesCount + (newLiked ? 1 : -1));
      return prev.map((x) =>
        x.id === postId ? { ...x, isLiked: newLiked, likesCount: nextCount } : x,
      );
    });
    if (!before) return;
    void (async () => {
      try {
        const updated = await apiToggleLike(postId);
        setPosts((cur) => cur.map((x) => (x.id === postId ? { ...x, ...updated } : x)));
      } catch (e) {
        setPosts((cur) => cur.map((x) => (x.id === postId && before ? before : x)));
        Alert.alert('Like', getApiMessage(e));
      }
    })();
  }, []);

  const openImage = useCallback(
    (opts: { mediaId?: MediaId; imageUri?: string }) => {
      if (opts.imageUri) {
        stackNav()?.navigate('ImageViewer', { imageUri: opts.imageUri });
      } else if (opts.mediaId) {
        stackNav()?.navigate('ImageViewer', { mediaId: opts.mediaId });
      }
    },
    [stackNav],
  );

  const openMediaViewer = useCallback(
    (items: { url: string; resourceType: 'image' | 'video' | 'raw' }[], initialIndex = 0) => {
      if (!items.length) return;
      stackNav()?.navigate('MediaViewer', { items, initialIndex });
    },
    [stackNav],
  );

  const openCreate = useCallback(() => {
    stackNav()?.navigate('CreatePost');
  }, [stackNav]);

  const onMoodPress = () => {
    setMoodSheetOpen(true);
  };

  const onSwitchMood = useCallback(
    (m: MoodId) => {
      setMood(m);
      setMoodSheetOpen(false);
      // Persist mood selection server-side (best-effort).
      void apiSetMyMood(MOOD_LABELS[m]).catch(() => undefined);
    },
    [setMood],
  );

  const openActions = (
    postId: string,
    variant: 'own' | 'other',
    postHandle?: string,
    authorUserId?: string,
  ) => {
    setActionsPostId(postId);
    setActionsVariant(variant);
    setActionsPostHandle(postHandle ?? '@username');
    setActionsAuthorUserId(authorUserId?.trim() ?? '');
    setActionsOpen(true);
  };

  const sharePostById = useCallback(async (postId: string, textSnippet?: string) => {
    const url = buildPostShareUrl(postId);
    const t = textSnippet?.trim() ?? '';
    const head = t.slice(0, 140);
    const msg = t ? `${head}${t.length > 140 ? '…' : ''}\n${url}` : url;
    try {
      await Share.share({ message: msg, url });
    } catch {
      /* user dismissed */
    }
  }, []);

  const copyPostLink = useCallback(async (postId: string) => {
    const url = buildPostShareUrl(postId);
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'Post link copied to clipboard.');
  }, []);

  /** Figma: first tap = choose collection sheet; second tap (already saved) = remove, no sheet. */
  const handleBookmarkPress = useCallback((p: ApiFeedPost) => {
    if (p.isBookmarked) {
      void (async () => {
        try {
          const updated = await apiBookmarkPost(p.id, { remove: true });
          setPosts((prev) =>
            prev.map((x) =>
              x.id === p.id
                ? {
                    ...x,
                    isBookmarked: updated.isBookmarked,
                    bookmarkCollectionMood: updated.bookmarkCollectionMood ?? null,
                  }
                : x,
            ),
          );
        } catch (e) {
          Alert.alert('Could not update bookmark', getApiMessage(e));
        }
      })();
      return;
    }
    setBookmarkPostId(p.id);
    setBookmarkCollectionMood(p.bookmarkCollectionMood ?? null);
    setBookmarkOpen(true);
  }, []);

  const actionsTargetPost = posts.find((x) => x.id === actionsPostId);
  const actionsPinned = actionsTargetPost?.pinnedToProfile === true;

  const handlePinToggle = useCallback(async () => {
    if (!actionsPostId) return;
    const p = posts.find((x) => x.id === actionsPostId);
    const currentlyPinned = p?.pinnedToProfile === true;
    setPinBusy(true);
    try {
      await apiPinPost(actionsPostId, { pinned: !currentlyPinned });
      setActionsOpen(false);
      await loadFeed();
    } catch (e) {
      Alert.alert('Pin', getApiMessage(e));
    } finally {
      setPinBusy(false);
    }
  }, [actionsPostId, posts, loadFeed]);

  const handleHidePost = useCallback(async () => {
    if (!actionsPostId) return;
    setHideBusy(true);
    try {
      await apiSetHiddenPost(actionsPostId, true);
      await refreshUser();
      await loadFeed();
      setActionsOpen(false);
    } catch (e) {
      Alert.alert('Hide post', getApiMessage(e));
    } finally {
      setHideBusy(false);
    }
  }, [actionsPostId, loadFeed, refreshUser]);

  const handleMuteUser = useCallback(() => {
    if (!actionsAuthorUserId) {
      Alert.alert('Unavailable', 'Could not resolve this account.');
      return;
    }
    Alert.alert(
      `Mute ${actionsPostHandle}?`,
      'Their posts won’t appear in Home, Explore, or Search.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiSetMutedUser(actionsAuthorUserId, true);
              setActionsOpen(false);
              await refreshUser();
              await loadFeed();
              Alert.alert('Muted', `You’ve muted ${actionsPostHandle}.`);
            } catch (e) {
              Alert.alert('Mute', getApiMessage(e));
            }
          },
        },
      ],
    );
  }, [actionsAuthorUserId, actionsPostHandle, refreshUser, loadFeed]);

  const requestBlockUser = useCallback(() => {
    if (!actionsAuthorUserId) {
      Alert.alert('Unavailable', 'Could not resolve this account.');
      return;
    }
    setActionsOpen(false);
    setBlockConfirmOpen(true);
  }, [actionsAuthorUserId]);

  const mapPostToCard = (p: ApiFeedPost) => {
    const u = p.user;
    const author = formatUserDisplayName({
      fullName: u?.fullName,
      displayName: u?.displayName,
      username: u?.username,
    });
    const handle = u ? formatAtUsername(u.username) : formatAtUsername(null);
    const avatar: ImageSourcePropType | undefined = u?.avatarUrl
      ? { uri: u.avatarUrl }
      : undefined;
    const image: ImageSourcePropType | undefined = p.mediaUrl ? { uri: p.mediaUrl } : undefined;

    return {
      author,
      handle,
      timeLabel: formatRelativeTime(p.createdAt),
      body: p.text,
      image,
      avatar,
      comments: formatCompactCount(p.commentsCount ?? 0),
      likes: formatCompactCount(p.likesCount),
      views: formatCompactCount(p.viewsCount ?? 0),
    };
  };

  const data = useMemo(() => posts, [posts]);

  /** Matches `MainTabs` tab bar: 64 + bottom safe area (min 12). */
  const tabBarTotal = 64 + Math.max(insets.bottom, 12);
  /** Extra space so post action rows (⋯) clear the floating create button. */
  const feedListBottomPad = tabBarTotal + 96;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
          <Image
            source={Images.logoHeader}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
            accessibilityLabel="CxCix"
          />
          <Pressable onPress={onMoodPress} className="flex-1 items-center px-2">
            <LinearGradient
              colors={['#6366F1', '#FDE047']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                borderRadius: 9999,
                paddingHorizontal: 18,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text className="text-sm font-bold text-slate-900">
                You are in {MOOD_LABELS[currentMood]}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#0f172a" />
            </LinearGradient>
          </Pressable>
          <Pressable
            accessibilityLabel="Settings"
            onPress={() => stackNav()?.navigate('Settings')}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
          >
            <Ionicons name="settings-outline" size={20} color="#334155" />
          </Pressable>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: feedListBottomPad }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListHeaderComponent={
            <>
              {loading && posts.length === 0 ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text className="mt-3 text-sm text-slate-500">Loading feed…</Text>
                </View>
              ) : null}

              {error && !loading ? (
                <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <Text className="text-center text-sm text-amber-900">{error}</Text>
                  <Pressable onPress={() => loadFeed()} className="mt-2 items-center">
                    <Text className="text-sm font-semibold text-indigo-600">Try again</Text>
                  </Pressable>
                </View>
              ) : null}

              {!loading && !error && posts.length === 0 ? (
                <View className="items-center py-16">
                  <Ionicons name="newspaper-outline" size={48} color="#94a3b8" />
                  <Text className="mt-3 text-center text-base font-semibold text-slate-700">
                    No posts in this mood yet
                  </Text>
                  <Text className="mt-1 px-6 text-center text-sm text-slate-500">
                    Be the first to share something, or switch mood above.
                  </Text>
                </View>
              ) : null}
            </>
          }
          onViewableItemsChanged={({ viewableItems }) => {
            const nowVisible = new Set(viewableItems.map((v) => v.item.id));

            // Clear timers for items no longer visible.
            for (const [postId, t] of viewTimersRef.current.entries()) {
              if (!nowVisible.has(postId)) {
                clearTimeout(t);
                viewTimersRef.current.delete(postId);
              }
            }

            // Start timer for newly visible items.
            for (const id of nowVisible) {
              if (viewedRef.current.has(id)) continue;
              if (viewTimersRef.current.has(id)) continue;
              const timer = setTimeout(() => {
                viewedRef.current.add(id);
                viewTimersRef.current.delete(id);
                void (async () => {
                  try {
                    const updated = await apiViewPost(id);
                    setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, ...updated } : x)));
                  } catch {
                    // ignore view errors
                  }
                })();
              }, 2000);
              viewTimersRef.current.set(id, timer);
            }
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item: p }) => {
            const authorId = p.user?._id;
            const openAuthorProfile =
              authorId && user?._id && authorId !== user._id
                ? () => stackNav()?.navigate('UserProfile', { userId: authorId })
                : undefined;

            if (p.shiftFrom && p.originalPost) {
              const s = mapShiftedPost(p, p.originalPost);
              const originalId = p.originalPost.id;
              return (
                <ShiftedPostCard
                  key={p.id}
                  author={s.author}
                  handle={s.handle}
                  timeLabel={s.timeLabel}
                  avatar={s.avatar}
                  perspectiveLabel={s.perspectiveLabel}
                  body={s.body}
                  nested={s.nested}
                  comments={s.comments}
                  likes={s.likes}
                  views={s.views}
                  liked={p.isLiked}
                  onLike={() => runToggleLike(p.id)}
                  onPressComment={() => openRead(p.id, 'shifted', true)}
                  bookmarked={p.isBookmarked}
                  onPressAuthor={openAuthorProfile}
                  onPressCard={() => openRead(p.id, 'shifted')}
                  onShift={() => openShift(originalId)}
                  onPressNestedImage={
                    p.originalPost.mediaUrl?.trim() || p.originalPost.media?.length
                      ? () => {
                          const op = p.originalPost!;
                          const nestedItems = op.media?.length
                            ? op.media
                            : op.mediaUrl?.trim()
                              ? [
                                  {
                                    url: op.mediaUrl.trim(),
                                    resourceType: inferMediaResourceType(op.mediaUrl),
                                  },
                                ]
                              : [];
                          if (nestedItems.length) openMediaViewer(nestedItems, 0);
                        }
                      : undefined
                  }
                  onBookmark={() => handleBookmarkPress(p)}
                  onMore={() =>
                    openActions(
                      p.id,
                      s.handle === myHandle ? 'own' : 'other',
                      s.handle,
                      p.user?._id,
                    )
                  }
                />
              );
            }

            const c = mapPostToCard(p);
            return (
              <PostCard
                key={p.id}
                author={c.author}
                handle={c.handle}
                timeLabel={c.timeLabel}
                aiLabel={p.aiLabel}
                body={c.body}
                image={c.image}
                media={
                  p.media?.length
                    ? p.media
                    : p.mediaUrl?.trim()
                      ? [
                          {
                            url: p.mediaUrl.trim(),
                            resourceType: inferMediaResourceType(p.mediaUrl),
                          },
                        ]
                      : undefined
                }
                avatar={c.avatar}
                comments={c.comments}
                likes={c.likes}
                views={c.views}
                liked={p.isLiked}
                onLike={() => runToggleLike(p.id)}
                onPressComment={() => openRead(p.id, 'standard', true)}
                bookmarked={p.isBookmarked}
                onShift={() => openShift(p.id)}
                onOpenPost={() => openRead(p.id, 'standard')}
                onPressAuthor={openAuthorProfile}
                onPressImage={
                  p.mediaUrl?.trim()
                    ? () =>
                        openMediaViewer(
                          [
                            {
                              url: p.mediaUrl.trim(),
                              resourceType: inferMediaResourceType(p.mediaUrl),
                            },
                          ],
                          0,
                        )
                    : undefined
                }
                onPressMedia={(index) => {
                  const items = p.media?.length
                    ? p.media
                    : p.mediaUrl?.trim()
                      ? [
                          {
                            url: p.mediaUrl.trim(),
                            resourceType: inferMediaResourceType(p.mediaUrl),
                          },
                        ]
                      : [];
                  openMediaViewer(items, index);
                }}
                onBookmark={() => handleBookmarkPress(p)}
                onMore={() =>
                  openActions(p.id, c.handle === myHandle ? 'own' : 'other', c.handle, p.user?._id)
                }
              />
            );
          }}
        />

        <Pressable
          accessibilityLabel="Create post"
          onPress={openCreate}
          className="absolute"
          style={{ bottom: tabBarTotal + 10, right: 18 }}
        >
          <LinearGradient
            colors={['#7B86FF', '#A896F0', '#EDC074']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 0,
              shadowColor: '#4c1d95',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {/* Inner mark only: thin white ring ~56% of FAB + plus (no stroke on outer gradient edge) */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>

        <MoodBridgesSheet
          visible={moodSheetOpen}
          onClose={() => setMoodSheetOpen(false)}
          currentMood={currentMood}
          onSwitchMood={onSwitchMood}
        />
        <SaveBookmarkSheet
          visible={bookmarkOpen}
          postId={bookmarkPostId}
          initialCollectionMood={bookmarkCollectionMood}
          onClose={() => {
            setBookmarkOpen(false);
            setBookmarkPostId(null);
            setBookmarkCollectionMood(null);
          }}
          draft={
            bookmarkPostId
              ? (() => {
                  const p = posts.find((x) => x.id === bookmarkPostId);
                  if (!p) return undefined;
                  const c = mapPostToCard(p);
                  return {
                    author: c.author,
                    handle: c.handle,
                    timeLabel: c.timeLabel,
                    body: c.body,
                  };
                })()
              : undefined
          }
          onSaved={() => void loadFeed()}
        />
        <PostActionsSheet
          key={`${actionsPostId}-${actionsVariant}-${actionsPostHandle}`}
          visible={actionsOpen}
          onClose={() => setActionsOpen(false)}
          variant={actionsVariant}
          postId={actionsPostId}
          postHandle={actionsPostHandle}
          isPinned={actionsPinned}
          pinBusy={pinBusy}
          onPinToggle={() => void handlePinToggle()}
          onViewInsights={() => {
            setActionsOpen(false);
            stackNav()?.navigate('PostInsights', { postId: actionsPostId });
          }}
          onEdit={() => {
            setActionsOpen(false);
            stackNav()?.navigate('EditPost', { postId: actionsPostId });
          }}
          onShare={() => {
            setActionsOpen(false);
            const p = posts.find((x) => x.id === actionsPostId);
            void sharePostById(actionsPostId, p?.text);
          }}
          onCopyLink={() => {
            setActionsOpen(false);
            void copyPostLink(actionsPostId);
          }}
          onHidePost={() => void handleHidePost()}
          onMuteUser={handleMuteUser}
          onBlockUser={requestBlockUser}
          hideBusy={hideBusy}
          onReport={() => {
            setActionsOpen(false);
            stackNav()?.navigate('Report', { postId: actionsPostId });
          }}
          onDelete={() => {
            setActionsOpen(false);
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
          onPrimary={async () => {
            if (!actionsPostId || deleteBusy) return;
            setDeleteBusy(true);
            try {
              await apiDeletePost(actionsPostId);
              setDeleteOpen(false);
              await loadFeed();
            } catch (e) {
              Alert.alert('Delete', getApiMessage(e));
            } finally {
              setDeleteBusy(false);
            }
          }}
          icon={<Ionicons name="trash-outline" size={22} color="#6366F1" />}
        />
        <ConfirmDialog
          visible={blockConfirmOpen}
          onClose={() => {
            if (!blockActionBusy) setBlockConfirmOpen(false);
          }}
          title={`Block ${actionsPostHandle}?`}
          message="They won’t see your profile or interact with you. You won’t see their posts."
          primaryLabel="Block"
          primaryDisabled={blockActionBusy}
          onPrimary={async () => {
            if (!actionsAuthorUserId || blockActionBusy) return;
            setBlockActionBusy(true);
            try {
              await apiSetBlockedUser(actionsAuthorUserId, true);
              setBlockConfirmOpen(false);
              await refreshUser();
              await loadFeed();
              Alert.alert('Blocked', `${actionsPostHandle} has been blocked.`);
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
