// ============================================
// WHAT THIS FILE DOES (plain English):
// Billy's paint colors in one place. Light blue for the card. Purple tile
// behind his eyes. Mic + Listening use a fun 3-color fill (purple, dark blue,
// charcoal) with uneven stops so it does not look like a chrome reflection.
// ============================================

/** Solid light blue for Billy's card / island. */
export const BILLY_BLUE = '#3FA4FF';

/** Solid purple square behind Billy's eyes. */
export const BILLY_PURPLE = '#6B2FEA';

/**
 * Fill for the mic button and Listening pill.
 * Purple, dark blue, charcoal — no white shine in the middle.
 */
export const BILLY_MIC_GRADIENT = ['#6A4BF5', '#0A3D91', '#2A2924'] as const;

/** Uneven stops so the three colors sit in "random" bands, not a mirror stripe. */
export const BILLY_MIC_GRADIENT_LOCATIONS = [0, 0.42, 1] as const;
