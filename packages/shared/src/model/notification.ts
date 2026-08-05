// ============================================
// WHAT THIS FILE DOES (plain English):
// The shape of one Bridger notification — in-app list row or push payload.
// Every kind has a destination in NOTIFICATIONS.md; tap and push use the same map.
// Settings prefs are per kind (individual toggles) plus which circles can nudge
// you (Close / Friends / Acquaintances). Spec: NOTIFICATIONS.md § Prefs.
// PRIVACY: UI may show a first name; analytics only gets kind + opaque ids.
// ============================================

/** What kind of thing this alert is about (drives where a tap goes). */
export type NotificationKind =
  | 'story_reply'
  | 'story_reply_elsewhere'
  | 'connect_request'
  | 'mutual_connection'
  | 'touch_grass_signal'
  | 'touch_grass_im_in'
  | 'birthday'
  | 'custom_date'
  /** Soft "check in sometimes" nudge you set on a friend (author-only) */
  | 'friend_check_in'
  | 'event_invite'
  | 'event_reminder'
  | 'rsvp_going'
  | 'event_assignment'
  /** Bridger suggests you meet someone at an event */
  | 'event_introduction'
  | 'poll_activity'
  | 'quiz_share'
  | 'recap_reaction'
  | 'inside_joke'
  | 'message'
  | 'coop_announcement'
  | 'activity_live';

/** Opaque ids that deep-link a tap to the right screen. Only set what the kind needs. */
export type NotificationTarget = {
  authorId?: string;
  postId?: string;
  requestId?: string;
  signalId?: string;
  eventId?: string;
  pollId?: string;
  quizSlug?: string;
  threadId?: string;
  personId?: string;
  activityId?: string;
};

/**
 * One notification. `text` is UI-only (never logged). `personId` is who appears
 * in the avatar / first-name copy.
 */
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  personId?: string;
  text: string;
  time: string;
  createdAt?: string;
  unread?: boolean;
  target?: NotificationTarget;
};

/** Circles that can trigger person-based pushes. Acquaintances default off. */
export type NotificationCircleId = 'close' | 'friend' | 'acquaintance';

export type NotificationCirclePref = {
  id: NotificationCircleId;
  label: string;
  description: string;
  /** Default on/off when prefs are first created */
  defaultOn: boolean;
};

export const NOTIFICATION_CIRCLE_OPTIONS: NotificationCirclePref[] = [
  {
    id: 'close',
    label: 'Close',
    description: 'People in your Close circle',
    defaultOn: true
  },
  {
    id: 'friend',
    label: 'Friends',
    description: 'People in your Friends circle',
    defaultOn: true
  },
  {
    id: 'acquaintance',
    label: 'Acquaintances',
    description: 'People in Acquaintances — off unless you turn it on',
    defaultOn: false
  }
];

/**
 * One Settings row = one kind. Group is only for section headers in the UI.
 * `onboardingGroup` maps the coarse onboarding multi-select onto these kinds.
 */
export type NotificationKindPref = {
  kind: NotificationKind;
  label: string;
  description: string;
  /** Section header on the Settings prefs screen */
  section: string;
  /**
   * When set, turning this onboarding chip on enables this kind.
   * Onboarding chips: close · birthdays · moments · events
   */
  onboardingGroup?: 'close' | 'birthdays' | 'moments' | 'events';
  /**
   * When true, push also requires the actor's circle toggle (Close / Friends /
   * Acquaintances). Co-op and similar system notes skip the circle check.
   */
  circleGated: boolean;
  /**
   * When false, this kind never appears in the Home notifications widget
   * (it has another Home surface — e.g. the story replies row). Still shows
   * on the full Notifications page and can still push.
   */
  homePreview: boolean;
  /** Default when prefs are first created (before onboarding expands) */
  defaultOn: boolean;
};

