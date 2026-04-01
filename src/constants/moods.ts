/**
 * Core “moods” for CxCix — drive feed ranking, tone, and UI accents.
 */
export const MOODS = [
  'calm',
  'serious',
  'creative',
  'satire',
  'debate',
  'vawulence',
] as const;

export type MoodId = (typeof MOODS)[number];

export const MOOD_LABELS: Record<MoodId, string> = {
  calm: 'Calm',
  serious: 'Serious',
  creative: 'Creative',
  satire: 'Satire',
  debate: 'Debate',
  vawulence: 'Vawulence',
};
