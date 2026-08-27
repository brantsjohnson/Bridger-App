// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns product analytics on for signed-in people (always on for now; no
// Settings off-switch). Stops sending when logged out or in demo. Account
// delete still asks the API to erase that person's PostHog record.
// ============================================
import {
  identifyAnalyticsUser,
  optInAnalytics,
  optOutAnalytics
} from '@bridger/shared';
import { apiFetch } from './api';
import { isDemoMode } from './demo';

/**
 * After login / logout: signed-in real accounts send analytics; everyone
 * else stays quiet. Demo never sends (PostHog sink also blocks demo).
 */
export async function syncAnalyticsSession(
  userId: string | null
): Promise<boolean> {
  if (!userId || isDemoMode()) {
    optOutAnalytics();
    return false;
  }
  optInAnalytics();
  identifyAnalyticsUser(userId);
  return true;
}

/**
 * Ask the API to erase this person's PostHog record (account delete path).
 * Safe no-op in demo or when the network fails.
 */
export async function purgeAnalyticsPerson(): Promise<void> {
  if (isDemoMode()) return;
  try {
    await apiFetch('/me/analytics/purge', {
      method: 'POST',
      body: JSON.stringify({})
    });
  } catch {
    // Deletion can retry purge later; do not block the UI on PostHog.
  }
}
