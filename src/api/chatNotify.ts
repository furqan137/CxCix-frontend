import { apiClient } from './client';

/**
 * Tells the API to create an in-app notification + push to the other user (Mongo `userId`).
 * Best-effort: failures are ignored so chat still works.
 */
export async function apiNotifyChatMessage(
  toUserId: string,
  text: string,
  options?: { chatId?: string },
) {
  if (!toUserId || !text.trim()) return;
  try {
    await apiClient.post('/users/me/notify-chat', {
      toUserId,
      text: text.slice(0, 200),
      ...(options?.chatId ? { chatId: options.chatId } : {}),
    });
  } catch {
    /* best-effort */
  }
}

