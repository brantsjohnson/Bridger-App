// ============================================
// WHAT THIS FILE DOES (plain English):
// Onboarding screens paint a pastel color wash behind everything. In dark mode
// that wash stays light on purpose, so body copy must use text-onaccent (always
// dark ink), not text-ink (which flips to cream and disappears on the wash).
// Import these class bundles on any line that sits directly on the wash — not
// inside a Card or bg-surface panel.
// ============================================

/** Intro paragraph under the big question. */
export const WASH_BODY = 'text-onaccent/80';

/** Secondary hint lines on the wash. */
export const WASH_MUTED = 'text-onaccent/65';

/** Small captions and legal footers on the wash. */
export const WASH_CAPTION = 'text-onaccent/60';

/** Tappable legal links on the wash. */
export const WASH_LINK = 'text-onaccent underline';
