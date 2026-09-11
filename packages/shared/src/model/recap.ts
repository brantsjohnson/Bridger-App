// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes for the Weekly Recap Podcast. Everyone answers the same 5 short
// questions by voice; all answers stitch into one "podcast" you play on the
// Friends tab. As each person talks, their photo + name pop up.
//
// RETENTION (important):
// - Each recap answer lives for a ROLLING 7 days from when it was recorded.
// - You can only re-record once your own 7 days have passed.
// - Co-op members keep their recaps (archived to the Profile stories calendar)
//   and can open earlier locked weeks in the player. Non-members stay on
//   this week; their audio is hard-deleted after 7 days.
// PRIVACY: listeners only hear answers shared with a tier they belong to.
// Mirrors guide-docs/complete/RECAP-PODCAST.md.
// ============================================

import type { Tier } from './tier';

/** Who a recap answer is shared with (concentric tiers, like stories). */
export type RecapAudience = Extract<Tier, 'close' | 'friend' | 'acquaintance'>;

/** Where a week's question came from. */
export type RecapQuestionSource = 'admin' | 'submitted' | 'ai' | 'builtin';

/** Who locked the live week: a person in admin, or the Monday auto-lock. */
export type RecapWeekOrigin = 'admin' | 'auto';

/** One week of recap questions (the same 5 for everyone). */
export interface RecapWeek {
  id: string;
  /** Human label, e.g. "Week of 27 Jul". */
  weekOf: string;
  /** The 5 prompts, in order. */
  questions: string[];
  /** True while this is the live week people record into. */
  active?: boolean;
  /** Monday (UTC) this week is locked to, YYYY-MM-DD. */
  weekStart?: string;
  /** admin = set in the portal; auto = Monday lock. */
  origin?: RecapWeekOrigin;
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
  /** True when this playlist is the live Monday. */
  isCurrent?: boolean;
  /** True when this listener may open older weeks (co-op). */
  canBrowsePast?: boolean;
}

/** One row in the Friend Pod week strip. No voice counts (no vanity totals). */
export interface RecapWeekListItem {
  id: string;
  weekOf: string;
  weekStart?: string;
  isCurrent: boolean;
}

/** Weeks a listener may open in the player. */
export interface RecapWeeksDTO {
  canBrowsePast: boolean;
  weeks: RecapWeekListItem[];
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
