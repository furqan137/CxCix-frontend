import { AxiosError } from 'axios';

import { apiClient } from './client';

/** SecureStore: server session for cross-device email-link polling. */
export const PENDING_LINK_SESSION_KEY = 'cxcix_email_link_session';

export type ApiUser = {
  _id: string;
  email?: string;
  phone?: string;
  username: string;
  /** Canonical real name from API (preferred for UI). */
  fullName?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  onboardingComplete?: boolean;
  needsProfile?: boolean;
  firebaseUid?: string;
  /** Feed preferences (from `GET /users/me`). */
  mutedUsers?: string[];
  blockedUsers?: string[];
  hiddenPosts?: string[];
  /** RTDB DM ids; max ~20, same strings as `buildChatId` */
  pinnedChatIds?: string[];
  /** From `GET /users/me` — relationship stats. */
  followersCount?: number;
  followingCount?: number;
};

type AuthPayload = {
  user: ApiUser;
  token: string;
  accessToken: string;
  /** When server has Firebase Admin — use with `signInWithCustomToken` (same as GET /auth/firebase-custom-token). */
  firebaseCustomToken?: string;
  firebaseUid?: string;
};

export type FirebaseCustomTokenData = {
  customToken: string;
  firebaseUid: string;
  user?: ApiUser;
};

export function getApiMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export async function apiLogin(identifier: string, password: string) {
  const { data } = await apiClient.post<{ success: boolean; data: AuthPayload }>(
    '/auth/login',
    { identifier, password },
  );
  return data;
}

export async function apiFirebaseSession(idToken: string, email?: string) {
  const { data } = await apiClient.post<{ success: boolean; data: AuthPayload }>(
    '/auth/firebase-session',
    { idToken, email: email?.trim().toLowerCase() || undefined },
  );
  return data;
}

export async function apiRegister(form: FormData) {
  const { data } = await apiClient.post<{ success: boolean; data: AuthPayload }>(
    '/auth/register',
    form,
  );
  return data;
}

export async function checkUsernameAvailable(username: string) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { available: boolean; conflicts?: string[] };
  }>('/auth/availability', { params: { username } });
  return data.data;
}

export async function checkAccountExists(identifier: string) {
  const { data } = await apiClient.get<{ success: boolean; data: { exists: boolean } }>(
    '/auth/account-exists',
    { params: { identifier } },
  );
  return data.data;
}

export async function apiCompleteOnboarding() {
  const { data } = await apiClient.patch<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me',
    { onboardingComplete: true },
  );
  return data.data.user;
}

export async function apiGetMe() {
  const { data } = await apiClient.get<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me',
  );
  return data.data.user;
}

/** For JWT sessions (e.g. after password login) so RTDB `auth` is non-null. Requires Auth header. */
export async function apiGetFirebaseCustomToken() {
  const { data } = await apiClient.get<{ success: boolean; data: FirebaseCustomTokenData }>(
    '/auth/firebase-custom-token',
  );
  return data.data;
}

/** Multipart: optional `avatar` file + string fields fullName, displayName, username, bio */
export async function apiUpdateProfile(form: FormData) {
  const { data } = await apiClient.patch<{ success: boolean; data: { user: ApiUser } }>(
    '/users/me',
    form,
  );
  return data.data.user;
}

export type ForgotPasswordData = {
  expiresAt: string | null;
  expiresInMinutes: number;
  emailSent: boolean;
  smtpConfigured: boolean;
  /** When false, no reset email was sent (unknown email or not found). */
  accountFound?: boolean;
  /** Only if backend EXPOSE_RESET_TOKEN_IN_RESPONSE=true (dev) */
  resetUrl?: string;
  token?: string;
};

export async function apiForgotPassword(email: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    data: ForgotPasswordData;
  }>('/auth/forgot-password', { email: email.trim().toLowerCase() });
  return data;
}

export async function apiResetPassword(token: string, password: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string }>(
    `/auth/reset-password/${encodeURIComponent(token)}`,
    { password },
  );
  return data;
}

/** Firebase-verified reset: backend validates firebaseIdToken then updates Mongo password. */
export async function apiResetPasswordFirebase(body: {
  email: string;
  password: string;
  firebaseIdToken: string;
}) {
  const { data } = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/reset-password',
    {
      email: body.email.trim().toLowerCase(),
      password: body.password,
      firebaseIdToken: body.firebaseIdToken,
    },
  );
  return data;
}

export async function apiChangePassword(body: { currentPassword: string; newPassword: string }) {
  const { data } = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/change-password',
    body,
  );
  return data;
}

export async function apiChangeEmail(body: { email: string; firebaseIdToken: string }) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/auth/change-email',
    {
      email: body.email.trim().toLowerCase(),
      firebaseIdToken: body.firebaseIdToken,
    },
  );
  return data.data.user;
}

export async function apiChangePhone(body: { phone: string }) {
  const { data } = await apiClient.post<{ success: boolean; data: { user: ApiUser } }>(
    '/auth/change-phone',
    { phone: body.phone },
  );
  return data.data.user;
}

export async function apiStartPendingEmailLink(email: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { sessionKey: string };
  }>('/auth/pending-email-link', { email: email.trim().toLowerCase() });
  return data.data;
}

export type EmailLinkPollData = {
  ready: boolean;
  customToken?: string;
  firebaseUid?: string;
  reason?: string;
};

export async function apiPollEmailLink(email: string, sessionKey: string) {
  const { data } = await apiClient.get<{ success: boolean; data: EmailLinkPollData }>(
    '/auth/email-link-poll',
    { params: { email: email.trim().toLowerCase(), sessionKey } },
  );
  return data.data;
}
