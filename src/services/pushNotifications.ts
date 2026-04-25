import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiSaveDeviceToken, apiUpsertExpoPushToken } from '../api/users';
import { navigationRef } from '../navigation/navigationRef';

/** Must match `expo-notifications` plugin `defaultChannel` in app.config.js and server `channelId`. */
export const ANDROID_PUSH_CHANNEL_DEFAULT = 'default';
const ANDROID_PUSH_CHANNEL_CALLS = 'calls';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PushData = {
  type?: string;
  postId?: string;
  commentId?: string;
  parentCommentId?: string;
  fromUserId?: string;
  chatId?: string;
  notificationId?: string;
  callMode?: string;
  callProvider?: string;
  roomUrl?: string;
  roomName?: string;
  callerName?: string;
};

/** Handles cold start + in-app response when user opens a push payload. */
export function navigateFromPushData(data: Record<string, unknown>) {
  const d = data as PushData;
  const type = String(d.type || '');
  const postId = d.postId ? String(d.postId) : '';
  const fromUserId = d.fromUserId ? String(d.fromUserId) : '';
  if (!navigationRef.isReady()) return;

  if (type === 'incoming_call' && d.roomUrl) {
    navigationRef.navigate('Main', {
      screen: 'IncomingCall',
      params: {
        roomUrl: String(d.roomUrl),
        callerName: d.callerName ? String(d.callerName) : 'Someone',
        callMode: d.callMode === 'audio' ? 'audio' : 'video',
        callerUserId: d.fromUserId ? String(d.fromUserId) : undefined,
      },
    });
    return;
  }
  if ((type === 'like' || type === 'comment' || type === 'mention' || type === 'shift' || type === 'reply') && postId) {
    navigationRef.navigate('Main', {
      screen: 'ReadComment',
      params: { postId, variant: 'standard' },
    });
    return;
  }
  if (type === 'follow' && fromUserId) {
    navigationRef.navigate('Main', {
      screen: 'UserProfile',
      params: { userId: fromUserId },
    });
    return;
  }
  if (type === 'message' && fromUserId) {
    navigationRef.navigate('Main', {
      screen: 'ChatThread',
      params: {
        peerId: fromUserId,
        name: 'Chat',
        handle: '',
      },
    });
    return;
  }
  if (type === 'system') {
    navigationRef.navigate('Main', {
      screen: 'MainTabs',
      params: { screen: 'Notifications' },
    });
  }
}

async function ensureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_PUSH_CHANNEL_DEFAULT, {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(ANDROID_PUSH_CHANNEL_CALLS, {
    name: 'Calls',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    lightColor: '#6366F1',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default',
  });
}

const PUSH_PERMISSION_PROMPTED_KEY = 'cxcix_push_permission_prompted_v1';

/**
 * Ask for notification permissions as early as possible (Android 13+ requires POST_NOTIFICATIONS runtime permission).
 * We only prompt once; afterwards users can manage it in OS settings.
 */
export async function promptForPushPermissionsOnFirstLaunch(): Promise<void> {
  await ensureAndroidNotificationChannels();

  try {
    const alreadyPrompted = await AsyncStorage.getItem(PUSH_PERMISSION_PROMPTED_KEY);
    if (alreadyPrompted === '1') return;

    const existing = await Notifications.getPermissionsAsync();
    // If the OS already decided (granted/denied), don't re-prompt.
    if (existing.status !== 'undetermined') {
      await AsyncStorage.setItem(PUSH_PERMISSION_PROMPTED_KEY, '1');
      return;
    }

    await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: true,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
        allowProvisional: false,
      },
    });

    await AsyncStorage.setItem(PUSH_PERMISSION_PROMPTED_KEY, '1');
  } catch {
    // Never block app startup on permission flow.
  }
}

/**
 * Registers for remote notifications, creates Android channels, syncs Expo + FCM tokens to the API.
 * Safe to call multiple times (e.g. when app returns to foreground).
 */
export async function registerForPushAndSyncToken(): Promise<void> {
  await ensureAndroidNotificationChannels();

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted) {
    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: true,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
        allowProvisional: false,
      },
    });
    granted = req.granted;
  }

  if (!granted) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[push] Notification permission not granted');
    }
    return;
  }

  const expoTok = (await Notifications.getExpoPushTokenAsync()).data;
  if (expoTok) {
    await apiUpsertExpoPushToken(expoTok);
  }

  try {
    const devTok = await Notifications.getDevicePushTokenAsync();
    if (devTok?.data) {
      await apiSaveDeviceToken(String(devTok.data));
    }
  } catch {
    /* Expo Go or simulator without push credentials */
  }
}

export function startNotificationResponseListener(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = (resp.notification.request.content.data || {}) as Record<string, unknown>;
    navigateFromPushData(data);
  });
  return () => sub.remove();
}

/** Foreground: route incoming-call pushes immediately (others use the default handler UI). */
export function startForegroundIncomingCallListener(): () => void {
  const sub = Notifications.addNotificationReceivedListener((n) => {
    const data = (n.request.content.data || {}) as Record<string, unknown>;
    const type = String(data.type || '');
    if (type === 'incoming_call' && data.roomUrl) {
      navigateFromPushData(data);
    }
  });
  return () => sub.remove();
}

/** Re-sync push tokens when returning from Settings / background (permission or token may change). */
export function usePushTokenRefreshOnForeground(isLoggedIn: boolean): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isLoggedIn) return;
    const sub = AppState.addEventListener('change', (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      if (wasBackground && next === 'active') {
        void registerForPushAndSyncToken();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [isLoggedIn]);
}

/** Listens in foreground; mostly useful in dev. */
export function useForegroundNotificationLogger(): void {
  useEffect(() => {
    const u = Notifications.addNotificationReceivedListener((n) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[push] Foreground', n.request.content);
      }
    });
    return () => u.remove();
  }, []);
}
