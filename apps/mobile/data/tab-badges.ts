// ============================================
// WHAT THIS FILE DOES (plain English):
// Decides which floating-nav tabs show a little "something new" dot. Each tab
// with unread activity gets a dot in that tab's own color (FloatingTabBar).
// Demo reads fixtures + session clears; live will ask the API later.
// PRIVACY: only booleans — never who or what the alert says.
// ============================================
import type { TabKey } from '@bridger/ui';
import { isDemoMode } from '../lib/demo';
import { hasOpenStoryReplies, unreadNotificationKinds } from './feed';

/** Which tabs should show a colored notification dot right now. */
export function getTabBadges(): Partial<Record<TabKey, boolean>> {
  if (!isDemoMode()) {
    // Live: wire to unread counts from the API.
    return {};
  }

  const kinds = unreadNotificationKinds();

  return {
    home: hasOpenStoryReplies() || kinds.has('story_reply') || kinds.has('recap_reaction'),
    friends: kinds.has('connect_request') || kinds.has('mutual_connection'),
    events: kinds.has('touch_grass_signal') || kinds.has('event_invite'),
    discover: true,
    // No news feed yet — no dot until the feature lands.
    news: false
  };
}
