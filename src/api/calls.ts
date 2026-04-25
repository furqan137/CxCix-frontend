import { apiClient } from './client';

export type StartDailyCallResponse = {
  success: boolean;
  data: { roomUrl: string };
};

/**
 * Returns the room URL for a Daily meeting (from server; API key never sent to the client).
 */
export async function apiStartDailyCall(): Promise<string> {
  const { data } = await apiClient.post<StartDailyCallResponse>('/calls/start');
  return data.data?.roomUrl || '';
}

export type NotifyDailyIncomingParams = {
  toUserId: string;
  roomUrl: string;
  callMode: 'video' | 'audio';
  callerName: string;
  chatId?: string;
};

/**
 * Tells the backend to FCM/Expo-notify the callee with `incoming_call` payload data.
 */
export async function apiNotifyDailyIncomingCall(params: NotifyDailyIncomingParams): Promise<void> {
  await apiClient.post('/users/me/notify-incoming-call', {
    callProvider: 'daily',
    toUserId: params.toUserId,
    roomUrl: params.roomUrl,
    callMode: params.callMode,
    callerName: params.callerName,
    ...(params.chatId ? { chatId: params.chatId } : {}),
  });
}

/**
 * Notifies the original **caller** that the callee declined (best-effort).
 */
export async function apiNotifyCallDeclined(callerUserId: string, callMode: 'video' | 'audio'): Promise<void> {
  try {
    await apiClient.post('/users/me/call-decline', {
      peerUserId: callerUserId,
      callMode,
      callProvider: 'daily',
    });
  } catch {
    /* best-effort */
  }
}
