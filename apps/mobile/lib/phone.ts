// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns whatever the person typed in the phone box into a standard
// international number (E.164, like +15551234567). The Sign in country
// picker passes the dial code (1, 44, 61…). Matching pending friend cards
// later uses this same shape so "555-123-4567" and "+1 555 123 4567"
// still count as the same person.
//
// PRIVACY: this never logs the number. It only formats it.
// ============================================

/** Default country when the typed number has no + country code. US for now. */
const DEFAULT_COUNTRY_DIAL = '1';

/**
 * Strip everything but digits (and a leading +). Empty / junk returns null
 * so we never send a half-number to Auth.
 *
 * Rules in plain English:
 * - If they pasted a full +number, trust that and ignore the picker.
 * - Otherwise stick the picker's dial code in front of the local digits.
 * - Outside NANP (+1), drop a leading 0 (many countries use 0 before local).
 * - If they already typed the dial code (e.g. 1555… with US selected),
 *   do not double-prefix it.
 */
export function toE164(raw: string, defaultCountryDial = DEFAULT_COUNTRY_DIAL): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const dial = defaultCountryDial.replace(/[^\d]/g, '') || DEFAULT_COUNTRY_DIAL;

  // Full international paste always wins over the country picker.
  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/[^\d]/g, '');
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  let national = trimmed.replace(/[^\d]/g, '');
  if (!national) return null;

  // Trunk prefix 0 is common outside the US / Canada (+1).
  if (dial !== '1' && national.startsWith('0')) {
    national = national.replace(/^0+/, '');
    if (!national) return null;
  }

  // Already includes the dial code (typed 447911… with UK selected, or 1555… US).
  if (
    national.startsWith(dial) &&
    national.length - dial.length >= 7 &&
    national.length <= 15
  ) {
    return `+${national}`;
  }

  // US / Canada: classic 10-digit local number.
  if (dial === '1') {
    if (national.length === 10) return `+1${national}`;
    if (national.length === 11 && national.startsWith('1')) return `+${national}`;
  }

  const combined = `${dial}${national}`;
  if (combined.length < 8 || combined.length > 15) return null;
  return `+${combined}`;
}

/** True when the box looks like a real number we can send a code to. */
export function isPlausiblePhone(
  raw: string,
  defaultCountryDial = DEFAULT_COUNTRY_DIAL
): boolean {
  return toE164(raw, defaultCountryDial) != null;
}
