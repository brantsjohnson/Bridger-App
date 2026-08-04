// ============================================
// WHAT THIS FILE DOES (plain English):
// The raw design values for the whole app — the eggshell canvas color, the
// near-black dark canvas, the accent palette, and the 90s-metallic button
// colors. These come straight from DESIGN.md. Most styling is done with
// Tailwind class names (see tailwind.config.js), but these constants are here
// for the rare place code needs a real color value (a chart, a dynamic tint).
// If you change a brand color, change it HERE and in tailwind.config.js.
// ============================================

/** The app canvas. Light is warm eggshell; dark is intentional near-black. */
export const CANVAS = {
  light: '#F4F1E7', // eggshell (DESIGN.md) — the calm canvas that makes accents pop
  dark: '#0E0E0E',
  ink: '#1C1B16' // near-black text on eggshell
} as const;

/** The 90s-metallic primary button: silver face, light top/left, dark bottom/right. */
export const METAL = {
  face: '#DEDCD2',
  hi: '#FFFFFF',
  lo: '#A7A498'
} as const;

export type Accent =
  | 'purple'
  | 'coral'
  | 'teal'
  | 'amber'
  | 'pink'
  | 'blue'
  | 'green';

/** The playful accent palette, delivered through cards, chips, and selected states. */
export const ACCENTS: Record<Accent, string> = {
  purple: '#7F77DD',
  coral: '#F0997B',
  teal: '#1D9E75',
  amber: '#EF9F27',
  pink: '#ED93B1',
  blue: '#378ADD',
  green: '#97C459'
};

export const ACCENT_KEYS = Object.keys(ACCENTS) as Accent[];

/** Card corner radii per DESIGN.md (chips/buttons use pill radius). */
export const RADIUS = {
  card: 16,
  cardLg: 24,
  pill: 999
} as const;
