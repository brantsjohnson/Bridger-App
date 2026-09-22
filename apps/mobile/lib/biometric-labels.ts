// ============================================
// WHAT THIS FILE DOES (plain English):
// Picks the words we show for Face ID / Touch ID / fingerprint. Kept
// separate from the phone's Face ID library so tests can check the
// labels without opening a real lock screen.
// ============================================

/** How we unlocked, for analytics only (never a face or print). */
export type BiometricMethod = 'face' | 'touch' | 'fingerprint' | 'iris';

/** What the phone said it can do (matches expo-local-authentication numbers). */
export const BIOMETRIC_TYPE = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3
} as const;

/**
 * Pick a short label and an analytics method from the types the phone
 * supports. Face wins over fingerprint when both exist (most iPhones).
 */
export function labelForAuthTypes(
  types: number[],
  os: 'ios' | 'android' | 'web' | string
): { label: string; method: BiometricMethod } {
  const set = new Set(types);
  if (set.has(BIOMETRIC_TYPE.FACIAL_RECOGNITION)) {
    return {
      label: os === 'ios' ? 'Face ID' : 'face unlock',
      method: 'face'
    };
  }
  if (set.has(BIOMETRIC_TYPE.FINGERPRINT)) {
    return {
      label: os === 'ios' ? 'Touch ID' : 'fingerprint',
      method: 'touch'
    };
  }
  if (set.has(BIOMETRIC_TYPE.IRIS)) {
    return { label: 'iris unlock', method: 'iris' };
  }
  return { label: 'this device', method: 'fingerprint' };
}

/** Storage key for one account on this phone. Preference is not a secret. */
export function biometricPrefKey(userId: string): string {
  return `bridger.biometric.unlock.${userId}`;
}
