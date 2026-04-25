import { io, type Socket } from 'socket.io-client';

import { getStoredToken } from './session';
import { SOCKET_ORIGIN } from '../config/api';

let socket: Socket | null = null;

/**
 * Lazy Socket.IO instance (not necessarily connected). Prefer `ensureSocketConnected()`.
 */
export function getSocket(): Socket {
  if (socket) return socket;
  const url = SOCKET_ORIGIN;
  socket = io(url, {
    autoConnect: false,
    // Real devices (cell networks / some Wi‑Fi) may block pure websockets.
    // Allow polling fallback to avoid "chat not sending" in production.
    transports: ['websocket', 'polling'],
  });
  return socket;
}

/**
 * Connects with JWT in `auth.accessToken` (same shape as the server expects in `config/socket.js`).
 */
export async function ensureSocketConnected(): Promise<Socket> {
  const s = getSocket();
  const token = await getStoredToken();
  if (!token) {
    throw new Error('Not signed in');
  }
  s.auth = { accessToken: token } as { accessToken: string };
  if (!s.connected) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        s.off('connect', onConnect);
        s.off('connect_error', onErr);
        reject(new Error('Socket connect timeout'));
      }, 20_000);
      function onConnect() {
        clearTimeout(t);
        s.off('connect_error', onErr);
        resolve();
      }
      function onErr(e: Error) {
        clearTimeout(t);
        s.off('connect', onConnect);
        reject(e);
      }
      s.once('connect', onConnect);
      s.once('connect_error', onErr);
      s.connect();
    });
  }
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
