import { apiClient } from './client';

import type { PublicUser } from './users';

export type ChatRequestItem = {
  _id: string;
  fromUser: PublicUser & { _id: string };
  toUser: PublicUser & { _id: string };
  status: string;
  createdAt?: string;
};

export type RelationshipStatus =
  | 'self'
  | 'none'
  | 'connected'
  | 'pending_out'
  | 'pending_in';

export async function apiChatStatusWithUser(userId: string) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: {
      status: RelationshipStatus;
      conversationId?: string;
      requestId?: string;
    };
  }>(`/chat-requests/with/${userId}`);
  return data.data;
}

export async function apiCreateChatRequest(toUserId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: {
      status: string;
      conversationId?: string;
      message?: string;
      request?: ChatRequestItem;
    };
  }>('/chat-requests', { toUserId });
  return data.data;
}

export async function apiListIncomingChatRequests() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { requests: ChatRequestItem[] };
  }>('/chat-requests/incoming');
  return data.data.requests;
}

export async function apiAcceptChatRequest(requestId: string) {
  const { data } = await apiClient.patch<{
    success: boolean;
    data: { request: ChatRequestItem };
  }>(`/chat-requests/${requestId}/accept`);
  return data.data;
}

export async function apiDeclineChatRequest(requestId: string) {
  const { data } = await apiClient.patch<{
    success: boolean;
    data: { request: ChatRequestItem };
  }>(`/chat-requests/${requestId}/decline`);
  return data.data;
}

export async function apiCancelChatRequest(requestId: string) {
  const { data } = await apiClient.delete<{
    success: boolean;
    data: { cancelled: boolean };
  }>(`/chat-requests/${requestId}/cancel`);
  return data.data;
}
