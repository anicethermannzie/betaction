'use client';

import { io, type Socket } from 'socket.io-client';
import { authTokens } from '@/lib/authTokens';
import { logger } from '@/lib/logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3003';

let socket: Socket | null = null;
let authenticatedAs: string | null = null;

/**
 * Returns the module-level Socket.io singleton.
 * Creates it on first call; subsequent calls return the same instance.
 *
 * The token comes from authTokens (in-memory). It previously came from
 * `localStorage['betaction-auth']`, a key authStore.initialize() deliberately
 * deletes — so getStoredToken() always returned undefined and every socket
 * connected anonymously. Prediction rooms now require authentication
 * (notification-service/src/services/socketService.js), so that silent failure
 * would have locked signed-in users out of live prediction updates.
 */
export function getSocket(): Socket {
  const token = authTokens.getAccess();

  // Reconnect when the identity changed — a socket opened before sign-in stays
  // anonymous for its whole lifetime otherwise.
  if (socket && authenticatedAs !== (token ?? null)) {
    disconnectSocket();
  }

  if (socket) return socket;

  authenticatedAs = token ?? null;

  socket = io(SOCKET_URL, {
    auth:                  token ? { token } : {},
    transports:            ['websocket', 'polling'],
    reconnection:          true,
    reconnectionAttempts:  5,
    reconnectionDelay:     1_000,
    reconnectionDelayMax:  5_000,
  });

  socket.on('connect', () => logger.debug('Socket connected', { id: socket?.id }));
  socket.on('disconnect', (reason) => logger.debug('Socket disconnected', { reason }));
  socket.on('connect_error', (err) => logger.warn('Socket connection error', { error: err.message }));
  socket.on('subscription:denied', (payload: { reason?: string }) => {
    logger.warn('Socket subscription denied', { reason: payload?.reason });
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  authenticatedAs = null;
}
