/**
 * Brand tokens aligned with CxCix design (purple + gold, indigo gradient CTAs).
 */
export const BRAND = {
  purple: '#8B3CEE',
  purpleDeep: '#7C3AED',
  gold: '#C9A227',
  goldSoft: '#FFD194',
  ink: '#000000',
  subtitle: '#666666',
  muted: '#757575',
  pageBg: '#F4F7F9',
  /** Primary CTA gradient — indigo → gold/tan */
  gradientStart: '#6366F1',
  gradientEnd: '#D9AB6A',
  /** Alternate (welcome / hero buttons) — blue → peach gold */
  gradientAltStart: '#5E72EB',
  gradientAltEnd: '#FFD194',
} as const;

export const BRAND_GRADIENT = [BRAND.gradientStart, BRAND.gradientEnd] as const;
export const BRAND_GRADIENT_ALT = [BRAND.gradientAltStart, BRAND.gradientAltEnd] as const;
