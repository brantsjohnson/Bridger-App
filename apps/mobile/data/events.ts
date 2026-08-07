// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Events tab needs: list your calendar, RSVP, create an event,
// update Assignments (assign / leave open / check off), and host edits.
// Demo mode keeps a copy of the fixtures in memory so taps feel real. Live
// mode calls the Nest events API — same function names either way.
// ============================================
import type {
  Cover,
  EventAssignment,
  EventItem,
  Introduction,
  MeetSuggestion
} from '@bridger/shared';
import { trackProduct } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { uploadMedia } from '../lib/media-upload';
import { pushNotification } from './feed';
import {
  EVENT_INTRODUCTIONS,
  EVENTS as FIXTURE_EVENTS,
  MEET_SUGGESTIONS as FIXTURE_MEET_SUGGESTIONS
} from './fixtures/catalog';

// A small pool of playful emoji used when a host skips the cover photo, so a
// new event still gets a face instead of a blank square.
const COVER_EMOJIS = ['🎉', '✨', '🌿', '🍜', '🎧', '🎬', '🏔️', '☕️', '🎨', '🍕'];
const DEFAULT_COVER_BG = '#7F77DD';

/** Pick a random emoji cover for events created without a photo. */
function randomEmojiCover(): Cover {
  const value = COVER_EMOJIS[Math.floor(Math.random() * COVER_EMOJIS.length)]!;
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
    broughtIds: e.broughtIds ? [...e.broughtIds] : undefined,
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
  return apiFetch<EventItem[]>('/events');
}

export type CreateEventInput = {
  title: string;
  bio?: string;
  /** YYYY-MM-DD for the API */
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
  chipInNote?: string;
  /** cover the host picked, or a random emoji if they skipped it */
  cover?: Cover | { kind: 'photo'; uri: string; bannerText?: string };
  /** the Assignments sign-up list */
  assignments?: EventAssignment[];
};

/** Create an event. Demo: prepends to the local list. Live: POST /events. */
export async function createEvent(input: CreateEventInput): Promise<EventItem> {
  const cover = input.cover ?? randomEmojiCover();

  if (isDemoMode()) {
    const event: EventItem = {
      id: `e-${Date.now()}`,
      title: input.title.trim() || 'Untitled',
      emoji: cover.kind === 'emoji' ? cover.value : '📸',
      cover: cover.kind === 'photo' && 'uri' in cover
        ? { kind: 'photo', url: cover.uri, bannerText: cover.bannerText }
        : (cover as Cover),
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
    demoEvents = [event, ...demoEvents];
    void scheduleAssignmentReminders(event.id);
    return cloneEvent(event);
  }

  // MEDIA EXCEPTION: upload cover photo bytes, then send mediaId to Nest.
  let coverPayload:
    | Cover
    | { kind: 'photo'; mediaId: string; bannerText?: string }
    | undefined;
  if (cover.kind === 'photo' && 'uri' in cover && cover.uri) {
    const mediaId = await uploadMedia(
      cover.uri,
      'photo',
      `events/tmp-${Date.now()}`
    );
    coverPayload = {
      kind: 'photo',
      mediaId,
      bannerText: cover.bannerText
    };
  } else if (cover.kind !== 'photo') {
    coverPayload = cover;
  } else if (cover.kind === 'photo' && 'url' in cover) {
    // Already a remote url cover — server expects mediaId; fall back to emoji.
    coverPayload = randomEmojiCover();
  }

  return apiFetch<EventItem>('/events', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      bio: input.bio,
      day: input.day,
      time: input.time,
      place: input.place,
      address: input.address,
      invitedIds: input.invitedIds,
      coHostIds: input.coHostIds,
      allowFriendsToInvite: input.allowFriendsToInvite,
      cap: input.cap,
      chipInAmount: input.chipInAmount,
      chipInMethod: input.chipInMethod,
      chipInHandle: input.chipInHandle,
      chipInNote: input.chipInNote,
      cover: coverPayload,
      assignments: (input.assignments ?? []).map((a) => ({ label: a.label }))
    })
  });
}

/** Open one event for the detail / share page. */
export async function getEvent(id: string): Promise<EventItem | null> {
  if (isDemoMode()) {
    const found = demoEvents.find((e) => e.id === id);
    return found ? cloneEvent(found) : null;
  }
  try {
    return await apiFetch<EventItem>(`/events/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
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
  return apiFetch<EventItem>(
    `/events/${encodeURIComponent(eventId)}/assignments/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId: personId ?? null })
    }
  );
}

/**
 * Mark an assignment done or not. Call from the UI when the current user is
 * the assignee or the host/co-host (hosts can check anyone's item off).
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
        assignments: e.assignments.map((a) =>
          a.id === itemId ? { ...a, done } : a
        )
      };
    });
    const updated = demoEvents.find((e) => e.id === eventId);
    return updated ? cloneEvent(updated) : null;
  }
  return apiFetch<EventItem>(
    `/events/${encodeURIComponent(eventId)}/assignments/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ done })
    }
  );
}

/**
 * Tell the host that someone snagged or dropped an assignment.
 * Live: the server inserts the notification from the assignment PATCH.
 */
