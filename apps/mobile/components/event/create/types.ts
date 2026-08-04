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
  day: string;
  time: string;
  place: string;
  address: string;
  /** one optional co-host (they can edit + their acquaintances join the pool) */
  coHostId?: string;
  bring: string;
  chipInAmount: string;
  chipInMethod: string;
  chipInHandle: string;
  allowFriendsToInvite: boolean;
  invitedIds: string[];
  /** photo the host picked; unset means "use a random emoji at create time" */
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

/** A fresh draft with friendly defaults so the form is never blank/broken. */
export function emptyDraft(): CreateEventDraft {
  return {
    title: '',
    bio: '',
    day: 'Fri 31 Jul',
    time: '18:30',
    place: '',
    address: '',
    coHostId: undefined,
    bring: '',
    chipInAmount: '',
    chipInMethod: '',
    chipInHandle: '',
    allowFriendsToInvite: true,
    invitedIds: [],
    cover: undefined,
    assignments: []
  };
}
