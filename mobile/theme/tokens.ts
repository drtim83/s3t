// ─── S3T Mobile Design Tokens ─────────────────────────────────────────────
// Keep in sync with web tailwind.config.js semantic color tokens.

export const Colors = {
  // Brand
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },

  // Backgrounds
  background: '#0f172a',    // slate-900
  surface:    '#1e293b',    // slate-800
  surfaceAlt: '#293548',    // slightly lighter slate

  // Text
  foreground:   '#f1f5f9',  // slate-100
  muted:        '#94a3b8',  // slate-400
  mutedForeground: '#64748b', // slate-500

  // Borders
  border:     '#334155',    // slate-700

  // Semantic
  primary:    '#3b82f6',    // blue-500
  primaryFg:  '#ffffff',
  success:    '#22c55e',    // green-500
  warning:    '#f59e0b',    // amber-500
  danger:     '#ef4444',    // red-500

  // Status chips
  status: {
    active:      { bg: '#14532d', text: '#4ade80' },
    draft:       { bg: '#1e3a5f', text: '#60a5fa' },
    on_hold:     { bg: '#451a03', text: '#fb923c' },
    completed:   { bg: '#1a2e05', text: '#86efac' },
    archived:    { bg: '#1e1b4b', text: '#a5b4fc' },
  },
} as const;

export const Typography = {
  fontFamily: undefined, // Expo uses system font by default; swap for custom font if needed
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    lg:   17,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal:   '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 9999,
} as const;
