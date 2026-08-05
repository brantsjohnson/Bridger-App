// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes for the Weekly Recap Podcast. Everyone answers the same 5 short
// questions by voice; all answers stitch into one "podcast" you play on the
// Friends tab. As each person talks, their photo + name pop up.
//
// RETENTION (important):
// - Each recap answer lives for a ROLLING 7 days from when it was recorded.
// - You can only re-record once your own 7 days have passed.
// - Co-op members keep their recaps (archived to the Profile stories calendar);
//   non-members' audio is hard-deleted after 7 days.
// PRIVACY: listeners only hear answers shared with a tier they belong to.
// Mirrors guide-docs/RECAP-PODCAST.md.
// ============================================

import type { Tier } from './tier';

/** Who a recap answer is shared with (concentric tiers, like stories). */
export type RecapAudience = Extract<Tier, 'close' | 'friend' | 'acquaintance'>;

/** Where a week's question came from. */
export type RecapQuestionSource = 'admin' | 'submitted';

/** One week of recap questions (the same 5 for everyone). */
export interface RecapWeek {
  id: string;
  /** Human label, e.g. "Week of 27 Jul". */
  weekOf: string;
  /** The 5 prompts, in order. */
  questions: string[];
  /** True while this is the live week people record into. */
  active?: boolean;
}

/** One prompt inside a week (admin-set or drawn from a submitted question). */
export interface RecapQuestion {
  id: string;
  weekId: string;
  /** 0-4 position in the roundtable. */
  index: number;
  text: string;
  source: RecapQuestionSource;
  /** Present when the prompt came from a friend's submission. */
  authorId?: string;
}

/** A question a friend suggested for a future week (with upvotes). */
export interface SubmittedQuestion {
  id: string;
  text: string;
  authorId: string;
  votes: number;
  /** True once this has been pulled into a live week. */
  used?: boolean;
}

/**
 * One person's recorded answer to one question. Audio is recorded in-app and
 * stored as media; the client receives a short-lived signed URL, never a path.
 */
export interface RecapAnswer {
  id: string;
  weekId: string;
  authorId: string;
  /** 0-4, matches the question order. */
  questionIndex: number;
  /** Signed, expiring URL to the recorded clip (~20s). */
  audioUrl: string;
  /** Clip length in seconds, for the scrubber + progress. */
  duration: number;
  visibleToTier: RecapAudience;
  createdAt: string;
  /** When this clip stops being listenable (createdAt + 7 days). */
  expiresAt?: string;
}

/**
 * The client-safe playlist for the player: answers grouped so you hear the
 * whole group on Q1, then Q2, and so on. Already tier-filtered by the server.
 */
export interface RecapPlaylist {
  week: RecapWeek;
  /** Roundtable order: everyone's Q1, then everyone's Q2, and so on. */
  clips: RecapAnswer[];
  /** Unique author ids included this rolling week ("In this week"). */
  voiceIds: string[];
}

/** Summary for the Friend Pod entry card (voices + length this week). */
export interface RecapSummaryDTO {
  week: RecapWeek;
  voiceIds: string[];
  /** Total audio length in whole minutes. */
  minutes: number;
  questionCount: number;
  /** True if the signed-in user still has an active (unexpired) recap. */
  hasMineThisWeek: boolean;
  /** ISO time the user may record again (null = can record now). */
  canRecordAfter?: string | null;
}
