// ============================================
// WHAT THIS FILE DOES (plain English):
// Picks how big the joke text should be on a square sticky note. Short jokes
// get a big font so they fill the paper. Long jokes shrink so every word still
// fits. Composer and posted notes both use this so they look the same.
// ============================================

/** Smallest size we allow (caption floor — long jokes need room). */
export const STICKY_NOTE_FONT_MIN = 13;
/** Biggest size we allow (short jokes get this roomy look). */
export const STICKY_NOTE_FONT_MAX = 42;

/**
 * Largest font size where `text` still fits in the given box.
 * Uses a simple line estimate (bold sans ~0.55em wide, 1.25 line height).
 */
export function stickyNoteFontSize(
  text: string,
  width: number,
  height: number,
  opts?: { min?: number; max?: number }
): number {
  const min = opts?.min ?? STICKY_NOTE_FONT_MIN;
  const max = opts?.max ?? STICKY_NOTE_FONT_MAX;
  if (width < 8 || height < 8) return Math.min(22, max);

  // Empty field sizes like a short joke so the placeholder starts big.
  const raw = (text.trim() || 'Hi').replace(/\s+/g, ' ').trim();

  const fits = (fs: number) => {
    const lineH = stickyNoteLineHeight(fs);
    const avgChar = fs * 0.55;
    const charsPerLine = Math.max(1, Math.floor(width / avgChar));
    let lines = 0;
    for (const part of raw.split('\n')) {
      const len = Math.max(1, part.length);
      lines += Math.ceil(len / charsPerLine);
    }
    return lines * lineH <= height + 0.5;
  };

  // THIS SECTION DOES: binary search for the biggest size that still fits.
  let lo = min;
  let hi = max;
  let best = min;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fits(mid)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/** Line height that matches the sticky-note look (a little airy). */
export function stickyNoteLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.25);
}
