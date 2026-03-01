'use client';

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3003';

let socket: Socket | null = null;

function getStoredToken(): string | undefined {
  try {
    const stored = localStorage.getItem('betaction-auth');
    return stored ? JSON.parse(stored)?.state?.accessToken : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns the module-level Socket.io singleton.
 * Creates it on first call; subsequent calls return the same instance.
 * Safe to call multiple times — never creates duplicate connections.
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getStoredToken();

  socket = io(SOCKET_URL, {
    auth:                  token ? { token } : {},
    transports:            ['websocket', 'polling'],
    reconnection:          true,
    reconnectionAttempts:  5,
    reconnectionDelay:     1_000,
    reconnectionDelayMax:  5_000,
  });

  socket.on('connect', () =>
    console.log('[socket] Connected:', socket?.id)
  );
  socket.on('disconnect', (reason) =>
    console.log('[socket] Disconnected:', reason)
  );
  socket.on('connect_error', (err) =>
    console.warn('[socket] Connection error:', err.message)
  );

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
