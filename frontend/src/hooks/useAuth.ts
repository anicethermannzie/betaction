'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const router   = useRouter();
  const store    = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login(email, password);
      store.setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/');
    },
    [store, router]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await authApi.register(username, email, password);
      store.setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/');
    },
    [store, router]
  );

  const logout = useCallback(() => {
    disconnectSocket();
    store.logout();
    router.push('/login');
  }, [store, router]);

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    login,
    register,
    logout,
  };
}
