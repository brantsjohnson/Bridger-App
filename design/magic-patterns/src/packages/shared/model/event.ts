import { Accent } from './person';
import { Cover } from './cover';

export type EventRole = 'host' | 'going' | 'invited' | 'outsider';

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
  /** Who invited whom (missing = the host). Host planning only. */
  inviteByIds?: Record<string, string>;
  hostId: string;
  /** people who can edit the event and see the host dashboard */
  coHostIds?: string[];
  role: EventRole;
  going?: boolean;
  /** "in 2 days" */
  countdown?: string;
  bio?: string;
  bring?: string;
  /** plain Venmo / Cash App handle — never processed by us */
  chipInHandle?: string;
  /** what the host is asking for, per person */
  chipInAmount?: string;
  /** how to send it, so nobody has to ask */
  chipInMethod?: 'Venmo' | 'Cash App' | 'PayPal' | 'Zelle' | 'Cash in person';
  /** why the host is asking, in their words */
  chipInNote?: string;
  allowFriendsToInvite?: boolean;
  /** default 35; beyond this is a paid expansion */
  cap?: number;
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