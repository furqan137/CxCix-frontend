import { apiClient } from './client';

export type ApiNotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'shift'
  | 'message'
  | 'reply'
  | 'system';

export type ApiNotificationRow = {
  id: string;
  type: ApiNotificationType;
  text: string;
  isRead: boolean;
  createdAt: string;
  timeLabel: string;
  postId: string | null;
  commentId: string | null;
  fromUser: {
    _id: string;
    username: string;
    fullName?: string;
    displayName: string;
    avatarUrl: string;
  } | null;
};

export async function apiListNotifications(params?: { page?: number; limit?: number }) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { notifications: ApiNotificationRow[]; page: number; limit: number; total: number };
  }>('/notifications', { params: { page: params?.page ?? 1, limit: params?.limit ?? 30 } });
  return data.data;
}

export async function apiMarkAllNotificationsRead() {
  const { data } = await apiClient.patch<{ success: boolean; data: { ok: boolean } }>(
    '/notifications/read',
  );
  return data.data.ok;
}

export async function apiGetUnreadCount() {
  const { data } = await apiClient.get<{ success: boolean; data: { count: number } }>(
    '/notifications/unread-count',
  );
  return data.data.count;
}

export async function apiMarkNotificationRead(id: string) {
  const { data } = await apiClient.patch<{
    success: boolean;
    data: { notification: ApiNotificationRow };
  }>(`/notifications/${encodeURIComponent(id)}/read`);
  return data.data.notification;
}

export async function apiDeleteNotification(id: string) {
  const { data } = await apiClient.delete<{ success: boolean; data: { deleted: boolean } }>(
    `/notifications/${encodeURIComponent(id)}`,
  );
  return data.data.deleted;
}

