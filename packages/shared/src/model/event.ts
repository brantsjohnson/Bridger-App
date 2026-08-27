import { Accent } from './person';
import { Cover } from './cover';
import type { EventRecurrence } from './event-recurrence';

export type { EventRecurrence } from './event-recurrence';
export {
  assertRecurrence,
  formatRecurrenceLabel,
  normalizeRecurrence,
  isoWeekday
} from './event-recurrence';

export type EventRole = 'host' | 'going' | 'invited' | 'outsider';

/**
 * One Assignments line on an event. The host adds the label (e.g. "chips");
 * someone claims it (`assigneeId`). Checking it off (`done`) is separate from
 * claiming — the assignee or the host/co-host can mark done on the event page.
 */
export interface EventAssignment {
  id: string;
  label: string;
  /** person who claimed this item; unset = still open for anyone to snag */
  assigneeId?: string;
  /** checked off by the assignee or host — not set just because someone claimed it */
  done?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  emoji: string;
  /** falls back to a tiled `emoji` cover when unset */
  cover?: Cover;
  accent: Accent;
  day: string;
  time: string;
  place: string;
  /** the street address — only shown to people who are going or invited */
  address?: string;
  /**
   * People marked going. Empty for outsiders (shared-link viewers not on the
   * list) so locked events never leak a guest list.
   */
  goingIds: string[];
  invitedIds?: string[];
  hostId: string;
  /** people who can edit the event and see the host dashboard */
  coHostIds?: string[];
  role: EventRole;
  going?: boolean;
  /**
   * True when the viewer opened a shared link but is not on the invite list.
   * Prefer checking role === 'outsider'. Kept for older clients.
   */
  isOutsider?: boolean;
  /** "in 2 days" — the rough version, for screen readers and fallbacks */
  countdown?: string;
  /**
   * When it actually starts, as epoch milliseconds. With this the event shows a
   * live clock counting down to the second instead of a rounded-off label.
   */
  startsAt?: number;
  bio?: string;
  /** plain Venmo / Cash App handle — never processed by us */
  chipInHandle?: string;
  /** what the host is asking for, per person */
  chipInAmount?: string;
  /** how to send it, so nobody has to ask */
  chipInMethod?: 'Venmo' | 'Cash App' | 'PayPal' | 'Zelle' | 'Cash in person';
  /** why the host is asking, in their words */
  chipInNote?: string;
  allowFriendsToInvite?: boolean;
  /** default 35; beyond this is a paid expansion / co-op benefit */
  cap?: number;
  /**
   * Who invited each guest (personId → inviter personId). Missing / unset means
   * the host invited them. Host-only planning data — never shown to guests.
   * Powers "invited by Jade" / "brought by Sam" lines in the people sheet when
   * allowFriendsToInvite is on.
   */
  inviteByIds?: Record<string, string>;
  /**
   * @deprecated Prefer inviteByIds. Kept for older fixtures / clients: people
   * who joined via a friend's invite (bring-a-friend), not the host's list.
   */
  broughtIds?: string[];
  /** Host reminder: ping guests 2 days before */
  remindDay?: boolean;
  /** Host reminder: ping guests 2 hours before */
  remindHours?: boolean;
  /** Assignments sign-up list (optional) */
  assignments?: EventAssignment[];
  /** How this event repeats. Unset = one-off. */
  recurrence?: EventRecurrence;
  /** Short UI label, e.g. "Every Monday". */
  recurrenceLabel?: string;
}

export interface MeetSuggestion {
  personId: string;
  thread: string;
  status: 'going' | 'invited';
}

export interface Introduction {
  a: string;
  b: string;
  why: string;
}
