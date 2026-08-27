// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the optional delight umbrella: backlog rows in admin, standalone
// plugins the host mounts, and gift triggers waiting to play.
// ============================================

export type DelightScope = 'global' | 'opt-in' | 'gift';

/** Where a surprise sits in the open backlog. */
export type DelightStatus = 'idea' | 'built' | 'live';

/** Standalone = host plugin; effect = reusable importable motion. */
export type DelightKind = 'standalone' | 'effect';

/** One surprise in the admin catalog (matches a folder under apps/mobile/delight/). */
export interface DelightEntry {
  id: string;
  /** Stable plugin/effect folder name (e.g. "emoji-bomb"). */
  slug: string;
  name: string;
  status: DelightStatus;
  kind: DelightKind;
  /** Free-text notes for humans + Cursor (where it might live, vibe). */
  notes: string;
  enabled: boolean;
  scope: DelightScope;
  schedule?: { from?: string; to?: string };
}

/** A gift delight waiting to play on the recipient's next open. */
export interface DelightTrigger {
  id: string;
  delightId: string;
  delightSlug?: string;
  fromUserId: string;
  toUserId: string;
  played: boolean;
  /** Display name of the sender, rejoined on-device or from the API. */
  fromName?: string;
}
