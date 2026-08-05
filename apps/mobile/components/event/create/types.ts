// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared "draft" for the Create-event wizard. All four steps read and
// write this one object as you move Details -> Invite -> Photo & Assignments
// -> Preview, so nothing is lost between screens. Also lists the step order
// and a starter draft with sensible defaults.
// ============================================
import type { Cover, EventAssignment } from '@bridger/shared';

/** Everything the wizard collects before it becomes a real event. */
export type CreateEventDraft = {
  title: string;
  bio: string;
  /** human-readable day label shown in the UI (e.g. "Fri, Jul 31") */
  day: string;
  /** ISO date YYYY-MM-DD for the calendar picker */
  dayIso: string;
  time: string;
  /** short spot name — filled from address lookup when a suggestion is picked */
  place: string;
  address: string;
  /** one or more co-hosts (they can edit + their acquaintances join suggestions) */
  coHostIds: string[];
  /** whether the co-host picker is open on the Details step */
  addCoHosts: boolean;
  /** whether the chip-in card is expanded */
  chipInEnabled: boolean;
  chipInAmount: string;
  chipInMethod: string;
  chipInHandle: string;
  allowFriendsToInvite: boolean;
  /** max guests when friends can invite friends; default 35 */
  guestCap: number;
  invitedIds: string[];
  /** cover the host picked; unset means "use a random emoji at create time" */
  cover?: Cover;
  assignments: EventAssignment[];
};

/** The four steps, in order. Used for the progress dots + analytics step names. */
export const STEPS = ['details', 'invite', 'extras', 'preview'] as const;
export type StepName = (typeof STEPS)[number];

/** Human labels shown at the top of each step. */
export const STEP_TITLES: Record<StepName, string> = {
  details: 'Event details',
  invite: 'Who to invite',
  extras: 'Photo & sign-ups',
  preview: 'Preview'
};

/** Friendly default day = today, as ISO + readable label. */
function defaultDay(): { day: string; dayIso: string } {
  const d = new Date();
  const dayIso = d.toISOString().slice(0, 10);
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(d);
  return { day, dayIso };
}

/** A fresh draft with friendly defaults so the form is never blank/broken. */
export function emptyDraft(): CreateEventDraft {
  const { day, dayIso } = defaultDay();
  return {
    title: '',
    bio: '',
    day,
    dayIso,
    time: '18:30',
    place: '',
    address: '',
    coHostIds: [],
    addCoHosts: false,
    chipInEnabled: false,
    chipInAmount: '',
    chipInMethod: '',
    chipInHandle: '',
    allowFriendsToInvite: true,
    guestCap: 35,
    invitedIds: [],
    cover: undefined,
    assignments: []
  };
}
