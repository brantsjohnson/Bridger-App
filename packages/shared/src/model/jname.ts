// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared shapes for the "What J name are you..." quiz backend, so the app
// and the API agree on what a result, a share link, and a public web view look
// like. These carry only the fun result and opaque ids, never names or text.
// ============================================

/** What the app sends the server when a run finishes (or is retaken). */
export type JnameResultInput = {
  jName: string;
  percent: number;
  /**
   * The taker's top J-names by score (usually 3). Used so friends can be
   * notified when someone lands on one of their top picks. Opaque labels only.
   */
  topNames?: string[];
};

/** One signed-in person's saved result (or null if they have not taken it yet). */
export type JnameMyResult = {
  jName: string;
  percent: number;
  topNames: string[];
};

/** One friend inside a "your version of X" bucket, with how you two line up. */
export type JnameFriendMatch = {
  /** Opaque friend user id. */
  userId: string;
  /** Their fun J-% (0-100). */
  percent: number;
  /**
   * How compatible you two are on this quiz (0-100). Same J-name scores high;
   * a top-pick hit scores medium-high; otherwise closeness of the two J-%s.
   * Fun only. Never answers or explanations.
   */
  compatibilityPercent: number;
};

/** One persona bucket on the "your version of X" board. */
export type JnameLeaderboardBucket = {
  /** The J-name friends landed on (e.g. "Jake"). */
  jName: string;
  /** Opaque friend user ids in this bucket (kept for Home AvatarStack). */
  friendIds: string[];
  /** Per-friend detail + pairwise compatibility with you. */
  friends: JnameFriendMatch[];
};

/** Signed-in leaderboard: friends grouped by the J-name they got. */
export type JnameLeaderboard = {
  buckets: JnameLeaderboardBucket[];
  /** Home teaser shows this many buckets; the rest appear on "See more". */
  teaserLimit: number;
  /** Your own saved result, so Home can show "completed" without friend buckets. */
  myResult?: JnameMyResult | null;
};

/** The share link the server hands back for the current user's result. */
export type JnameShareResponse = {
  token: string;
  /** Full https link that opens the app if installed, else the free web page. */
  url: string;
};

/** The public, no-account-needed view of someone's shared result. */
export type JnameSharedView = {
  jName: string;
  percent: number;
  /** First name of the person who shared it, so the page can say "Jane is Jake". */
  sharerFirstName?: string;
};

/** Body for connecting a fresh signup back to the friend who invited them. */
export type JnameResolveReferralInput = {
  token?: string;
  anonRef?: string;
};

/** What the server returns after a quiz-share signup (attribution + add friend). */
export type JnameResolveReferralResult = {
  resolved: boolean;
  /** True when we just created the friendship. */
  connected?: boolean;
  /** True when they were already accepted friends. */
  alreadyFriends?: boolean;
  /** Opaque id of the person who shared the quiz. */
  personId?: string;
};

/**
 * Fun pairwise score for two people who both finished the J-name quiz.
 * Same persona = high. Friend landed on one of your top picks = medium-high.
 * Otherwise closeness of the two J-% numbers. Deterministic; no AI.
 */
export function jnameCompatibilityPercent(
  me: { jName: string; percent: number; topNames?: string[] },
  friend: { jName: string; percent: number }
): number {
  const gap = Math.abs(me.percent - friend.percent);
  const tops = Array.isArray(me.topNames) ? me.topNames : [];

  if (me.jName === friend.jName) {
    return Math.round(Math.max(82, Math.min(100, 100 - gap * 0.35)));
  }
  if (tops.includes(friend.jName)) {
    return Math.round(Math.max(68, Math.min(92, 88 - gap * 0.4)));
  }
  return Math.round(Math.max(22, Math.min(75, 72 - gap * 0.55)));
}
