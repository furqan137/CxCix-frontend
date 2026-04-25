import { apiClient } from './client';

import type { PublicUser } from './users';

export type ConversationParticipant = PublicUser & { _id: string };

export type ApiConversation = {
  _id: string;
  participants: ConversationParticipant[];
  lastMessageAt?: string;
  lastMessageText?: string;
  lastSenderId?: string;
  updatedAt?: string;
  createdAt?: string;
};

export async function apiListConversations() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { conversations: ApiConversation[] };
  }>('/conversations');
  return data.data.conversations;
}

export async function apiStartConversation(participantId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { conversation: ApiConversation };
  }>('/conversations', { participantId });
  return data.data.conversation;
}

export type ApiMessage = {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    fullName?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  body: string;
  createdAt: string;
};

export async function apiListMessages(conversationId: string, params?: { limit?: number }) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { messages: ApiMessage[] };
  }>(`/conversations/${conversationId}/messages`, { params });
  return data.data.messages;
}

export async function apiSendMessage(conversationId: string, body: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { message: ApiMessage };
  }>(`/conversations/${conversationId}/messages`, { body });
  return data.data.message;
}
