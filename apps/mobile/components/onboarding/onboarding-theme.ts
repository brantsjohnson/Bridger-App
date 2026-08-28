// ============================================
// WHAT THIS FILE DOES (plain English):
// The paint box for onboarding. The first-run screens still have their own
// square boxes and pink Continue, but every color comes from the same Bridger
// palette as the rest of the app (THEME + ACCENT_HEX in packages/ui). That way
// the handoff into Home never feels like a different brand.
//
// Shape and layout stay onboarding-only (hard 2px outlines, no radius). Color
// does not: if a brand hex changes in tokens, onboarding picks it up here.
// ============================================
import { ACCENT_HEX, THEME } from '@bridger/ui';

/** Light-mode paper/ink for white onboarding boxes. The page canvas follows
 *  the app theme (`bg-canvas`); labels ON the canvas must use `useThemeColors`
 *  or `text-ink*`, not these locked light values. */
const light = THEME.light;

/** Soft blue fill used when a tile is picked (same pale blue as ACCENTS.blue.tintSolid). */
const BLUE_WASH = '#BBD6FB';
/** Soft pink fill for callouts (same pale pink as ACCENTS.pink.tintSolid). */
const PINK_WASH = '#FFC0D7';

/** The colors used across every onboarding step. Mirrors the main app tokens. */
export const OB = {
  /** Eggshell canvas: same token Home uses (`THEME` / `bg-canvas`). */
  canvas: light.canvas,
  /** White boxes: fields, option tiles, the progress bar. */
  paper: light.surface,
  /** Headings and the progress outline (app accent blue). */
  blue: ACCENT_HEX.blue,
  /** Outlines and small labels (app ink, not a separate navy). */
  navy: light.ink,
  /** The "picked it" fill on tiles (pale blue wash from the accent set). */
  periwinkle: BLUE_WASH,
  /** The main action color (Continue, big numbers): app pink. */
  pink: ACCENT_HEX.pink,
  /** A soft pink wash for callout rows (e.g. "All of the above"). */
  pinkWash: PINK_WASH,
  /** Brand purple (News accent). Used for fills like the isolation ring. */
  purple: ACCENT_HEX.purple,
  /** Light red for big numbers and accent type on the blue reality-check canvas. */
  redOnBlue: '#FF8A94',
  /** The little "why we ask" chips above a question. */
  amber: ACCENT_HEX.amber,
  /** The all-caps kicker on the reality-check screens (app coral). */
  orange: ACCENT_HEX.coral,
  /** Type that sits on pink or blue (white, same as accent `text-white`). */
  onColor: '#FFFFFF',
  /** Plain body text inside white boxes. */
  ink: light.ink,
  /** Confirmed / done green (app teal, same as toggles). */
  green: ACCENT_HEX.teal,
  /** The faint grid lines drawn in the corners (ink at low opacity). */
  gridLine: 'rgba(28,27,22,0.18)',
  /** Soft outline for quiet panels (ink at mid opacity). */
  borderMuted: 'rgba(28,27,22,0.35)',
  /** Quiet fill for empty cells (ink at low opacity). */
  fillFaint: 'rgba(28,27,22,0.12)',
  /** Quiet label on empty cells. */
  inkFaint: 'rgba(28,27,22,0.55)',
  /** Very quiet type (inactive picker labels). */
  inkWhisper: 'rgba(28,27,22,0.25)',
  /** Soft body copy on white paper. */
  inkSoft: light.inkSoft,
  /** Off-track tint for the system switch (ink at low opacity). */
  switchOff: 'rgba(28,27,22,0.22)'
} as const;

/** Kept for older hard-shadow call sites (mic, confirm panel). Not used on Continue. */
export const OB_SHADOW_OFFSET = 5;

/** Outline thickness on every white box, so they all match. */
export const OB_BORDER = 2;

/** Big heading: FeloniaPixel (the app header font), all caps, tight and blue.
 *  Big Shoulders Display stays only on the four reality-check screens. */
export const OB_HEADING = {
  fontSize: 50,
  lineHeight: 46,
  letterSpacing: -1.4,
  textTransform: 'uppercase' as const,
  color: OB.blue
};

/** The same heading, one size down, for screens with a lot of content.
 *  Line height stays above the font size so a two-line ask (job + dream job)
 *  never sits on top of itself. */
export const OB_HEADING_SM = {
  fontSize: 36,
  lineHeight: 40,
  letterSpacing: -1,
  textTransform: 'uppercase' as const,
  color: OB.blue
};
