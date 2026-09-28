'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { disconnectSocket } from '@/lib/socket';
import { resetUserState } from '@/stores/resetStores';

export function useAuth() {
  const router = useRouter();
  const store  = useAuthStore();
  useEffect(() => { void useAuthStore.getState().initialize(); }, []);

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

  const logout = useCallback(async () => {
    try { await store.logout(); } catch { return; }
    // Order matters: drop the socket (which carries the old token) before
    // clearing the stores that components are still subscribed to.
    disconnectSocket();
    resetUserState();
    router.push('/login');
  }, [store, router]);

  // ── Guard: redirect unauthenticated users to /login ───────────────────────

  const requireAuth = useCallback(() => {
    if (store.initialized && !store.isAuthenticated) router.push('/login');
  }, [store.initialized, store.isAuthenticated, router]);

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       store.isLoading,
    initialized:     store.initialized,
    error:           store.error,
    login,
    register,
    logout,
    requireAuth,
    clearError:      store.clearError,
  };
}
