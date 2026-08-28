// ============================================
// WHAT THIS FILE DOES (plain English):
// The paint box for onboarding, and only onboarding. The first-run screens keep
// their own boxes and pink Continue, but they sit on the same eggshell canvas
// as the rest of Bridger so the handoff into Home does not feel like a new app.
//
// WHY IT LIVES HERE AND NOT IN THE APP THEME: onboarding still has its own
// outlines, chips, and pink CTA. Those values stay in this one file instead of
// leaking into the app-wide tokens. If a value needs changing, change it here
// once.
// ============================================

/** The colors used across every onboarding step. */
export const OB = {
  /** Same eggshell as the main app canvas (`tokens` light canvas). */
  canvas: '#FAF8F2',
  /** The white boxes: fields, option tiles, the progress bar. */
  paper: '#FCFCFC',
  /** Headings and the progress outline. */
  blue: '#143CAB',
  /** Outlines and small labels. A quieter navy than the heading blue. */
  navy: '#274087',
  /** The "picked it" fill on tiles and the pressed state on buttons. */
  periwinkle: '#AEBCFB',
  /** The main action color (Continue, big numbers). */
  pink: '#FF3E8A',
  /** A very light pink wash for callout rows (e.g. "All of the above"). */
  pinkWash: '#FFE8F1',
  /** The little "why we ask" chips above a question. */
  amber: '#FFB515',
  /** The all-caps kicker on the reality-check screens. */
  orange: '#FF5A1F',
  /** Type that sits on pink or blue. */
  onColor: '#FCFAF4',
  /** Plain body text inside white boxes. */
  ink: '#000000',
  /** A confirmed / done green (used sparingly, e.g. invite sent). */
  green: '#00A676',
  /** The faint grid lines drawn in the corners. */
  gridLine: 'rgba(53,92,125,0.22)'
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
