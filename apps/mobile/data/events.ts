// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Events tab needs: list your calendar, RSVP, create an event,
// and update Assignments (snag / remove / check off). Demo mode keeps a copy
// of the fixtures in memory so taps feel real. Live mode will call the Nest
// events API — same function names either way.
// ============================================
import type { Cover, EventAssignment, EventItem, MeetSuggestion } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  EVENTS as FIXTURE_EVENTS,
  MEET_SUGGESTIONS as FIXTURE_MEET_SUGGESTIONS
} from './fixtures/catalog';

// A small pool of playful emoji used when a host skips the cover photo, so a
// new event still gets a face instead of a blank square.
const COVER_EMOJIS = ['🎉', '✨', '🌿', '🍜', '🎧', '🎬', '🏔️', '☕️', '🎨', '🍕'];
const DEFAULT_COVER_BG = '#7F77DD';

/** Pick a random emoji cover for events created without a photo. */
function randomEmojiCover(): Cover {
  const value = COVER_EMOJIS[Math.floor(Math.random() * COVER_EMOJIS.length)];
  return { kind: 'emoji', value, bg: DEFAULT_COVER_BG };
}

/**
 * Give a demo event a real start time so the countdown can actually tick.
 * The fixtures only say "in 2 days", so we read the number out of that and add
 * the event's clock time on top. Real events will come from the API with a
 * proper timestamp and this never runs.
 */
function demoStartsAt(e: EventItem): number | undefined {
  if (e.startsAt) return e.startsAt;
  const days = Number(/in (\d+) day/.exec(e.countdown ?? '')?.[1]);
  if (!Number.isFinite(days)) return undefined;

  const when = new Date();
  when.setDate(when.getDate() + days);
  const [h, m] = (e.time ?? '18:00').split(':').map(Number);
  when.setHours(Number.isFinite(h) ? h : 18, Number.isFinite(m) ? m : 0, 0, 0);
  return when.getTime();
}

/** In-memory calendar for demo mode (so create / RSVP stick for the session). */
let demoEvents: EventItem[] = FIXTURE_EVENTS.map((e) => ({
  ...e,
  goingIds: [...e.goingIds],
  startsAt: demoStartsAt(e)
}));

function cloneEvent(e: EventItem): EventItem {
  return {
    ...e,
    goingIds: [...e.goingIds],
    invitedIds: e.invitedIds ? [...e.invitedIds] : undefined,
    coHostIds: e.coHostIds ? [...e.coHostIds] : undefined,
    assignments: e.assignments ? e.assignments.map((a) => ({ ...a })) : undefined
  };
}

function cloneEvents(): EventItem[] {
  return demoEvents.map(cloneEvent);
}

/** Load the Events list (Hosting / Going / Invited sections filter by role). */
export async function listEvents(): Promise<EventItem[]> {
  if (isDemoMode()) {
    return cloneEvents();
  }
  // TODO: GET /events
  return [];
}

export type CreateEventInput = {
  title: string;
  bio?: string;
  day: string;
  time: string;
  place: string;
  address?: string;
  invitedIds?: string[];
  coHostIds?: string[];
  allowFriendsToInvite?: boolean;
  /** max guests (used when friends can invite friends) */
  cap?: number;
  chipInAmount?: string;
  chipInMethod?: EventItem['chipInMethod'];
  chipInHandle?: string;
  /** cover the host picked, or a random emoji if they skipped it */
  cover?: Cover;
  /** the Assignments sign-up list */
  assignments?: EventAssignment[];
};

/** Create an event. Demo: prepends to the local list. Live: POST /events. */
export async function createEvent(input: CreateEventInput): Promise<EventItem> {
  const cover = input.cover ?? randomEmojiCover();
  const event: EventItem = {
    id: `e-${Date.now()}`,
    title: input.title.trim() || 'Untitled',
    // Keep a plain emoji around for tiny list chips; the cover drives big art.
    emoji: cover.kind === 'emoji' ? cover.value : '📸',
    cover,
    accent: 'purple',
    day: input.day,
    time: input.time,
    place: input.place,
    address: input.address,
    bio: input.bio,
    goingIds: ['me'],
    invitedIds: input.invitedIds ?? [],
    coHostIds: input.coHostIds ?? [],
    hostId: 'me',
    role: 'host',
    countdown: 'soon',
    cap: input.cap ?? 35,
    allowFriendsToInvite: input.allowFriendsToInvite,
    chipInAmount: input.chipInAmount,
    chipInMethod: input.chipInMethod,
    chipInHandle: input.chipInHandle,
    assignments: input.assignments ?? []
  };

  if (isDemoMode()) {
    demoEvents = [event, ...demoEvents];
    // Anyone assigned an item gets nudged before the event (see stub below).
    void scheduleAssignmentReminders(event.id);
    return cloneEvent(event);
  }

  // TODO: POST /events (body is the CreateEventInput; server assigns id + host).
  //       New assignments table needs an RLS policy so only attendees can read
  //       it and only host / assignee can change a row (DATA.md).
  return event;
}

