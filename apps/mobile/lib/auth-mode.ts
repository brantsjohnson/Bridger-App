// ============================================
// WHAT THIS FILE DOES (plain English):
// Picks which sign-in chrome to show. Phone OTP is the default. Set
// EXPO_PUBLIC_AUTH_MODE=legacy to bring back Google / Apple / email without
// ripping the phone path out (handy for beta).
// ============================================

/** Sign-in chrome: phone OTP (default) or the older Google / Apple / email UI. */
export type AuthMode = 'phone' | 'legacy';

/**
 * Which sign-in UI this build should show. Phone is the product default.
 * Only the exact string "legacy" flips back to Google / Apple / email.
 */
export function authMode(): AuthMode {
  return process.env.EXPO_PUBLIC_AUTH_MODE === 'legacy' ? 'legacy' : 'phone';
}
