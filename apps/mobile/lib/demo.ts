// ============================================
// WHAT THIS FILE DOES (plain English):
// One switch for "demo mode": fake data + skip the sign-in wall so you can
// walk the real screens on localhost. Production builds leave this off; the
// screens stay the same either way (only the data source changes).
// ============================================

/**
 * True when EXPO_PUBLIC_DEMO_MODE=1 (or the older DEV_SKIP_AUTH flag, so
 * existing .env files keep working until you rename them).
 */
export function isDemoMode(): boolean {
  return (
    process.env.EXPO_PUBLIC_DEMO_MODE === '1' ||
    process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === '1'
  );
}
