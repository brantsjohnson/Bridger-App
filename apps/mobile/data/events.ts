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
import { formatRecurrenceLabel, trackProduct } from '@bridger/shared';
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
let demoEvents: EventItem[] = [
  ...FIXTURE_EVENTS.map((e) => ({
    ...e,
    goingIds: [...e.goingIds],
    startsAt: demoStartsAt(e)
  })),
  // Demo-only live party so mid-event capture nudges can be tested.
  {
    id: 'e-live',
    title: 'House hang',
    emoji: '🎉',
    cover: { kind: 'emoji', value: '🎉', bg: '#7F77DD' },
    accent: 'purple',
    day: 'Tonight',
    time: '20:00',
    place: "Maya's",
    address: '42 Oak St',
    bio: 'Chill night — snacks, music, and mems.',
    goingIds: ['maya', 'kit', 'me'],
    invitedIds: ['devon'],
    hostId: 'maya',
    role: 'going',
    going: true,
    startsAt: Date.now() - 45 * 60 * 1000,
    cap: 35
  }
];

function cloneEvent(e: EventItem): EventItem {
  return {
    ...e,
    goingIds: [...e.goingIds],
    invitedIds: e.invitedIds ? [...e.invitedIds] : undefined,
    inviteByIds: e.inviteByIds ? { ...e.inviteByIds } : undefined,
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

/**
 * Upcoming rows for a profile card (PROFILE.md §6).
 * Own page (subjectId omitted or "me"): events you are hosting or going to.
 * Friend page: events you are invited to where the subject is hosting or going.
 */
export async function listUpcomingForProfile(subjectId?: string): Promise<
  Array<{ id: string; title: string; whenLabel: string; rsvpLabel?: string }>
> {
  const me = 'me';
  const subject = subjectId && subjectId !== me ? subjectId : me;

  const toRow = (e: EventItem) => ({
    id: e.id,
    title: e.title,
    whenLabel: [e.day, e.time].filter(Boolean).join(' · ') || e.countdown || 'Soon',
    rsvpLabel:
      e.role === 'host'
        ? 'Hosting'
        : e.role === 'going'
          ? 'Going'
          : e.role === 'invited'
            ? 'Invited'
            : undefined
  });

  if (!isDemoMode()) {
    const rows = await apiFetch<EventItem[]>(
      `/events/upcoming-with/${encodeURIComponent(subject === me ? 'me' : subject)}`
    );
    return rows.map(toRow);
  }

  const events = await listEvents();
  const isOwn = subject === me;
  const filtered = events.filter((e) => {
    if (isOwn) {
      return (
        e.role === 'host' ||
        e.role === 'going' ||
        e.hostId === me ||
        e.goingIds.includes(me)
      );
    }
    const viewerOnEvent =
      e.hostId === me ||
      e.goingIds.includes(me) ||
      (e.invitedIds ?? []).includes(me) ||
      e.role === 'host' ||
      e.role === 'going' ||
      e.role === 'invited';
    const subjectOnEvent = e.hostId === subject || e.goingIds.includes(subject);
    return viewerOnEvent && subjectOnEvent;
  });

  return filtered.map(toRow);
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
  /** Repeat rule, or null for a one-off */
  recurrence?: EventItem['recurrence'] | null;
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
      inviteByIds: {},
      coHostIds: input.coHostIds ?? [],
      hostId: 'me',
      role: 'host',
      countdown: 'soon',
      cap: input.cap ?? 35,
      allowFriendsToInvite: input.allowFriendsToInvite,
      chipInAmount: input.chipInAmount,
      chipInMethod: input.chipInMethod,
      chipInHandle: input.chipInHandle,
      assignments: input.assignments ?? [],
      recurrence: input.recurrence ?? undefined,
      recurrenceLabel: input.recurrence
        ? formatRecurrenceLabel(input.recurrence)
        : undefined
    };
    demoEvents = [event, ...demoEvents];
    void scheduleAssignmentReminders(event.id);
    // OUTCOME: each host invite is a confirmed guest invite (never names).
    for (const _id of input.invitedIds ?? []) {
      trackProduct('event_guest_invited', { via: 'host' });
    }
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

  const created = await apiFetch<EventItem>('/events', {
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
      assignments: (input.assignments ?? []).map((a) => ({ label: a.label })),
      recurrence: input.recurrence ?? null
    })
  });
  // OUTCOME: each host invite confirmed by the server (never names).
  for (const _id of input.invitedIds ?? []) {
    trackProduct('event_guest_invited', { via: 'host' });
  }
  return created;
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
 * Invite more people to an event. Host invites have no invited_by tag.
 * When friends-can-invite is on, a going attendee can invite too — those rows
 * store the inviter so the host list can say "invited by Jade" / "brought by Sam".
 * OUTCOME: fires event_guest_invited per new guest (via host|attendee, never names).
 */
