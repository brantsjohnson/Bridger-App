// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns whatever the person typed in the phone box into a standard
// international number (E.164, like +15551234567). Matching pending friend
// cards later uses this same shape so "555-123-4567" and "+1 555 123 4567"
// still count as the same person.
//
// PRIVACY: this never logs the number. It only formats it.
// ============================================

/** Default country when the typed number has no + country code. US for now. */
const DEFAULT_COUNTRY_DIAL = '1';

/**
 * Strip everything but digits (and a leading +). Empty / junk returns null
 * so we never send a half-number to Auth.
 */
export function toE164(raw: string, defaultCountryDial = DEFAULT_COUNTRY_DIAL): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;

  if (hasPlus) {
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // US-style 10-digit numbers get +1. Longer numbers that already include the
  // country code (11 digits starting with 1) also become +1XXXXXXXXXX.
  if (defaultCountryDial === '1') {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return `+${defaultCountryDial}${digits}`;
}

/** True when the box looks like a real number we can send a code to. */
export function isPlausiblePhone(raw: string): boolean {
  return toE164(raw) != null;
}
