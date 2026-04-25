import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  type Auth,
} from 'firebase/auth';

import { auth as appAuth } from '../config/firebase';
import { extractFirebaseActionUrlForEmailLink } from '../utils/resolveEmailLinkFromIncomingUrl';

type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  databaseURL?: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
};

function getFirebaseConfig(): FirebaseConfig {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '';
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const databaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!apiKey || !projectId || !appId) {
    throw new Error(
      'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_APP_ID in `CxCix-frontend/.env` and restart Expo.',
    );
  }
  return {
    apiKey,
    projectId,
    appId,
    authDomain,
    databaseURL: databaseURL?.trim() || undefined,
    messagingSenderId,
    storageBucket,
  };
}

/**
 * Same instance as `config/firebase` and chat RTDB. Required so JWT-only sessions can sync via
 * `signInWithCustomToken` and Realtime Database `auth` rules work.
 */
export function firebaseAuth(): Auth {
  return appAuth;
}

export function isFirebaseConfigured(): boolean {
  try {
    getFirebaseConfig();
    return true;
  } catch {
    return false;
  }
}

/** SecureStore key used with email link sign-in */
export const PENDING_LINK_EMAIL_KEY = 'cxcix_pending_link_email';

/** Known-good defaults if env is missing (avoids `auth/unauthorized-continue-uri` from bad URLs). */
const DEFAULT_CXCIX_EMAIL_LINK_URL = 'https://cxcix-a7a93.firebaseapp.com';

/**
 * Normalizes `https://host` (no path, no trailing slash) — must match an authorized domain exactly.
 */
function normalizeAuthContinueUrl(input: string): string {
  let u = input.trim();
  u = u.replace(/\/+$/, '');
  if (!u.startsWith('https://') && !u.startsWith('http://')) {
    u = `https://${u.replace(/^\/+/, '')}`;
  }
  // Firebase expects continue URL as origin; strip path for consistency
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return u;
  }
}

/**
 * Continue URL for `sendSignInLinkToEmail` (ActionCodeSettings.url).
 * Must **exactly** match Firebase Console → Auth → Settings → Authorized domains.
 *
 * 1) `EXPO_PUBLIC_FIREBASE_EMAIL_LINK_URL` (recommended): e.g. `https://<projectId>.web.app` or `https://<projectId>.firebaseapp.com`
  * 2) `EXPO_PUBLIC_FIREBASE_USE_HOSTING_LANDING=true` + project id → `https://<id>.web.app`
  * 3) `https://<projectId>.firebaseapp.com`
  * 4) `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` as `https://…`
  * 5) Default `https://cxcix-b9593.web.app` (override with env for other projects)
 */
export function buildEmailLinkContinueUrl(): string {
  const custom = process.env.EXPO_PUBLIC_FIREBASE_EMAIL_LINK_URL?.trim();
  if (custom) {
    return normalizeAuthContinueUrl(custom);
  }
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (projectId) {
    const useWebAppLanding = process.env.EXPO_PUBLIC_FIREBASE_USE_HOSTING_LANDING === 'true';
    if (useWebAppLanding) {
      return normalizeAuthContinueUrl(`https://${projectId}.web.app`);
    }
    return normalizeAuthContinueUrl(`https://${projectId}.firebaseapp.com`);
  }
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  if (authDomain) {
    const host = authDomain.replace(/^https?:\/\//, '').split('/')[0];
    if (host) {
      return normalizeAuthContinueUrl(`https://${host}`);
    }
  }
  // Avoid exp:// fallback here — it is not an authorized domain and causes unauthorized-continue-uri.
  return DEFAULT_CXCIX_EMAIL_LINK_URL;
}

/**
 * Sends Firebase email sign-in link (verify email; no password required for first sign-in).
 */
export async function firebaseSendEmailSignInLink(email: string) {
  const auth = firebaseAuth();
  const url = buildEmailLinkContinueUrl();
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('EMAIL LINK URL:', url);
  }
  const actionCodeSettings = {
    url,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
}

export function firebaseLooksLikeEmailLink(linkOrCode: string) {
  const auth = firebaseAuth();
  return isSignInWithEmailLink(auth, linkOrCode.trim());
}

/**
 * Finishes email-link sign-in from a `Linking` URL (https action link or `cxcix://auth?link=`).
 * Safe to call multiple times; no-ops if already signed in with the same email.
 */
export async function trySignInWithEmailLinkFromIncomingUrl(
  email: string,
  incoming: string,
): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  const actionUrl = extractFirebaseActionUrlForEmailLink(incoming);
  if (!actionUrl) return false;
  const auth = firebaseAuth();
  if (auth.currentUser?.email?.toLowerCase() === e) return true;
  if (!isSignInWithEmailLink(auth, actionUrl)) return false;
  try {
    await signInWithEmailLink(auth, e, actionUrl);
    return true;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/invalid-action-code' && auth.currentUser?.email?.toLowerCase() === e) {
      return true;
    }
    throw err;
  }
}

export async function firebaseSignInWithEmailLink(email: string, link: string) {
  const auth = firebaseAuth();
  const cred = await signInWithEmailLink(auth, email.trim().toLowerCase(), link.trim());
  return cred.user.getIdToken();
}

export async function firebaseSignInWithEmailPassword(email: string, password: string) {
  const auth = firebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user.getIdToken();
}

export async function firebaseSendEmailVerificationForCurrentUser() {
  const auth = firebaseAuth();
  if (!auth.currentUser) throw new Error('Not signed in');
  await sendEmailVerification(auth.currentUser);
}

export async function firebaseSendPasswordReset(email: string) {
  const auth = firebaseAuth();
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function firebaseSignInWithGoogleIdToken(googleIdToken: string) {
  const auth = firebaseAuth();
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const cred = await signInWithCredential(auth, credential);
  return cred.user.getIdToken();
}

/** Custom token from our API (cross-device email-link completion). */
export async function firebaseSignInWithCustomToken(customToken: string) {
  const auth = firebaseAuth();
  const cred = await signInWithCustomToken(auth, customToken);
  return cred.user.getIdToken();
}

/** @deprecated use `firebaseSendEmailSignInLink` */
export const firebaseSendEmailOtpLink = firebaseSendEmailSignInLink;

export async function firebaseVerifyEmailLink(email: string, link: string) {
  const token = await firebaseSignInWithEmailLink(email, link);
  return { token };
}
