// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes for the optional easter-egg layer (pet cats, emoji bombs, seasonal
// confetti). Each delight is an isolated plugin; these types are how admin
// toggles them and how the app mounts / plays them.
// ============================================

export type DelightScope = 'global' | 'opt-in' | 'gift';

/** One registered delight (matches a folder under apps/mobile/delight/). */
export interface DelightEntry {
  id: string;
  /** Stable plugin folder name (e.g. "emoji-bomb"). */
  slug: string;
  name: string;
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
  /** Display name of the sender, rejoined on-device when available. */
  fromName?: string;
}
