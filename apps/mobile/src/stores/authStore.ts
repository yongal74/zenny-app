import { create } from 'zustand';

interface AuthStore {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,

  setAuth: (token, userId) => set({ token, userId, isAuthenticated: true }),
  logout: () => set({ token: null, userId: null, isAuthenticated: false }),
}));
