import { create } from 'zustand';
import { authApi } from '@/lib/api';
import { authTokens } from '@/lib/authTokens';
import type { User } from '@/types';
function message(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
  return data?.error ?? data?.message ?? fallback;
}
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
  setAuth: (user: User, access: string) => void;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}
let initialization: Promise<void> | null = null;
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isAuthenticated: false, isLoading: false, initialized: false, error: null,
  setAuth: (user, access) => { authTokens.setAccess(access); set({ user, isAuthenticated: true, initialized: true, error: null }); },
  setAccessToken: authTokens.setAccess,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try { if (initialization) await initialization; const { data } = await authApi.login(email, password); get().setAuth(data.user, data.accessToken); }
    catch (err) { const error = message(err, 'Login failed. Please try again.'); set({ error }); throw new Error(error); }
    finally { set({ isLoading: false }); }
  },
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try { await authApi.register(username, email, password); }
    catch (err) { const error = message(err, 'Registration failed. Please try again.'); set({ error }); throw new Error(error); }
    finally { set({ isLoading: false }); }
  },
  logout: async () => {
    try { await authApi.logout(); }
    catch (err) { set({ error: 'Logout failed. Please retry.' }); throw err; }
    authTokens.clear(); set({ user: null, isAuthenticated: false, error: null });
  },
  refreshAccessToken: async () => { const { data } = await authApi.refreshToken(); get().setAuth(data.user, data.accessToken); },
  initialize: () => {
    if (!initialization) initialization = (async () => {
      try { localStorage.removeItem('betaction-auth'); } catch { /* Storage may be disabled. */ }
      try { await get().refreshAccessToken(); }
      catch { authTokens.clear(); set({ user: null, isAuthenticated: false }); }
      finally { set({ initialized: true }); }
    })();
    return initialization;
  },
  clearError: () => set({ error: null }),
}));
