// ============================================
// WHAT THIS FILE DOES (plain English):
// Class bundles for copy that sits on the onboarding page canvas (not inside a
// white paper box). The canvas follows light/dark (`bg-canvas`), so these use
// theme ink classes (`text-ink*`) that flip to cream in dark mode. Never use
// text-onaccent here: that stays near-black and disappears on a dark canvas.
//
// Inside white cards / OB tiles, keep hard OB.navy / OB.ink instead.
// ============================================

/** Intro paragraph under the big question. */
export const WASH_BODY = 'text-ink-soft';

/** Secondary hint lines on the canvas. */
export const WASH_MUTED = 'text-ink-mute';

/** Small captions and legal footers on the canvas. */
export const WASH_CAPTION = 'text-ink-mute';

/** Tappable legal links on the canvas. */
export const WASH_LINK = 'text-ink underline';
