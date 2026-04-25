import type { ApiUser } from './auth';
import { apiClient } from './client';

/** Full profile (`GET /users/:id`); search results omit relationship counts. */
export type PublicUser = {
  _id: string;
  username: string;
  fullName?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  firebaseUid?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isSelf?: boolean;
  isPrivate?: boolean;
  canViewPosts?: boolean;
};

export async function apiSearchUsers(q: string) {
  const { data } = await apiClient.get<{ success: boolean; data: { users: PublicUser[] } }>(
    '/users/search',
    { params: { q } },
  );
  return data.data.users;
}

export async function apiGetUserPublic(userId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: { user: PublicUser } }>(
    `/users/${userId}`,
  );
  return data.data.user;
}

export async function apiFollowUser(userId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { following: boolean; followersCount: number };
  }>(`/users/${userId}/follow`);
  return data.data;
}

export async function apiUnfollowUser(userId: string) {
  const { data } = await apiClient.delete<{
    success: boolean;
    data: { following: boolean; followersCount: number };
  }>(`/users/${userId}/follow`);
  return data.data;
}

export async function apiSetMutedUser(userId: string, muted: boolean) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me/mute',
    { userId, muted },
  );
  return data.data.user;
}

export async function apiSetBlockedUser(userId: string, blocked: boolean) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me/block',
    { userId, blocked },
  );
  return data.data.user;
}

export async function apiSetHiddenPost(postId: string, hidden: boolean) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me/hidden-posts',
    { postId, hidden },
  );
  return data.data.user;
}

export async function apiSetPinnedChat(chatId: string, pinned: boolean) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me/pinned-chats',
    { chatId, pinned },
  );
  return data.data.user;
}

export async function apiListMutedUsers() {
  const { data } = await apiClient.get<{ success: boolean; data: { users: PublicUser[] } }>(
    '/users/me/muted',
  );
  return data.data.users;
}

export async function apiListBlockedUsers() {
  const { data } = await apiClient.get<{ success: boolean; data: { users: PublicUser[] } }>(
    '/users/me/blocked',
  );
  return data.data.users;
}

export async function apiListMyFollowers() {
  const { data } = await apiClient.get<{ success: boolean; data: { users: PublicUser[] } }>(
    '/users/me/followers',
  );
  return data.data.users;
}

export async function apiListMyFollowing() {
  const { data } = await apiClient.get<{ success: boolean; data: { users: PublicUser[] } }>(
    '/users/me/following',
  );
  return data.data.users;
}

export type LoginActivityRow = {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  platform: string;
  createdAt: string;
};

export type AccountSecurity = {
  email: string;
  phone: string;
  twoFactorEnabled: boolean;
  recentLogins: LoginActivityRow[];
};

export async function apiGetMySecurity() {
  const { data } = await apiClient.get<{ success: boolean; data: AccountSecurity }>(
    '/users/me/security',
  );
  return data.data;
}

export async function apiSetTwoFactor(enabled: boolean) {
  const { data } = await apiClient.post<{ success: boolean; data: { twoFactorEnabled: boolean } }>(
    '/users/me/two-factor',
    { enabled },
  );
  return data.data.twoFactorEnabled;
}

export type ConnectedAccount = { provider: string; handle: string };

export type PrivacySettings = {
  isPrivate: boolean;
  showActivityStatus: boolean;
  mentions: 'everyone' | 'following' | 'no_one';
  taggingPermissions: 'everyone' | 'following' | 'no_one';
  connectedAccounts: ConnectedAccount[];
};

export async function apiGetMyPrivacy() {
  const { data } = await apiClient.get<{ success: boolean; data: PrivacySettings }>(
    '/users/me/privacy',
  );
  return data.data;
}

export async function apiUpdateMyPrivacy(patch: Partial<PrivacySettings>) {
  const { data } = await apiClient.patch<{ success: boolean; data: PrivacySettings }>(
    '/users/me/privacy',
    patch,
  );
  return data.data;
}

export async function apiExportMyData() {
  const { data } = await apiClient.get<{ success: boolean; data: unknown }>('/users/me/export');
  return data.data;
}

export async function apiSetMyMood(mood: string) {
  const { data } = await apiClient.patch<{ success: boolean; data: { currentMood: string } }>(
    '/users/me/mood',
    { mood },
  );
  return data.data.currentMood;
}

export async function apiDeleteMyAccount() {
  const { data } = await apiClient.delete<{ success: boolean; message: string }>('/users/me');
  return data;
}

export type NotificationSettings = {
  pushEnabled: boolean;
  mentions: boolean;
  followerRequests: boolean;
  likes: boolean;
  comments: boolean;
  messages: boolean;
  systemAnnouncements?: boolean;
  inAppSounds: boolean;
  quietModeEnabled: boolean;
  quietModeUntil: string | null;
};

export async function apiGetNotificationSettings() {
  const { data } = await apiClient.get<{ success: boolean; data: NotificationSettings }>(
    '/users/me/notification-settings',
  );
  return data.data;
}

export async function apiUpdateNotificationSettings(patch: Partial<NotificationSettings>) {
  const { data } = await apiClient.patch<{ success: boolean; data: NotificationSettings }>(
    '/users/me/notification-settings',
    patch,
  );
  return data.data;
}

export async function apiUpsertExpoPushToken(token: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { saved: boolean } }>(
    '/users/me/push-token',
    { token },
  );
  return data.data;
}

/** Native FCM device token (optional; dev build with @react-native-firebase/messaging). */
export async function apiSaveFcmToken(token: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { saved: boolean } }>(
    '/users/me/fcm-token',
    { token },
  );
  return data.data;
}

/** Multi-device FCM registration tokens (same as `POST /users/save-device-token`). */
export async function apiSaveDeviceToken(token: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { saved: boolean } }>(
    '/users/save-device-token',
    { token },
  );
  return data.data;
}

export type AiPreferences = {
  toxicity: number; // 0..1
  humor: number; // 0..1
  intensity: number; // 0..1
  depth: number; // 0..1
  repetition: number; // 0..1
  mode: 'gentle' | 'balanced' | 'unfiltered';
};

export async function apiSaveAiPreferences(aiPreferences: Partial<AiPreferences>) {
  const { data } = await apiClient.post<{ success: boolean; data: { aiPreferences: AiPreferences } }>(
    '/users/ai-preferences',
    { aiPreferences },
  );
  return data.data.aiPreferences;
}
