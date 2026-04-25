import * as ExpoLinking from 'expo-linking';

/**
 * Extracts the Firebase **https** sign-in / action URL from an incoming app link
 * (custom scheme `cxcix://` / `exp://` with `?link=`, or a bare `https://` action URL).
 */
export function extractFirebaseActionUrlForEmailLink(incoming: string): string | null {
  const t = incoming.trim();
  if (!t) return null;

  if (t.startsWith('cxcix://') || t.startsWith('exp://')) {
    const parsed = ExpoLinking.parse(t);
    const q = parsed.queryParams as Record<string, string | string[] | undefined> | undefined;
    const raw = q?.link;
    const one = Array.isArray(raw) ? raw[0] : raw;
    if (typeof one === 'string' && one.length > 0) {
      try {
        return decodeURIComponent(one);
      } catch {
        return one;
      }
    }
    const qMark = t.indexOf('?');
    if (qMark >= 0) {
      try {
        const sp = new URLSearchParams(t.slice(qMark + 1));
        const link = sp.get('link');
        if (link) return link;
      } catch {
        /* ignore */
      }
      const m = t.match(/[?&]link=([^&]+)/);
      if (m?.[1]) {
        try {
          return decodeURIComponent(m[1]);
        } catch {
          return m[1];
        }
      }
    }
    return null;
  }

  if (t.startsWith('https://') && (t.includes('oobCode=') || t.includes('apiKey='))) {
    return t;
  }
  return null;
}
