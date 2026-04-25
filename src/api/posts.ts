import { apiClient } from './client';

export type ApiFeedPostUser = {
  _id: string;
  username: string;
  fullName?: string;
  displayName: string;
  avatarUrl: string;
};

/** Quoted post embedded in a “shift” reply (from populated `shiftFrom`). */
export type ApiOriginalPostSnapshot = {
  id: string;
  text: string;
  media?: { url: string; resourceType: 'image' | 'video' | 'raw' }[];
  mediaUrl: string;
  user: ApiFeedPostUser | null;
  createdAt: string;
};

export type ApiFeedPost = {
  id: string;
  user: ApiFeedPostUser | null;
  text: string;
  media?: { url: string; resourceType: 'image' | 'video' | 'raw' }[];
  mediaUrl: string;
  mediaOrigin?: 'human' | 'ai';
  mood: string;
  /** AI Moderator label + scores (from backend). */
  aiLabel?: string;
  aiScore?: {
    toxicity: number;
    humor: number;
    intensity: number;
    depth: number;
    repetition: number;
  };
  commentsCount?: number;
  viewsCount?: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  /** Saved collection when the viewer bookmarked this post (Calm, Serious, …). */
  bookmarkCollectionMood?: string | null;
  perspective?: string;
  shiftFrom?: string | null;
  /** Present when this post is a shift and the API populated the source post. */
  originalPost?: ApiOriginalPostSnapshot | null;
  /** Author-only: shown first on profile; at most one pinned per user. */
  pinnedToProfile?: boolean;
  createdAt: string;
};

export async function apiToggleLike(postId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { post: ApiFeedPost; liked?: boolean; likesCount?: number };
  }>(`/posts/${encodeURIComponent(postId)}/like`);
  return data.data.post;
}

export async function apiViewPost(postId: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { post: ApiFeedPost } }>(
    `/posts/${encodeURIComponent(postId)}/view`,
  );
  return data.data.post;
}

export async function apiGetExploreMood(params?: { per?: number }) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { calm: ApiFeedPost[]; serious: ApiFeedPost[]; creative: ApiFeedPost[] };
  }>('/posts/explore/mood', { params: { per: params?.per ?? 6 } });
  return data.data;
}

export type PostInsights = {
  postId: string;
  likesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  shiftsCount: number;
  mood: string;
  createdAt: string;
  pinnedToProfile: boolean;
  textPreview: string;
  hasMedia: boolean;
};

export type MoodWeekSegment = {
  mood: string;
  count: number;
  flex: number;
  color: string;
};

export type ProfilePassportSegment = { flex: number; color: string };

export type ProfileInsight = {
  id: string;
  icon: 'sun' | 'shield';
  title: string;
  sub: string;
};

export type ProfileAnalytics = {
  moodWeek: MoodWeekSegment[];
  moodPassport: {
    segments: ProfilePassportSegment[];
    timeLabels: string[];
  };
  insights: ProfileInsight[];
};

export type BookmarkCollectionRow = {
  mood: string;
  count: number;
  preview: ApiFeedPost | null;
};

export type FeedResponse = {
  posts: ApiFeedPost[];
  page: number;
  limit: number;
  total: number;
};

export type ExploreMoodSection = {
  mood: string;
  posts: ApiFeedPost[];
};

export type ExploreResponse = {
  moods: ExploreMoodSection[];
  topics: string[];
};

export async function apiGetExplore(params?: { perMood?: number }) {
  const { data } = await apiClient.get<{ success: boolean; data: ExploreResponse }>('/posts/explore', {
    params: { perMood: params?.perMood ?? 3 },
  });
  return data.data;
}

export async function apiSearchPosts(params: { q: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get<{ success: boolean; data: FeedResponse }>('/posts/search', {
    params: {
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return data.data;
}

export async function apiGetFeed(params?: { mood?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get<{ success: boolean; data: FeedResponse }>(
    '/posts/feed',
    {
      params: {
        mood: params?.mood,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      },
    },
  );
  return data.data;
}

export async function apiCreatePost(form: FormData) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { post: ApiFeedPost };
  }>('/posts', form);
  return data.data.post;
}

export type MyPostsTab = 'posts' | 'shifted' | 'bookmarks' | 'likes' | 'media';

export async function apiGetMyPosts(params: {
  tab: MyPostsTab;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: FeedResponse & { tab: string };
  }>('/posts/me', {
    params: {
      tab: params.tab,
      page: params.page ?? 1,
      limit: params.limit ?? 30,
    },
  });
  return data.data;
}

export async function apiGetProfileAnalytics() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ProfileAnalytics;
  }>('/posts/me/analytics');
  return data.data;
}

export async function apiGetBookmarkCollections() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { collections: BookmarkCollectionRow[] };
  }>('/posts/me/bookmarks');
  return data.data.collections;
}

export async function apiBookmarkPost(
  postId: string,
  body: { collectionMood: string } | { remove: true },
) {
  const { data } = await apiClient.post<{ success: boolean; data: { post: ApiFeedPost } }>(
    `/posts/${encodeURIComponent(postId)}/bookmark`,
    body,
  );
  return data.data.post;
}

export async function apiGetUserPosts(params: {
  userId: string;
  tab?: 'posts' | 'shifted' | 'media';
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: FeedResponse & { tab: string };
  }>(`/posts/user/${encodeURIComponent(params.userId)}`, {
    params: {
      tab: params.tab ?? 'posts',
      page: params.page ?? 1,
      limit: params.limit ?? 30,
    },
  });
  return data.data;
}

export async function apiGetPost(postId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: { post: ApiFeedPost } }>(
    `/posts/${encodeURIComponent(postId)}`,
  );
  return data.data.post;
}

export async function apiUpdatePost(postId: string, body: { text: string }) {
  const { data } = await apiClient.patch<{ success: boolean; data: { post: ApiFeedPost } }>(
    `/posts/${encodeURIComponent(postId)}`,
    body,
  );
  return data.data.post;
}

export async function apiDeletePost(postId: string) {
  const { data } = await apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
    `/posts/${encodeURIComponent(postId)}`,
  );
  return data.data;
}

export async function apiPinPost(postId: string, body: { pinned: boolean }) {
  const { data } = await apiClient.post<{ success: boolean; data: { post: ApiFeedPost } }>(
    `/posts/${encodeURIComponent(postId)}/pin`,
    body,
  );
  return data.data.post;
}

export async function apiGetPostInsights(postId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: PostInsights }>(
    `/posts/${encodeURIComponent(postId)}/insights`,
  );
  return data.data;
}

/** Create a “shift” reply linked to an original post (`POST /posts/:id/shift`). */
export async function apiShiftPost(
  postId: string,
  body: { perspective: string; text: string; taggedUsers?: string[]; media?: { uri: string; type: string; name: string } },
) {
  const form = new FormData();
  form.append('perspective', body.perspective);
  form.append('text', body.text);
  if (body.taggedUsers?.length) {
    form.append('taggedUsers', JSON.stringify(body.taggedUsers));
  }
  if (body.media) {
    form.append('media', body.media as unknown as Blob);
  }
  const { data } = await apiClient.post<{
    success: boolean;
    data: { post: ApiFeedPost; originalPostId: string };
  }>(`/posts/${encodeURIComponent(postId)}/shift`, form);
  return data.data;
}

export function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 45) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