/** Canonical per-kind Settings list — must match NOTIFICATIONS.md. */
export const NOTIFICATION_KIND_PREFS: NotificationKindPref[] = [
  // --- Updates & replies (onboarding: close) ---
  {
    kind: 'story_reply',
    label: 'Replies to your update',
    description: 'Someone replied on your story',
    section: 'Updates & replies',
    onboardingGroup: 'close',
    circleGated: true,
    homePreview: false,
    defaultOn: true
  },
  {
    kind: 'story_reply_elsewhere',
    label: 'Replies to your comments',
    description: 'Someone replied where you left a comment or video',
    section: 'Updates & replies',
    onboardingGroup: 'close',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'recap_reaction',
    label: 'Recap reactions',
    description: 'Someone reacted to a weekly recap',
    section: 'Updates & replies',
    onboardingGroup: 'close',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  // --- Birthdays & dates ---
  {
    kind: 'birthday',
    label: 'Birthdays',
    description: "A friend's birthday is coming up or today",
    section: 'Birthdays & dates',
    onboardingGroup: 'birthdays',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'custom_date',
    label: 'Saved dates',
    description: 'Dates you saved on a friend (graduation, etc.)',
    section: 'Birthdays & dates',
    onboardingGroup: 'birthdays',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'friend_check_in',
    label: 'Check-in nudges',
    description: 'Occasional reminders to check in with someone (only you see these)',
    section: 'Birthdays & dates',
    onboardingGroup: 'birthdays',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  // --- Big moments ---
  {
    kind: 'mutual_connection',
    label: 'Friends connecting through you',
    description: 'Two of your friends connected via you',
    section: 'Big moments',
    onboardingGroup: 'moments',
    circleGated: false,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'inside_joke',
    label: 'Inside jokes',
    description: 'Someone tagged you in a joke',
    section: 'Big moments',
    onboardingGroup: 'moments',
    circleGated: true,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'activity_live',
    label: 'Weekly activities',
    description: 'A themed week goes live',
    section: 'Big moments',
    onboardingGroup: 'moments',
    circleGated: false,
    homePreview: true,
    defaultOn: false
  },
  // --- Events ---
  {
    kind: 'event_invite',
    label: 'Event invites',
    description: "You're invited to an event",
    section: 'Events',
    onboardingGroup: 'events',
    circleGated: true,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'event_reminder',
    label: 'Event reminders',
    description: '2 days / 2 hours before something you are going to',
    section: 'Events',
    onboardingGroup: 'events',
    circleGated: false,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'rsvp_going',
    label: 'RSVP updates',
    description: 'Someone is going to an event you care about',
    section: 'Events',
    onboardingGroup: 'events',
    circleGated: true,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'event_assignment',
    label: 'Event assignments',
    description: "You're on an item, or an assignment changed",
    section: 'Events',
    onboardingGroup: 'events',
    circleGated: false,
    homePreview: true,
    defaultOn: false
  },
  {
    kind: 'event_introduction',
    label: 'Event introductions',
    description: 'Someone at an event Bridger thinks you should meet',
    section: 'Events',
    onboardingGroup: 'events',
    circleGated: false,
    homePreview: true,
    defaultOn: true
  },
  // --- Also available ---
  {
    kind: 'touch_grass_signal',
    label: 'Touch Grass signals',
    description: 'A friend is free / touching grass',
    section: 'Also available',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'touch_grass_im_in',
    label: "Touch Grass — I'm in",
    description: 'Someone said they are in on your signal',
    section: 'Also available',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'connect_request',
    label: 'Connection requests',
    description: 'Someone wants to connect through a mutual',
    section: 'Also available',
    circleGated: false,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'message',
    label: 'Messages',
    description: 'New chats in Bridger Messages',
    section: 'Also available',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'poll_activity',
    label: 'Poll activity',
    description: 'A friend posted a poll or answered yours',
    section: 'Also available',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'quiz_share',
    label: 'Quizzes shared with you',
    description: 'A friend shared a quiz',
    section: 'Also available',
    circleGated: true,
    homePreview: true,
    defaultOn: true
  },
  {
    kind: 'coop_announcement',
    label: 'Co-op',
    description: 'Votes, books, and co-op announcements',
    section: 'Also available',
    circleGated: false,
    homePreview: true,
    defaultOn: true
  }
];

/** Coarse chips on the onboarding "What should we nudge you about?" step. */
export const ONBOARDING_NOTIFICATION_GROUPS: Array<{
  id: 'close' | 'birthdays' | 'moments' | 'events';
  label: string;
}> = [
  { id: 'close', label: "Close friends' updates" },
  { id: 'birthdays', label: 'Birthdays & dates' },
  { id: 'moments', label: 'Big moments' },
  { id: 'events', label: 'Events' }
];

/** Full prefs blob stored for Settings + push gating. */
export type NotificationPrefsState = {
  kinds: Record<NotificationKind, boolean>;
  circles: Record<NotificationCircleId, boolean>;
};

/** True when this kind may appear in the Home notifications widget. */
export function showsInHomeNotificationPreview(kind: NotificationKind): boolean {
  const meta = NOTIFICATION_KIND_PREFS.find((p) => p.kind === kind);
  return meta?.homePreview !== false;
}

/**
 * Notifications page filters — matches floating-nav pages (no Messages;
 * chat unread lives on the Messages tab only).
 */
export type NotificationPageFilter = 'all' | 'home' | 'friends' | 'events' | 'discover';

export const NOTIFICATION_PAGE_FILTERS: Array<{
  id: NotificationPageFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'home', label: 'Home' },
  { id: 'friends', label: 'Friends' },
  { id: 'events', label: 'Events' },
  { id: 'discover', label: 'Discover' }
];

/** Which nav page an alert belongs to (null = not listed on Notifications). */
const KIND_TO_PAGE: Record<NotificationKind, NotificationPageFilter | null> = {
  story_reply: 'home',
  story_reply_elsewhere: 'home',
  recap_reaction: 'home',
  poll_activity: 'home',
  activity_live: 'home',
  quiz_share: 'home',
  birthday: 'home',
  custom_date: 'home',
  friend_check_in: 'home',
  coop_announcement: 'home',
  connect_request: 'friends',
  mutual_connection: 'friends',
  inside_joke: 'friends',
  touch_grass_signal: 'events',
  touch_grass_im_in: 'events',
  event_invite: 'events',
  event_reminder: 'events',
  rsvp_going: 'events',
  event_assignment: 'events',
  event_introduction: 'events',
  // Messages stay on the Messages tab — not in this list.
  message: null
};

export function notificationPageForKind(
  kind: NotificationKind
): Exclude<NotificationPageFilter, 'all'> | null {
  const page = KIND_TO_PAGE[kind];
  return page === 'all' || page == null ? null : page;
}

/** True when this row should appear for the chosen Notifications page filter. */
export function matchesNotificationPageFilter(
  kind: NotificationKind,
  filter: NotificationPageFilter
): boolean {
  const page = KIND_TO_PAGE[kind];
  if (page == null) return false;
  if (filter === 'all') return true;
  return page === filter;
}
