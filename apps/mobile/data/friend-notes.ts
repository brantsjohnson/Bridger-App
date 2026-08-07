// ============================================
// WHAT THIS FILE DOES (plain English):
// Your private notes on a friend's profile — little reminders, calendar dates,
// and soft "check in sometimes" nudges. Only you can see these. Demo mode
// keeps them in memory; live mode hits GET/POST/DELETE /me/notes.
// Also builds Home Coming up rows and fires due check-in notifications.
// PRIVACY: author-only. Never show note text in analytics.
// ============================================
import type {
  AppNotification,
  FriendNote,
  FriendNoteCadence,
  UpcomingItem
} from '@bridger/shared';
import { trackProduct } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { personById } from './people';

/** Seed notes for Jade (maya) so the friend profile isn't empty in demo. */
const SEED: FriendNote[] = [
  { id: 'n1', personId: 'maya', kind: 'text', body: 'Loves horror movies' },
  {
    id: 'n2',
    personId: 'maya',
    kind: 'date',
    body: 'Graduation',
    date: '2026-08-12',
    remind: true
  },
  { id: 'n3', personId: 'maya', kind: 'text', body: 'Allergic to peanuts' },
  {
    id: 'n4',
    personId: 'maya',
    kind: 'check_in',
    body: 'Ask about the new job',
    cadence: 'biweek',
    nextRemindAt: new Date(0).toISOString()
  }
];

/** In-session demo store (mutated by add/delete). */
let demoNotes: FriendNote[] | null = null;

function store(): FriendNote[] {
  if (!demoNotes) demoNotes = SEED.map((n) => ({ ...n }));
  return demoNotes;
}

function cadenceDays(c: FriendNoteCadence): number {
  if (c === 'week') return 7;
  if (c === 'month') return 30;
  return 14;
}

export function nextRemindAfter(cadence: FriendNoteCadence, from = new Date()): string {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + cadenceDays(cadence));
  return d.toISOString();
}

export function cadenceLabel(c: FriendNoteCadence): string {
  if (c === 'week') return 'Weekly';
  if (c === 'month') return 'Monthly';
  return 'Every 2 weeks';
}

function formatDateLabel(date?: string): string {
  if (!date) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}`;
}

function whenForDate(date: string): { when: string; daysUntil: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return { when: 'soon', daysUntil: 14 };
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0 || diffDays > 7) return null;
  if (diffDays === 0) return { when: 'Today', daysUntil: 0 };
  if (diffDays === 1) return { when: 'Tomorrow', daysUntil: 1 };
  return { when: `in ${diffDays} days`, daysUntil: diffDays };
}

function firstName(personId: string): string {
  return personById(personId).name.split(' ')[0] ?? 'them';
}

/** List your private notes for one friend. */
export async function listFriendNotes(personId: string): Promise<FriendNote[]> {
  if (isDemoMode()) {
    return store().filter((n) => n.personId === personId);
  }
  return apiFetch<FriendNote[]>(
    `/me/notes?personId=${encodeURIComponent(personId)}`
  );
}

export type AddFriendNoteInput = {
  personId: string;
  kind: FriendNote['kind'];
  body: string;
  date?: string;
  cadence?: FriendNoteCadence;
};

/** Add a note / date / check-in. Emits friend_note_added (no body text). */
export async function addFriendNote(input: AddFriendNoteInput): Promise<FriendNote> {
  const body = input.body.trim();
  if (!body) throw new Error('Note text is required');

  if (isDemoMode()) {
    const note: FriendNote = {
      id: `n-${Date.now()}`,
      personId: input.personId,
      kind: input.kind,
      body,
      date: input.kind === 'date' ? input.date?.trim() || body : undefined,
      remind: input.kind === 'date',
      cadence: input.kind === 'check_in' ? input.cadence ?? 'biweek' : undefined,
      nextRemindAt:
        input.kind === 'check_in'
          ? nextRemindAfter(input.cadence ?? 'biweek')
          : undefined
    };
    store().unshift(note);
    trackProduct('friend_note_added', { kind: note.kind, cadence: note.cadence });
    return note;
  }

  const note = await apiFetch<FriendNote>('/me/notes', {
    method: 'POST',
    body: JSON.stringify({
      personId: input.personId,
      kind: input.kind,
      text: body,
      date: input.kind === 'date' ? input.date?.trim() || body : undefined,
      remind: input.kind === 'date',
      cadence: input.kind === 'check_in' ? input.cadence ?? 'biweek' : undefined
    })
  });
  trackProduct('friend_note_added', { kind: note.kind, cadence: note.cadence });
  return note;
}

/** Hard-delete one of your notes. Emits friend_note_deleted (no body text). */
export async function deleteFriendNote(id: string): Promise<void> {
  if (isDemoMode()) {
    const list = store();
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) list.splice(idx, 1);
  } else {
    await apiFetch(`/me/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  trackProduct('friend_note_deleted', {});
}

/**
 * Coming up rows from your date notes (within a week) and due check-ins.
 * Demo uses the in-memory store; live Coming-up comes from /feed/coming-up.
 */
export function upcomingFromFriendNotes(): UpcomingItem[] {
  if (!isDemoMode()) return [];
  const out: UpcomingItem[] = [];
  const now = Date.now();

  for (const n of store()) {
    if (n.kind === 'date' && n.remind && n.date) {
      const timing = whenForDate(n.date);
      if (!timing) continue;
      const name = firstName(n.personId);
      out.push({
        id: `note-${n.id}`,
        kind: 'note',
        label: `${name}'s ${n.body}`,
        when: timing.when,
        daysUntil: timing.daysUntil,
        personId: n.personId
      });
    }
    if (n.kind === 'check_in' && n.nextRemindAt) {
      const due = new Date(n.nextRemindAt).getTime() <= now;
      if (!due) continue;
      const name = firstName(n.personId);
      out.push({
        id: `checkin-${n.id}`,
        kind: 'check_in',
        label: `Check in with ${name}?`,
        when: 'now',
        daysUntil: -0.5,
        personId: n.personId
      });
    }
  }
  return out;
}

export async function fireDueCheckInReminders(): Promise<void> {
  if (!isDemoMode()) return;

  const now = new Date();
  for (const n of store()) {
    if (n.kind !== 'check_in' || !n.nextRemindAt || !n.cadence) continue;
    if (new Date(n.nextRemindAt).getTime() > now.getTime()) continue;

    const name = firstName(n.personId);
    const item: AppNotification = {
      id: `checkin-n-${n.id}-${now.getTime()}`,
      kind: 'friend_check_in',
      personId: n.personId,
      text: `Check in with ${name}?`,
      time: 'now',
      createdAt: now.toISOString(),
      unread: true,
      target: { personId: n.personId }
    };
    const { pushNotification } = await import('./feed');
    pushNotification(item);

    n.nextRemindAt = nextRemindAfter(n.cadence, now);
    trackProduct('friend_check_in_reminded', { cadence: n.cadence });
  }
}

export function friendNoteDateLabel(note: FriendNote): string {
  return formatDateLabel(note.date);
}
