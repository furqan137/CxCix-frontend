/**
 * Metered TURN — set `EXPO_PUBLIC_METERED_TURN_API_KEY` for dynamic ICE.
 * Optional: `EXPO_PUBLIC_METERED_TURN_USER` / `EXPO_PUBLIC_METERED_TURN_CREDENTIAL` for static fallback.
 */

export type WrtcIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const METERED_CREDENTIALS_BASE = 'https://cxcix.metered.live/api/v1/turn/credentials';

function parseMeteredResponse(json: unknown): WrtcIceServer[] {
  if (Array.isArray(json)) {
    return json as WrtcIceServer[];
  }
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.iceServers)) {
      return o.iceServers as WrtcIceServer[];
    }
    if (o.rtcConfig && typeof o.rtcConfig === 'object' && Array.isArray((o.rtcConfig as { iceServers?: unknown[] }).iceServers)) {
      return (o.rtcConfig as { iceServers: WrtcIceServer[] }).iceServers;
    }
  }
  return [];
}

export function getFallbackIceServers(): WrtcIceServer[] {
  const u = (process.env.EXPO_PUBLIC_METERED_TURN_USER || '7a2f6a0ae082213c766cb85a').trim();
  const c = (process.env.EXPO_PUBLIC_METERED_TURN_CREDENTIAL || '6RqgpkqeKXLl5yWk').trim();
  return [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'turn:global.relay.metered.ca:80', username: u, credential: c },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: u, credential: c },
    { urls: 'turn:global.relay.metered.ca:443', username: u, credential: c },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: u, credential: c },
  ];
}

/**
 * Fetches time-limited ICE servers from Metered, then static fallback.
 */
export async function getIceServers(): Promise<WrtcIceServer[]> {
  const apiKey = (process.env.EXPO_PUBLIC_METERED_TURN_API_KEY || '').trim();
  if (apiKey) {
    try {
      const res = await fetch(
        `${METERED_CREDENTIALS_BASE}?apiKey=${encodeURIComponent(apiKey)}`,
        { method: 'GET' },
      );
      if (res.ok) {
        const json: unknown = await res.json();
        const parsed = parseMeteredResponse(json);
        if (parsed.length > 0) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('[TURN] Using Metered API ICE servers', parsed.length);
          }
          return parsed;
        }
      }
    } catch (e) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[TURN] Metered API failed, using static fallback', e);
      }
    }
  } else if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[TURN] EXPO_PUBLIC_METERED_TURN_API_KEY missing — static fallback only');
  }
  return getFallbackIceServers();
}
