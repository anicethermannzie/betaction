import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { authTokens } from '@/lib/authTokens';
import type { User } from '@/types';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeMockToken() {
  return `mock.${btoa(String(Date.now()))}.${Math.random().toString(36).slice(2)}`;
}

function mockUser(username: string, email: string): User {
  return { id: 1, username, email, role: 'user', createdAt: new Date().toISOString() };
}

function apiErrMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message ?? fallback;
}

function hasNoResponse(err: unknown): boolean {
  return !(err as { response?: unknown })?.response;
}

// ── State shape ───────────────────────────────────────────────────────────────

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;

  // ── Low-level setters (called internally and by api.ts interceptors) ──
  setAuth:        (user: User, access: string, refresh: string) => void;
  setAccessToken: (token: string) => void;

  // ── Actions ──
  login:              (email: string, password: string) => Promise<void>;
  register:           (username: string, email: string, password: string) => Promise<void>;
  logout:             () => void;
  refreshAccessToken: () => Promise<void>;
  clearError:         () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

      // ── Setters ────────────────────────────────────────────────────────────

      setAuth: (user, access, refresh) => {
        authTokens.set(access, refresh);
        set({ user, isAuthenticated: true, error: null });
      },

      setAccessToken: (token) => {
        authTokens.setAccess(token);
      },

      // ── Login ──────────────────────────────────────────────────────────────

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login(email, password);
          get().setAuth(data.user, data.accessToken, data.refreshToken);
        } catch (err) {
          if (hasNoResponse(err)) {
            // Network error — use mock auth for dev
            if (email.toLowerCase().includes('test') || password === 'password') {
              const name = email.split('@')[0];
              get().setAuth(mockUser(name, email), makeMockToken(), makeMockToken());
            } else {
              const msg = 'Invalid credentials. (Dev tip: use an email with "test" to mock login)';
              set({ error: msg });
              throw new Error(msg);
            }
          } else {
            const msg = apiErrMessage(err, 'Invalid email or password.');
            set({ error: msg });
            throw new Error(msg);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Register ───────────────────────────────────────────────────────────

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(username, email, password);
          // Redirect to login is handled by the calling page / hook
        } catch (err) {
          if (hasNoResponse(err)) {
            // Network error — mock always succeeds for register
          } else {
            const msg = apiErrMessage(err, 'Registration failed. Please try again.');
            set({ error: msg });
            throw new Error(msg);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Logout ─────────────────────────────────────────────────────────────

      logout: () => {
        authTokens.clear();
        set({ user: null, isAuthenticated: false, error: null });
      },

      // ── Refresh token ──────────────────────────────────────────────────────

      refreshAccessToken: async () => {
        const refresh = authTokens.getRefresh();
        if (!refresh) throw new Error('No refresh token available');
        const { data } = await authApi.refreshToken(refresh);
        authTokens.setAccess(data.accessToken);
      },

      // ── Clear error ────────────────────────────────────────────────────────

      clearError: () => set({ error: null }),
    }),

    {
      name: 'betaction-auth',
      // Persist user identity only — tokens stay in memory for security
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
