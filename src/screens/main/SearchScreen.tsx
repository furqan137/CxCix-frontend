import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiSearchPosts,
  apiToggleLike,
  formatCompactCount,
  formatRelativeTime,
  type ApiFeedPost,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { apiSearchUsers, type PublicUser } from '../../api/users';
import { mapShiftedPost } from '../../components/feed/mapShiftedPost';
import { PostCard } from '../../components/feed/PostCard';
import { ShiftedPostCard } from '../../components/feed/ShiftedPostCard';
import { Images } from '../../constants/images';
import type { MediaId } from '../../constants/mediaMap';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { inferMediaResourceType } from '../../utils/inferMediaResourceType';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'Search'>;

const PAGE = '#F5F7F9';

function mapPostToCard(p: ApiFeedPost) {
  const u = p.user;
  const author = formatUserDisplayName({
    fullName: u?.fullName,
    displayName: u?.displayName,
    username: u?.username,
  });
  const handle = u ? formatAtUsername(u.username) : formatAtUsername(null);
  const avatar: ImageSourcePropType | undefined = u?.avatarUrl ? { uri: u.avatarUrl } : undefined;
  const image: ImageSourcePropType | undefined = p.mediaUrl ? { uri: p.mediaUrl } : undefined;
  return {
    author,
    handle,
    timeLabel: formatRelativeTime(p.createdAt),
    body: p.text,
    image,
    avatar,
    comments: '—',
    likes: formatCompactCount(p.likesCount),
    views: '—',
  };
}

/**
 * Search people (existing API) and posts (`GET /posts/search`).
 */
export default function SearchScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<'People' | 'Posts'>(route.params?.initialTab ?? 'People');
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [people, setPeople] = useState<PublicUser[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const [postResults, setPostResults] = useState<ApiFeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openRead = useCallback(
    (postId: string, variant: 'standard' | 'shifted' = 'standard', focusInput = false) => {
      stackNav()?.navigate('ReadComment', { postId, variant, focusInput });
    },
    [stackNav],
  );

  const runToggleLike = useCallback((postId: string) => {
    let before: ApiFeedPost | null = null;
    setPostResults((prev) => {
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
        setPostResults((cur) => cur.map((x) => (x.id === postId ? { ...x, ...updated } : x)));
      } catch (e) {
        setPostResults((cur) => cur.map((x) => (x.id === postId && before ? before : x)));
        Alert.alert('Like', getApiMessage(e));
      }
    })();
  }, []);

  const openShift = useCallback(
    (postId: string) => {
      stackNav()?.navigate('ShiftPerspective', { postId });
    },
    [stackNav],
  );

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

  useEffect(() => {
    if (route.params?.initialTab) setTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  useEffect(() => {
    if (route.params?.initialQuery != null && route.params.initialQuery !== '') {
      setQuery(route.params.initialQuery);
    }
  }, [route.params?.initialQuery]);

  useEffect(() => {
    if (tab !== 'People') return;
    const t = setTimeout(() => {
      const q = query.trim();
      if (q.length < 2) {
        setPeople([]);
        return;
      }
      setPeopleLoading(true);
      void (async () => {
        try {
          const users = await apiSearchUsers(q);
          setPeople(users);
        } catch {
          setPeople([]);
        } finally {
          setPeopleLoading(false);
        }
      })();
    }, 350);
    return () => clearTimeout(t);
  }, [query, tab]);

  useEffect(() => {
    if (tab !== 'Posts') return;
    const t = setTimeout(() => {
      const q = query.trim();
      if (q.length < 2) {
        setPostResults([]);
        setPostsError(null);
        return;
      }
      setPostsLoading(true);
      setPostsError(null);
      void (async () => {
        try {
          const res = await apiSearchPosts({ q, limit: 30 });
          setPostResults(res.posts);
        } catch (e) {
          setPostResults([]);
          setPostsError(getApiMessage(e));
        } finally {
          setPostsLoading(false);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [query, tab]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Search</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search people or posts..."
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 text-sm text-slate-900"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <View className="flex-row">
            <Pressable onPress={() => setTab('People')} className="flex-1 overflow-hidden">
              {tab === 'People' ? (
                <LinearGradient
                  colors={['#6366F1', '#FDE047']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-sm font-bold text-white">People</Text>
                </LinearGradient>
              ) : (
                <View className="items-center py-3">
                  <Text className="text-sm font-semibold text-slate-400">People</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setTab('Posts')} className="flex-1 overflow-hidden">
              {tab === 'Posts' ? (
                <LinearGradient
                  colors={['#6366F1', '#FDE047']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-sm font-bold text-white">Posts</Text>
                </LinearGradient>
              ) : (
                <View className="items-center py-3">
                  <Text className="text-sm font-semibold text-slate-400">Posts</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View className="mt-4">
          {tab === 'Posts' ? (
            <>
              {query.trim().length < 2 ? (
                <Text className="mt-6 text-center text-sm text-slate-500">
                  Type at least 2 characters to search posts by text, perspective, or mood.
                </Text>
              ) : postsLoading ? (
                <View className="mt-10 items-center">
                  <ActivityIndicator color="#6366F1" />
                  <Text className="mt-3 text-sm text-slate-500">Searching posts…</Text>
                </View>
              ) : postsError ? (
                <Text className="mt-6 text-center text-sm text-amber-800">{postsError}</Text>
              ) : postResults.length === 0 ? (
                <Text className="mt-6 text-center text-sm text-slate-500">No posts found.</Text>
              ) : (
                postResults.map((p) => {
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
                      avatar={c.avatar}
                      comments={c.comments}
                      likes={c.likes}
                      views={c.views}
                      liked={p.isLiked}
                      onLike={() => runToggleLike(p.id)}
                      onPressComment={() => openRead(p.id, 'standard', true)}
                      onShift={() => openShift(p.id)}
                      onOpenPost={() => openRead(p.id, 'standard')}
                      onPressAuthor={openAuthorProfile}
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
                    />
                  );
                })
              )}
            </>
          ) : peopleLoading ? (
            <View className="mt-8 items-center">
              <ActivityIndicator color="#6366F1" />
            </View>
          ) : query.trim().length < 2 ? (
            <Text className="mt-6 text-center text-sm text-slate-500">
              Type at least 2 characters to search by username or name.
            </Text>
          ) : people.length === 0 ? (
            <Text className="mt-6 text-center text-sm text-slate-500">No people found.</Text>
          ) : (
            people.map((u) => {
              const src =
                u.avatarUrl && u.avatarUrl.length > 0 ? { uri: u.avatarUrl } : Images.avatarSplit;
              return (
                <Pressable
                  key={u._id}
                  onPress={() => navigation.navigate('UserProfile', { userId: u._id })}
                  className="mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <Image source={src} className="h-12 w-12 rounded-full border border-slate-200" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
                      {formatUserDisplayName({
                        fullName: u.fullName,
                        displayName: u.displayName,
                        username: u.username,
                      })}
                    </Text>
                    <Text className="text-sm text-slate-500" numberOfLines={1}>
                      {formatAtUsername(u.username)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