export async function inviteGuests(
  eventId: string,
  userIds: string[]
): Promise<EventItem | null> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return getEvent(eventId);

  if (isDemoMode()) {
    const me = 'me';
    const event = demoEvents.find((e) => e.id === eventId);
    if (!event) return null;
    const isHost = event.hostId === me || (event.coHostIds ?? []).includes(me);
    const isGoing = event.goingIds.includes(me) || isHost;
    if (!isGoing) return cloneEvent(event);
    if (!isHost && !event.allowFriendsToInvite) return cloneEvent(event);

    const invited = new Set(event.invitedIds ?? []);
    const inviteBy = { ...(event.inviteByIds ?? {}) };
    let added = 0;
    for (const id of ids) {
      if (id === me || id === event.hostId) continue;
      if (invited.has(id) || event.goingIds.includes(id)) continue;
      invited.add(id);
      if (!isHost) inviteBy[id] = me;
      added += 1;
      trackProduct('event_guest_invited', { via: isHost ? 'host' : 'attendee' });
    }
    if (added === 0) return cloneEvent(event);
    demoEvents = demoEvents.map((e) =>
      e.id === eventId
        ? {
            ...e,
            invitedIds: [...invited],
            inviteByIds: inviteBy
          }
        : e
    );
    const updated = demoEvents.find((e) => e.id === eventId);
    return updated ? cloneEvent(updated) : null;
  }

  const before = await getEvent(eventId);
  const updated = await apiFetch<EventItem>(
    `/events/${encodeURIComponent(eventId)}/invite`,
    {
      method: 'POST',
      body: JSON.stringify({ userIds: ids })
    }
  );
  // OUTCOME: confirmed invites only (never names). Hosts can diff invitedIds;
  // attendees do not receive the invite list, so we count requested ids as
  // attendee invites after a successful write.
  if (updated.role === 'host') {
    const prior = new Set(before?.invitedIds ?? []);
    for (const id of updated.invitedIds ?? []) {
      if (prior.has(id)) continue;
      trackProduct('event_guest_invited', {
        via: updated.inviteByIds?.[id] ? 'attendee' : 'host'
      });
    }
  } else {
    for (const _id of ids) {
      trackProduct('event_guest_invited', { via: 'attendee' });
    }
  }
  return updated;
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

/** RSVP on an invite (or open join when friends-can-invite). Demo updates local role. */
export async function rsvpEvent(
  id: string,
  status: 'going' | 'cant',
  allergies?: { optIn?: boolean; text?: string }
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== id) return e;
      if (status === 'going') {
        // Outsider can only join when the host allowed friends to invite.
        if (e.role === 'outsider' && !e.allowFriendsToInvite) return e;
        const goingIds = e.goingIds.includes('me')
          ? e.goingIds
          : [...e.goingIds, 'me'];
        return {
          ...e,
          role: 'going' as const,
          goingIds,
          going: true,
          isOutsider: false
        };
      }
      // Can't make it — leave the list of people going.
      const goingIds = e.goingIds.filter((pid) => pid !== 'me');
      return {
        ...e,
        role: e.role === 'outsider' ? ('outsider' as const) : ('invited' as const),
        goingIds,
        going: false
      };
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
> & {
  /** Repeat rule; null clears back to a one-off */
  recurrence?: EventItem['recurrence'] | null;
};

export async function updateEvent(
  eventId: string,
  patch: UpdateEventInput
): Promise<EventItem | null> {
  if (isDemoMode()) {
    demoEvents = demoEvents.map((e) => {
      if (e.id !== eventId) return e;
      const nextRecurrence =
        'recurrence' in patch ? patch.recurrence : e.recurrence;
      return {
        ...e,
        ...patch,
        goingIds: [...e.goingIds],
        invitedIds: e.invitedIds ? [...e.invitedIds] : undefined,
        inviteByIds: e.inviteByIds ? { ...e.inviteByIds } : undefined,
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
            : undefined,
        recurrence: nextRecurrence ?? undefined,
        recurrenceLabel: nextRecurrence
          ? formatRecurrenceLabel(nextRecurrence)
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
