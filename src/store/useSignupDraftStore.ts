import { create } from 'zustand';

export type SignupAuthMode = 'password' | 'firebase' | 'google' | null;

type Draft = {
  email: string;
  phone: string;
  password: string;
  displayName: string;
  username: string;
  authMode: SignupAuthMode;
  setContact: (p: { email: string; phone: string }) => void;
  setPassword: (password: string) => void;
  setIdentity: (p: { displayName: string; username: string }) => void;
  setAuthMode: (mode: SignupAuthMode) => void;
  reset: () => void;
};

const initial = {
  email: '',
  phone: '',
  password: '',
  displayName: '',
  username: '',
  authMode: null as SignupAuthMode,
};

export const useSignupDraftStore = create<Draft>((set) => ({
  ...initial,
  setContact: (p) =>
    set({
      email: p.email,
      phone: p.phone,
      password: '',
    }),
  setPassword: (password) => set({ password }),
  setIdentity: (p) =>
    set({
      displayName: p.displayName,
      username: p.username,
    }),
  setAuthMode: (authMode) => set({ authMode }),
  reset: () => set(initial),
}));
