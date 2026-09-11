// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared shapes for the opt-in "share my interests to my own website"
// feature, so the mobile app, the Nest API, and any outside site (like a
// personal homepage) all agree on what gets sent.
//
// There are two shapes:
//   1) InterestShareSettings - what the OWNER sees/saves: the on/off switch,
//      their public link piece (slug) + secret token, and the four field
//      checkboxes (hobbies, movies, books, currently reading).
//   2) InterestShareDto - the read-only, sanitized slice a website receives.
//      It is ONLY tastes: never messages, friends, places, About answers, top
//      5, or any matching internals.
//
// PRIVACY: opt-in default OFF. The public view returns only opted-in fields.
// ============================================

/** The four taste categories a person may choose to expose. */
export type InterestShareFields = {
  hobbies: boolean;
  movies: boolean;
  books: boolean;
  currentlyReading: boolean;
};

/**
 * What the owner reads/edits at GET/PATCH /me/share/interests.
 * `slug` and `shareToken` are null until the person has ever opted in.
 */
export type InterestShareSettings = {
  /** Master opt-in switch. When false, the public link returns 404. */
  enabled: boolean;
  /** Friendly public URL piece (for /public/share/interests/:slug). */
  slug: string | null;
  /** Secret Bearer key for token-based public fetch. */
  shareToken: string | null;
  /** Which taste categories are allowed to leave the app. */
  fields: InterestShareFields;
  /** Full public URL for convenience (built from APP_WEB_URL + slug), or null. */
  slugUrl: string | null;
  /** When these settings last changed. */
  updatedAt: string;
};

/** One "currently reading" book (title required; author optional). */
export type InterestShareBook = {
  title: string;
  author?: string;
};

/**
 * The sanitized, read-only export a website receives from
 * GET /public/share/interests/:slug (or via Bearer share token).
 * Only the fields the owner opted into are present/non-empty.
 */
export type InterestShareDto = {
  hobbies: string[];
  movies: string[];
  books: string[];
  currentlyReading?: InterestShareBook;
  /** When the underlying tastes last changed (freshness hint for caches). */
  updatedAt: string;
};

/** What the app may send to PATCH /me/share/interests (all optional). */
export type InterestShareUpdateInput = {
  enabled?: boolean;
  hobbies?: boolean;
  movies?: boolean;
  books?: boolean;
  currentlyReading?: boolean;
  /** Ask the server to mint a fresh secret token (invalidates the old one). */
  rotateToken?: boolean;
};
