'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const router = useRouter();
  const store  = useAuthStore();

  // ── Login → redirect to homepage ─────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      await store.login(email, password);
      router.push('/');
    },
    [store, router]
  );

  // ── Register → redirect to /login?registered=1 ───────────────────────────

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await store.register(username, email, password);
      router.push('/login?registered=1');
    },
    [store, router]
  );

  // ── Logout → disconnect socket, clear store, send to /login ──────────────

  const logout = useCallback(() => {
    disconnectSocket();
    store.logout();
    router.push('/login');
  }, [store, router]);

  // ── Guard: redirect unauthenticated users to /login ───────────────────────

  const requireAuth = useCallback(() => {
    if (!store.isAuthenticated) router.push('/login');
  }, [store.isAuthenticated, router]);

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       store.isLoading,
    error:           store.error,
    login,
    register,
    logout,
    requireAuth,
    clearError:      store.clearError,
  };
}
