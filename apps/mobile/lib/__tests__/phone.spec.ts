// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that phone numbers from any country become the same +E.164 shape
// Auth expects, including trunk zeros and full +pastes.
// ============================================
import { describe, expect, it } from 'vitest';
import { isPlausiblePhone, toE164 } from '../phone';

describe('toE164', () => {
  it('formats a US 10-digit local number with dial 1', () => {
    expect(toE164('(555) 123-4567', '1')).toBe('+15551234567');
  });

  it('formats a UK local number with dial 44 and drops a leading 0', () => {
    expect(toE164('07911 123456', '44')).toBe('+447911123456');
  });

  it('formats an India local number with dial 91', () => {
    expect(toE164('98765 43210', '91')).toBe('+919876543210');
  });

  it('trusts a full international paste over the picker', () => {
    expect(toE164('+61 412 345 678', '1')).toBe('+61412345678');
  });

  it('does not double-prefix when the dial is already typed', () => {
    expect(toE164('447911123456', '44')).toBe('+447911123456');
  });

  it('rejects junk that is too short', () => {
    expect(toE164('123', '1')).toBeNull();
    expect(isPlausiblePhone('123', '44')).toBe(false);
  });
});
