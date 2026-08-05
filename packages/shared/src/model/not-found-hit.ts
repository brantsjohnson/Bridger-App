// ============================================
// WHAT THIS FILE DOES (plain English):
// Shape of one "someone hit a missing screen" report. The admin console lists
// these so you can see which path people took before the 404. PRIVACY: routes
// only (no names, messages, or other content).
// ============================================

/** Why the 404 / error screen showed. */
export type NotFoundReason =
  | 'unmatched_route'
  | 'connection_error'
  | 'runtime_error';

/** One hit recorded for the admin "Broken paths" page. */
export type NotFoundHit = {
  id: string;
  createdAt: string;
  /** The path that did not resolve (or the screen that failed). */
  missingPath: string;
  /** Recent routes leading here, oldest → newest. No query strings. */
  pathTrail: string[];
  reason: NotFoundReason;
  platform?: string;
  appVersion?: string;
  /** Opaque session id — never email/name. */
  sessionId?: string;
};
