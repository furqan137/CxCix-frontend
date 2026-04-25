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

/** API / DB mood label → store id (see `FEED_MOODS` on the server). */
export const MOOD_API_TO_ID: Record<string, MoodId> = {
  Calm: 'calm',
  Serious: 'serious',
  Creative: 'creative',
  Satire: 'satire',
  Debate: 'debate',
  Vawulence: 'vawulence',
};

export function moodApiToId(mood: string): MoodId | undefined {
  return MOOD_API_TO_ID[mood];
}

/** API label (e.g. "Calm") → store id for bookmark sheet / UI. */
export function moodLabelToMoodId(label: string | null | undefined): MoodId {
  if (!label) return 'calm';
  const key = (Object.keys(MOOD_LABELS) as MoodId[]).find((k) => MOOD_LABELS[k] === label);
  return key ?? 'calm';
}
