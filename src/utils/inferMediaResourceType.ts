/** Guess image vs video from URL when API omits `resourceType` (legacy `mediaUrl` only). */
export function inferMediaResourceType(url: string): 'image' | 'video' {
  const base = String(url || '').split('?')[0].toLowerCase();
  if (/\.(mp4|mov|webm|m4v|mkv|3gp|avi)(\b|$)/i.test(base)) return 'video';
  const q = String(url || '').toLowerCase();
  if (q.includes('resource_type=video') || q.includes('/video/upload')) return 'video';
  return 'image';
}
