import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || undefined,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Auth (React Native) — persisted with AsyncStorage (stable sessions).
 * initializeAuth + getReactNativePersistence avoids the “memory persistence only” warning.
 */
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

/**
 * Realtime Database — chat (messages, inbox). Requires `databaseURL` in config + Console.
 */
export const rtdb = (() => {
  if (!firebaseConfig.databaseURL) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[firebase] EXPO_PUBLIC_FIREBASE_DATABASE_URL is not set. Enable Realtime Database in Firebase and set the URL (e.g. https://<projectId>-default-rtdb.firebaseio.com).',
      );
    }
  }
  return getDatabase(app);
})();

/** Firestore — optional; other features may still use it. */
export const db = getFirestore(app);

/** Firebase Storage — chat media uploads. Bind the bucket from env (avoids default-bucket / project mismatch on RN). */
export const storage = (() => {
  const raw = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const b = (raw && String(raw).trim()) || '';
  if (b) {
    const gs = b.startsWith('gs://') ? b : `gs://${b.replace(/^\/+/, '')}`;
    return getStorage(app, gs);
  }
  return getStorage(app);
})();

export { app };
