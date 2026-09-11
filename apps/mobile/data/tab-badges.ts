// ============================================
// WHAT THIS FILE DOES (plain English):
// Decides which floating-nav tabs show a "something new" dot, and which
// section titles inside a tab should show a matching little dot after you
// open that tab. Opening a tab clears its nav-bar dot; the section dots stay
// so you can see where the news is. A brand-new alert for that tab lights
// the nav dot again. PRIVACY: only booleans — never who or what the alert says.
// ============================================
import type { NotificationKind } from '@bridger/shared';
import type { TabKey } from '@bridger/ui';
import { isDemoMode } from '../lib/demo';
import { hasOpenStoryReplies, unreadNotificationKinds } from './feed';

/** Section analytics keys that can show a title-side attention dot. */
export type AttentionSection =
  | 'stories_row'
  | 'notifications_preview'
  | 'announcements'
  | 'ask_the_group'
  | 'activity'
  | 'quiz'
  | 'pod'
  | 'inside_jokes'
  | 'roster'
  | 'touch_grass'
  | 'hosting'
  | 'going'
  | 'invited'
  | 'wants_to_connect'
  | 'people_to_meet';

/**
 * Where each alert lives on the tab screens (nav destination), so the
 * section title can light up next to the right heading.
 */
const KIND_TO_ATTENTION: Partial<
  Record<NotificationKind, { tab: TabKey; section: AttentionSection }>
> = {
  story_reply: { tab: 'home', section: 'stories_row' },
  story_reply_elsewhere: { tab: 'home', section: 'notifications_preview' },
  story_prompt: { tab: 'home', section: 'stories_row' },
  collage_tag: { tab: 'home', section: 'stories_row' },
  poll_activity: { tab: 'home', section: 'ask_the_group' },
  activity_live: { tab: 'home', section: 'activity' },
  delight_gift: { tab: 'home', section: 'announcements' },
  quiz_share: { tab: 'home', section: 'quiz' },
  jname_link_opened: { tab: 'home', section: 'quiz' },
  jname_top_match: { tab: 'home', section: 'quiz' },
  birthday: { tab: 'home', section: 'announcements' },
  custom_date: { tab: 'home', section: 'announcements' },
  friend_check_in: { tab: 'home', section: 'announcements' },
  coop_announcement: { tab: 'home', section: 'announcements' },
  // Friend Pod recap lives on Friends; Inside jokes too.
  recap_reaction: { tab: 'friends', section: 'pod' },
  inside_joke: { tab: 'friends', section: 'inside_jokes' },
  // Connect asks + mutuals land on Discover (not the Friends roster).
  connect_request: { tab: 'discover', section: 'wants_to_connect' },
  mutual_connection: { tab: 'discover', section: 'people_to_meet' },
  touch_grass_signal: { tab: 'events', section: 'touch_grass' },
  touch_grass_im_in: { tab: 'events', section: 'touch_grass' },
  event_invite: { tab: 'events', section: 'invited' },
  event_reminder: { tab: 'events', section: 'going' },
  rsvp_going: { tab: 'events', section: 'hosting' },
  event_assignment: { tab: 'events', section: 'going' },
  event_introduction: { tab: 'events', section: 'going' }
};

/** Unread fingerprint we last acknowledged per tab (empty = never opened). */
const acknowledgedFingerprint: Partial<Record<TabKey, string>> = {};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

/** Screens / tab bar re-render when badges or section dots change. */
export function subscribeTabAttention(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Build a stable string of which sections still have unread on this tab. */
function fingerprintForTab(tab: TabKey, sections: Set<AttentionSection>): string {
  if (sections.size === 0) return '';
  return `${tab}:${[...sections].sort().join(',')}`;
}

/** Which sections on a tab still have unread activity right now. */
export function getSectionDots(tab: TabKey): Partial<Record<AttentionSection, boolean>> {
  const open = collectOpenSections();
  const out: Partial<Record<AttentionSection, boolean>> = {};
  for (const section of open) {
    const meta = sectionTab(section);
    if (meta === tab) out[section] = true;
  }
  return out;
}

function sectionTab(section: AttentionSection): TabKey | null {
  for (const meta of Object.values(KIND_TO_ATTENTION)) {
    if (meta?.section === section) return meta.tab;
  }
  // stories_row also lights from open story-reply chips (not only kinds).
  if (section === 'stories_row') return 'home';
  return null;
}

/** Collect open attention sections from unread kinds + Home reply chips. */
function collectOpenSections(): Set<AttentionSection> {
  const sections = new Set<AttentionSection>();
  if (!isDemoMode()) {
    // Live: wire to unread counts from the API.
    return sections;
  }

  if (hasOpenStoryReplies()) sections.add('stories_row');

  const kinds = unreadNotificationKinds();
  for (const kind of kinds) {
    const meta = KIND_TO_ATTENTION[kind as NotificationKind];
    if (meta) sections.add(meta.section);
  }
  return sections;
}

function openSectionsByTab(): Partial<Record<TabKey, Set<AttentionSection>>> {
  const byTab: Partial<Record<TabKey, Set<AttentionSection>>> = {};
  for (const section of collectOpenSections()) {
    const tab = sectionTab(section);
    if (!tab) continue;
    if (!byTab[tab]) byTab[tab] = new Set();
    byTab[tab]!.add(section);
  }
  return byTab;
}

/**
 * Which tabs should show a colored notification dot on the floating nav.
 * Cleared once you open that tab (until a new alert for it arrives).
 */
export function getTabBadges(): Partial<Record<TabKey, boolean>> {
  const byTab = openSectionsByTab();
  const out: Partial<Record<TabKey, boolean>> = {};
  (Object.keys(byTab) as TabKey[]).forEach((tab) => {
    const sections = byTab[tab];
    if (!sections || sections.size === 0) return;
    const fp = fingerprintForTab(tab, sections);
    if (acknowledgedFingerprint[tab] === fp) return;
    out[tab] = true;
  });
  return out;
}

/**
 * Mark this tab as seen for its current unread set. Nav dot goes off; section
 * title dots stay until those alerts are actually read / cleared.
 */
export function acknowledgeTab(tab: TabKey): void {
  const byTab = openSectionsByTab();
  const sections = byTab[tab] ?? new Set<AttentionSection>();
  const fp = fingerprintForTab(tab, sections);
  if (acknowledgedFingerprint[tab] === fp) return;
  acknowledgedFingerprint[tab] = fp;
  notify();
}

/** Call after mark-read / clear so listeners refresh dots. */
export function notifyTabAttentionChanged(): void {
  notify();
}
