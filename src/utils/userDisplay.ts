const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function looksLikeEmail(s: string): boolean {
  return EMAIL_LIKE.test(String(s || '').trim());
}

function prettifyToken(s: string): string {
  const t = String(s || '')
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!t) return '';
  return t
    .split(' ')
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
}

function friendlyFromUsername(username: string): string {
  const u = String(username || '').trim();
  if (!u) return '';
  if (looksLikeEmail(u)) {
    const local = u.split('@')[0] || '';
    return prettifyToken(local) || 'User';
  }
  return prettifyToken(u) || u;
}

/**
 * Primary line for profile / feed / chat: prefers API `fullName`, then non-email `displayName`,
 * then a readable label from `username`. Never surfaces account email as the visible name.
 */
export function formatUserDisplayName(
  input: {
    fullName?: string | null;
    displayName?: string | null;
    username?: string | null;
    /** Only used to detect displayName === email; omit in UI-only callers. */
    email?: string | null;
  },
  emptyFallback = 'User',
): string {
  const username = String(input.username || '').trim();
  const email = String(input.email || '').trim().toLowerCase();

  const tryPrimary = (raw: string): string | null => {
    const t = String(raw || '').trim();
    if (!t) return null;
    const low = t.toLowerCase();
    if (email && low === email) return null;
    if (looksLikeEmail(t)) return null;
    return t;
  };

  const fromFn = tryPrimary(String(input.fullName || ''));
  if (fromFn) return fromFn;

  const dnRaw = String(input.displayName || '').trim();
  const fromDn = tryPrimary(dnRaw);
  if (fromDn) return fromDn;

  const f = friendlyFromUsername(username);
  return f || username || emptyFallback;
}

/** `@handle` for subtitle row (always the stored username). */
export function formatAtUsername(username?: string | null, fallback = 'user'): string {
  const u = String(username || '').trim();
  return u ? `@${u}` : `@${fallback}`;
}

/** Prefer `fullName` from API; then username; then `"User"`. */
export function getDisplayName(
  user:
    | {
        fullName?: string | null;
        displayName?: string | null;
        username?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
  emptyFallback = 'User',
): string {
  if (!user) return emptyFallback;
  return formatUserDisplayName(
    {
      fullName: user.fullName,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
    },
    emptyFallback,
  );
}
