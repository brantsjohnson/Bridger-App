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

/** One persona bucket on the "your version of X" board. */
export type JnameLeaderboardBucket = {
  /** The J-name friends landed on (e.g. "Jake"). */
  jName: string;
  /** Opaque friend user ids in this bucket. */
  friendIds: string[];
};

/** Signed-in leaderboard: friends grouped by the J-name they got. */
export type JnameLeaderboard = {
  buckets: JnameLeaderboardBucket[];
  /** Home teaser shows this many buckets; the rest appear on "See more". */
  teaserLimit: number;
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
