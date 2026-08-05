import { Accent } from './person';
import { Cover } from './cover';

export type EventRole = 'host' | 'going' | 'invited';

/**
 * One Assignments line on an event. The host adds the label (e.g. "chips");
 * someone claims it (`assigneeId`). Checking it off (`done`) is separate from
 * claiming — only the assignee can mark done on the event page.
 */
export interface EventAssignment {
  id: string;
  label: string;
  /** person who claimed this item; unset = still open for anyone to snag */
  assigneeId?: string;
  /** checked off by the assignee only — not set just because someone claimed it */
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
  goingIds: string[];
  invitedIds?: string[];
  hostId: string;
  /** people who can edit the event and see the host dashboard */
  coHostIds?: string[];
  role: EventRole;
  going?: boolean;
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
   * People who joined via a friend's invite (bring-a-friend), not the host's
   * original invite list. Host-only planning count — never shown to guests.
   */
  broughtIds?: string[];
  /** Host reminder: ping guests 2 days before */
  remindDay?: boolean;
  /** Host reminder: ping guests 2 hours before */
  remindHours?: boolean;
  /** Assignments sign-up list (optional) */
  assignments?: EventAssignment[];
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
