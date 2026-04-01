import type { MoodId } from './moods';

/**
 * Hex values for gradients & non–Tailwind APIs (e.g. LinearGradient).
 */
export const MOOD_GRADIENT: Record<MoodId, readonly [string, string]> = {
  calm: ['#0F766E', '#0284C7'],
  serious: ['#0F172A', '#334155'],
  creative: ['#5B21B6', '#7C3AED'],
  satire: ['#A16207', '#EAB308'],
  debate: ['#C2410C', '#EA580C'],
  vawulence: ['#991B1B', '#EF4444'],
};
