import { create } from 'zustand';

import {
  apiCompleteOnboarding,
  apiFirebaseSession,
  apiGetMe,
  apiLogin,
  type ApiUser,
} from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/session';
import { ensureFirebaseAuthForAppJwt, signOutFirebase } from '../services/firebaseAuthService';

interface AuthState {
  user: ApiUser | null;
  isLoggedIn: boolean;
  hydrated: boolean;
  setSession: (user: ApiUser, token: string, options?: { firebaseCustomToken?: string | null }) => Promise<void>;
  setUser: (user: ApiUser) => void;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  signInWithFirebaseIdToken: (idToken: string, emailHint?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  hydrated: false,

  setSession: async (user, token, options) => {
    await setStoredToken(token);
    set({ user, isLoggedIn: true });
    await ensureFirebaseAuthForAppJwt(options?.firebaseCustomToken ?? null);
  },

  setUser: (user) => set({ user }),

  clearSession: async () => {
    await signOutFirebase();
    await setStoredToken(null);
    set({ user: null, isLoggedIn: false });
  },

  hydrate: async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ hydrated: true, isLoggedIn: false, user: null });
        return;
      }
      const user = await apiGetMe();
      set({ user, isLoggedIn: true, hydrated: true });
      await ensureFirebaseAuthForAppJwt();
    } catch {
      await setStoredToken(null);
      set({ user: null, isLoggedIn: false, hydrated: true });
    }
  },

  login: async (identifier, password) => {
    const res = await apiLogin(identifier, password);
    const d = res.data;
    await get().setSession(d.user, d.accessToken ?? d.token, {
      firebaseCustomToken: d.firebaseCustomToken,
    });
  },

  signInWithFirebaseIdToken: async (idToken, emailHint) => {
    const res = await apiFirebaseSession(idToken, emailHint);
    await get().setSession(res.data.user, res.data.accessToken ?? res.data.token);
  },

  refreshUser: async () => {
    const user = await apiGetMe();
    set({ user });
  },

  markOnboardingComplete: async () => {
    const user = await apiCompleteOnboarding();
    set({ user });
  },
}));
