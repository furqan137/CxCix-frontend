import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Lazy Socket.IO singleton — call when user session exists.
 * URL from EXPO_PUBLIC_SOCKET_URL or same origin as API.
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;
  const url =
    process.env.EXPO_PUBLIC_SOCKET_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'https://api.cxcix.app';
  socket = io(url, {
    autoConnect: false,
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
