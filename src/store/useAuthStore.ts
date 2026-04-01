import { create } from 'zustand';

/**
 * Auth slice — will be extended with tokens / profile when API is wired.
 */
interface AuthState {
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
}));
