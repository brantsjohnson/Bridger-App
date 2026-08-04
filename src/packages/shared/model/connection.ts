import { Accent } from './person';

export type ConnectionSource = 'link' | 'qr' | 'request';

export interface Connection {
  id: string;
  personId: string;
  source: ConnectionSource;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  personId: string;
  /** the mutual friend this suggestion comes through */
  viaFriendId: string;
  /** the "why", human-readable — prefer the specific, surprising overlap */
  sharedThread: string;
  /** 2–3 short shared signals shown as chips */
  signals: string[];
  accent: Accent;
  /** invariant — never suggest someone who hasn't opted in */
  bothOptedIn: true;
}

export interface ApprovalRequest {
  id: string;
  personId: string;
  viaFriendId?: string;
  createdAt: string;
}

/**
 * How a connection began. Captured automatically where the app already knows
 * (an event, or the mutual friend who introduced you); optional and coarse
 * where it doesn't (a place). Shared by both people — either can edit or remove it.
 */
export type HowYouMetKind = 'event' | 'via' | 'place';

export interface HowYouMet {
  kind: HowYouMetKind;
  /** short label: "Game Night", "Priya", "RiNo, Denver" */
  label: string;
  /** display date the connection was made */
  date: string;
  /** the mutual friend, when an event connection also came through someone */
  viaName?: string;
  /** place records are approximate by design */
  approximate?: boolean;
}

/** Whether you'd already met before connecting — asked once, at the reveal. */
export type MeetContext = 'just-met' | 'already-know';

/**
 * Your private scratchpad on a person. Never visible to them.
 * `text` = a little thing to remember. `date` = something to be reminded about.
 */
export interface FriendNote {
  id: string;
  personId: string;
  kind: 'text' | 'date';
  body: string;
  /** date notes only */
  date?: string;
  /** date notes only — reminds 1 week before and on the day */
  remind?: boolean;
}

/** Home's "Coming up" — a friend's shared birthday, or one of your date notes. */
export interface UpcomingItem {
  id: string;
  kind: 'birthday' | 'note';
  label: string;
  when: string;
  personId: string;
}

export interface Commonality {
  key: string;
  label: string;
  strongest?: boolean;
}

/**
 * Someone broadcasting that they're free. Rich enough that a friend can decide
 * whether they want in without having to message and ask.
 */
export interface GrassSignal {
  id: string;
  personId: string;
  /** "Tonight", "Now", "Saturday" */
  when: string;
  /** the short version on the card */
  note?: string;
  /** what they actually want to do */
  what?: string;
  /** roughly where — a neighbourhood, never a street address */
  where?: string;
  /** who's already said yes */
  inIds?: string[];
  /** which circle they told */
  audience?: string;
  postedAt?: string;
}

/**
 * An inside joke: a quote on a sticky note. It can tag people and/or an event,
 * and it shares to everyone tagged plus everyone who was at that event. Tagging
 * a person also cross-posts it to their wall.
 */
export interface InsideJoke {
  id: string;
  text: string;
  /** who said it — the note is a quote of this person */
  quotedId?: string;
  fromName: string;
  /** who wrote it down */
  postedById?: string;
  postedAt?: string;
  accent: Accent;
  /** people tagged in it — it lands on their wall too */
  taggedIds?: string[];
  /** the event it happened at; everyone who was there sees it */
  eventName?: string;
}

/**
 * One line on someone's bucket list. Either a solo want ("Learn to surf") or
 * something to do with specific friends. Public or private, and checkable.
 */
export interface BucketItem {
  id: string;
  text: string;
  /** friends to do it with; empty means solo */
  withIds: string[];
  done: boolean;
  /** private items are yours alone, whatever your tiers say */
  isPrivate: boolean;
}

export interface DiscoverSettings {
  discoverable: boolean;
  sources: {
    aboutMe: boolean;
    onboardingQuiz: boolean;
    discoverMe: boolean;
  };
}