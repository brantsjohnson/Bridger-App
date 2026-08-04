// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Events tab needs: list your calendar, RSVP, create an event.
// Demo mode keeps a copy of the fixtures in memory so taps feel real. Live
// mode will call the Nest events API — same function names either way.
// ============================================
import type { EventItem } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { EVENTS as FIXTURE_EVENTS } from './fixtures/catalog';

/** In-memory calendar for demo mode (so create / RSVP stick for the session). */
let demoEvents: EventItem[] = FIXTURE_EVENTS.map((e) => ({ ...e, goingIds: [...e.goingIds] }));

function cloneEvents(): EventItem[] {
  return demoEvents.map((e) => ({
    ...e,
    goingIds: [...e.goingIds],
    invitedIds: e.invitedIds ? [...e.invitedIds] : undefined
  }));
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
  bring?: string;
  invitedIds?: string[];
  allowFriendsToInvite?: boolean;
  chipInAmount?: string;
  chipInMethod?: EventItem['chipInMethod'];
  chipInHandle?: string;
};

/** Create an event. Demo: prepends to the local list. Live: POST /events. */
export async function createEvent(input: CreateEventInput): Promise<EventItem> {
  const event: EventItem = {
    id: `e-${Date.now()}`,
    title: input.title.trim() || 'Untitled',
    emoji: '✏️',
    cover: { kind: 'emoji', value: '✏️' },
    accent: 'purple',
    day: input.day,
    time: input.time,
    place: input.place,
    address: input.address,
    bring: input.bring,
    bio: input.bio,
    goingIds: ['me'],
    invitedIds: input.invitedIds ?? [],
    hostId: 'me',
    role: 'host',
    countdown: 'soon',
    cap: 35,
    allowFriendsToInvite: input.allowFriendsToInvite,
    chipInAmount: input.chipInAmount,
    chipInMethod: input.chipInMethod,
    chipInHandle: input.chipInHandle
  };

  if (isDemoMode()) {
    demoEvents = [event, ...demoEvents];
    return { ...event, goingIds: [...event.goingIds] };
  }

  // TODO: POST /events
  return event;
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
