const DEFAULT_ORIGIN = 'https://cxcix-backend.onrender.com';

function stripTrailingSlash(s: string) {
  return String(s || '').trim().replace(/\/+$/, '');
}

function forceHttpsOrigin(origin: string) {
  const o = stripTrailingSlash(origin);
  if (o.startsWith('https://')) return o;
  if (o.startsWith('http://')) return `https://${o.slice('http://'.length)}`;
  // If someone passed "cxcix-backend.onrender.com" (no scheme), make it https.
  return `https://${o}`;
}

/**
 * Base origin, e.g. https://cxcix-backend.onrender.com
 */
export const API_ORIGIN = forceHttpsOrigin(
  process.env.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/api\/?$/i, '')
    : DEFAULT_ORIGIN,
);

/**
 * Base API URL, e.g. https://cxcix-backend.onrender.com/api
 */
export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Socket origin, e.g. https://cxcix-backend.onrender.com
 */
export const SOCKET_ORIGIN = stripTrailingSlash(
  forceHttpsOrigin(process.env.EXPO_PUBLIC_SOCKET_URL || API_ORIGIN || DEFAULT_ORIGIN),
);