/** Open one event for the detail / share page. */
export async function getEvent(id: string): Promise<EventItem | null> {
  if (isDemoMode()) {
    const found = demoEvents.find((e) => e.id === id);
    return found ? cloneEvent(found) : null;
  }
  // TODO: GET /events/:id
  return null;
}

/**
 * Claim (or clear) one assignment for a person. Passing no personId opens the
 * item back up. Demo mutates in memory; live PATCHes the assignment row.
 */
export async function assignItem(
  eventId: string,
  itemId: string,
  personId?: string
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== eventId || !e.assignments) return e;
      return {
        ...e,
        assignments: e.assignments.map((a) =>
          a.id === itemId
            ? { ...a, assigneeId: personId, done: personId ? a.done : false }
            : a
        )
      };
    });
    if (personId) void scheduleAssignmentReminders(eventId);
    const updated = demoEvents.find((e) => e.id === eventId);
    return updated ? cloneEvent(updated) : null;
  }
  // TODO: PATCH /events/:id/assignments/:itemId { assigneeId }
  return null;
}

/**
 * Mark an assignment done or not. Only the assignee should call this from the UI.
 */
export async function setAssignmentDone(
  eventId: string,
  itemId: string,
  done: boolean
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== eventId || !e.assignments) return e;
      return {
        ...e,
        assignments: e.assignments.map((a) => (a.id === itemId ? { ...a, done } : a))
      };
    });
    const updated = demoEvents.find((e) => e.id === eventId);
    return updated ? cloneEvent(updated) : null;
  }
  // TODO: PATCH /events/:id/assignments/:itemId { done }
  return null;
}

/**
 * Tell the host that someone snagged or dropped an assignment.
 * Stub only — real push/email comes from the notifications module later.
 */
export async function notifyHostAssignmentChange(
  eventId: string,
  itemId: string,
  action: 'snagged' | 'released'
): Promise<void> {
  // TODO: notifications module — alert the host that an assignment changed.
  if (isDemoMode()) {
    // eslint-disable-next-line no-console
    console.log('[events] host notify stub', { eventId, itemId, action });
  }
}

/**
 * Line up the "bring your thing" nudges for everyone with an assignment:
 * one a day before and one 2 hours before, matching the event reminder rules
 * in EVENTS.md. Stubbed in demo — no real notifications are scheduled yet.
 */
export async function scheduleAssignmentReminders(eventId: string): Promise<void> {
  if (isDemoMode()) {
    // Demo no-op: real scheduling happens server-side.
    return;
  }
  // TODO: notifications module — schedule 1-day + 2-hour reminders per assignee
  //       (server-side; client never holds the schedule).
}

/** RSVP on an invite. Demo updates local role; live PATCHes the event. */
export async function rsvpEvent(
  id: string,
  status: 'going' | 'cant'
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== id) return e;
      if (status === 'going') {
        const goingIds = e.goingIds.includes('me') ? e.goingIds : [...e.goingIds, 'me'];
        return { ...e, role: 'going' as const, goingIds, going: true };
      }
      return { ...e, role: 'invited' as const, going: false };
    });
    return demoEvents.find((e) => e.id === id) ?? null;
  }

  // TODO: POST /events/:id/rsvp
  return null;
}

/**
 * People at this event that Bridger thinks you should meet (not already in
 * your book). Used on the Home next-event tile beside friends who are going.
 * PRIVACY: never includes blocked people; demo list is fixture-only.
 */
export function meetSuggestionsForEvent(event: EventItem): MeetSuggestion[] {
  if (!isDemoMode()) {
    // TODO: GET /events/:id/meet-suggestions
    return [];
  }
  const atEvent = new Set([
    ...event.goingIds,
    ...(event.invitedIds ?? []),
    event.hostId
  ]);
  // Skip anyone already counted as a friend going (you already know them).
  const friendGoing = new Set(event.goingIds);
  return FIXTURE_MEET_SUGGESTIONS.filter(
    (m) => atEvent.has(m.personId) && !friendGoing.has(m.personId)
  );
}