export async function notifyHostAssignmentChange(
  eventId: string,
  itemId: string,
  action: 'snagged' | 'released'
): Promise<void> {
  if (isDemoMode()) {
    // eslint-disable-next-line no-console
    console.log('[events] host notify stub', { eventId, itemId, action });
  }
  // Live path: Nest notifies the host on assignment PATCH.
}

/**
 * Line up the "bring your thing" nudges for everyone with an assignment.
 * Stubbed until a reminder scheduler ships.
 */
export async function scheduleAssignmentReminders(eventId: string): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  // TODO: notifications module — schedule 1-day + 2-hour reminders per assignee
  void eventId;
}

/** RSVP on an invite. Demo updates local role; live POSTs the RSVP. */
export async function rsvpEvent(
  id: string,
  status: 'going' | 'cant',
  allergies?: { optIn?: boolean; text?: string }
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== id) return e;
      if (status === 'going') {
        const goingIds = e.goingIds.includes('me')
          ? e.goingIds
          : [...e.goingIds, 'me'];
        return { ...e, role: 'going' as const, goingIds, going: true };
      }
      return { ...e, role: 'invited' as const, going: false };
    });
    return demoEvents.find((e) => e.id === id) ?? null;
  }

  return apiFetch<EventItem>(`/events/${encodeURIComponent(id)}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      allergiesOptIn: allergies?.optIn,
      allergiesText: allergies?.text
    })
  });
}

/**
 * People at this event that Bridger thinks you should meet.
 * Demo uses fixtures; live prefers the async Nest path below.
 * Sync helper stays for Home widgets (live → empty until they await).
 */
export function meetSuggestionsForEvent(event: EventItem): MeetSuggestion[] {
  if (!isDemoMode()) return [];
  const atEvent = new Set([
    ...event.goingIds,
    ...(event.invitedIds ?? [])
  ]);
  // Drop yourself and the host from "people you should meet"
  atEvent.delete('me');
  atEvent.delete(event.hostId);
  return FIXTURE_MEET_SUGGESTIONS.filter((m) => atEvent.has(m.personId)).map((m) => ({
    ...m,
    status: event.goingIds.includes(m.personId) ? ('going' as const) : ('invited' as const)
  }));
}

/** Live Nest matching: FoF scored for this event. */
export async function fetchMeetSuggestionsForEvent(
  eventId: string
): Promise<MeetSuggestion[]> {
  if (isDemoMode()) return [];
  return apiFetch<MeetSuggestion[]>(
    `/events/${encodeURIComponent(eventId)}/meet-suggestions`
  );
}

/** Host Introductions: A & B · why, among invited + going. */
export function introductionsForEvent(event: EventItem): Introduction[] {
  if (!isDemoMode()) {
    // TODO: GET /events/:id/introductions when matching ships
    return [];
  }
  return (EVENT_INTRODUCTIONS[event.id] ?? []).map((row) => ({ ...row }));
}

/**
 * Demo: push "you should meet" pings to people in introduction pairs.
 * Live: Nest will fan out from matching when the event is published / updated.
 */
export async function notifyEventIntroductions(eventId: string): Promise<void> {
  if (!isDemoMode()) {
    // TODO: POST /events/:id/introductions/notify
    return;
  }
  const event = demoEvents.find((e) => e.id === eventId);
  if (!event) return;
  const pairs = introductionsForEvent(event);
  const seen = new Set<string>();
  for (const pair of pairs) {
    for (const personId of [pair.a, pair.b]) {
      if (seen.has(personId) || personId === 'me') continue;
      seen.add(personId);
      pushNotification({
        id: `intro-${eventId}-${personId}-${Date.now()}`,
        kind: 'event_introduction',
        personId,
        text: `Someone at ${event.title} you should meet`,
        time: 'Just now',
        unread: true,
        target: { eventId, personId }
      });
    }
  }
  if (seen.size > 0) {
    trackProduct('event_introduction_notified', { count: seen.size });
  }
}

/** Patch an event the host is editing. Demo mutates in memory. */
export type UpdateEventInput = Partial<
  Pick<
    EventItem,
    | 'title'
    | 'bio'
    | 'day'
    | 'time'
    | 'place'
    | 'address'
    | 'cover'
    | 'emoji'
    | 'chipInAmount'
    | 'chipInMethod'
    | 'chipInHandle'
    | 'chipInNote'
    | 'allowFriendsToInvite'
    | 'coHostIds'
    | 'assignments'
    | 'remindDay'
    | 'remindHours'
  >
>;

export async function updateEvent(
  eventId: string,
  patch: UpdateEventInput
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        ...patch,
        goingIds: [...e.goingIds],
        invitedIds: e.invitedIds ? [...e.invitedIds] : undefined,
        broughtIds: e.broughtIds ? [...e.broughtIds] : undefined,
        coHostIds: patch.coHostIds
          ? [...patch.coHostIds]
          : e.coHostIds
            ? [...e.coHostIds]
            : undefined,
        assignments: patch.assignments
          ? patch.assignments.map((a) => ({ ...a }))
          : e.assignments
            ? e.assignments.map((a) => ({ ...a }))
            : undefined
      };
    });
    const updated = demoEvents.find((e) => e.id === eventId);
    return updated ? cloneEvent(updated) : null;
  }
  return apiFetch<EventItem>(`/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}
