import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';

import { apiGetFirebaseCustomToken } from '../api/auth';
import { auth } from '../config/firebase';

let ensurePromise: Promise<void> | null = null;
let didInitListener = false;

/**
 * One-time: logs Firebase user state. Call from the app root.
 */
export function initFirebaseAuthListener() {
  if (didInitListener) return;
  didInitListener = true;
  onAuthStateChanged(auth, (user) => {
    if (!__DEV__) return;
    if (user) {
      // eslint-disable-next-line no-console
      console.log('Firebase User:', user.uid, user.email ?? '(no email)');
    } else {
      // eslint-disable-next-line no-console
      console.log('User NOT logged in (Firebase)');
    }
  });
}

/**
 * After the app has a valid API JWT, ensure Firebase auth is not null so Realtime DB rules pass.
 * @param fromLoginOrRegister - optional token returned with login/register to save one round trip
 */
export async function ensureFirebaseAuthForAppJwt(fromLoginOrRegister?: string | null) {
  if (auth.currentUser) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('Firebase User:', auth.currentUser.uid);
    }
    return;
  }
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    try {
      if (fromLoginOrRegister) {
        await signInWithCustomToken(auth, fromLoginOrRegister);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Firebase custom token (inline) sign-in ok:', auth.currentUser?.uid);
        }
        return;
      }
      const data = await apiGetFirebaseCustomToken();
      if (data?.customToken) {
        await signInWithCustomToken(auth, data.customToken);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Firebase custom token (API) sign-in ok:', auth.currentUser?.uid);
        }
      }
    } catch (e) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(
          '[CxCix] Could not sign in to Firebase (chat sync may get permission_denied). Check server Firebase Admin + RTDB rules.',
          e,
        );
      }
    } finally {
      ensurePromise = null;
    }
  })();
  return ensurePromise;
}

export async function signOutFirebase() {
  if (!auth.currentUser) return;
  try {
    await signOut(auth);
  } catch {
    /* */
  }
}
