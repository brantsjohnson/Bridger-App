// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that sticky-note font sizing gets bigger for short jokes and smaller
// for long ones, and never goes outside the allowed range.
// ============================================
import { describe, expect, it } from 'vitest';
import {
  STICKY_NOTE_FONT_MAX,
  STICKY_NOTE_FONT_MIN,
  stickyNoteFontSize
} from '../stickyNoteFont';

describe('stickyNoteFontSize', () => {
  it('gives short jokes a bigger font than long jokes', () => {
    const short = stickyNoteFontSize('Nice.', 280, 280);
    const long = stickyNoteFontSize(
      'Remember when we got lost looking for the taco truck and ended up at that weird museum instead?',
      280,
      280
    );
    expect(short).toBeGreaterThan(long);
  });

  it('stays within the min and max', () => {
    const tinyBox = stickyNoteFontSize('x'.repeat(400), 80, 80);
    const hugeRoom = stickyNoteFontSize('Yo', 400, 400);
    expect(tinyBox).toBeGreaterThanOrEqual(STICKY_NOTE_FONT_MIN);
    expect(tinyBox).toBeLessThanOrEqual(STICKY_NOTE_FONT_MAX);
    expect(hugeRoom).toBe(STICKY_NOTE_FONT_MAX);
  });

  it('treats empty text like a short joke (big type)', () => {
    const empty = stickyNoteFontSize('', 280, 280);
    expect(empty).toBeGreaterThan(28);
  });
});
