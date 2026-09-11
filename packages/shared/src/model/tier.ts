// ============================================
// WHAT THIS FILE DOES (plain English):
// The four friendship circles (Close, Friends, Acquaintances, Private) and
// the rule for "can this person see this fact?" Each person picks a circle
// for the other. You only see what they labeled for the circle they put
// you in. We just met is Acquaintances.
// ============================================

// THIS SECTION DOES: the four circle names and their rank (higher sees more).
/** 'none' = private but still matchable (used by Discover, shown to no one). */
export type Tier = 'close' | 'friend' | 'acquaintance' | 'none';

export const TIER_ORDER: Record<Tier, number> = {
  close: 3,
  friend: 2,
  acquaintance: 1,
  none: 0
};

export const TIER_LABEL: Record<Tier, string> = {
  close: 'Close friends',
  friend: 'Friends',
  acquaintance: 'Acquaintances',
  none: 'Private'
};

// THIS SECTION DOES: the one-way privacy check used by reveal and In common.
/**
 * PRIVACY: can this viewer see this field?
 *
 * grantedTier = the circle the OWNER put THIS viewer in (what they share with you).
 * fieldVisibleTo = the label on that field (Acquaintances / Friends / Close / Private).
 *
 * Acquaintance-visible facts are the "Everyone" layer: We just met and
 * Acquaintances can see them, and Friends / Close friends can too.
 * Friend-visible facts stay hidden from someone placed as an Acquaintance.
 *
 * Grants are one-way. If they put you as Friends and you put them as
 * Acquaintances, you may see their Friends-labeled facts. They only see
 * your Acquaintance-labeled facts. Overlap is your visible set ∩ theirs.
 */
export function fieldVisibleAtGrantedTier(
  fieldVisibleTo: string,
  grantedTier: string
): boolean {
  const granted = TIER_ORDER[grantedTier as Tier] ?? TIER_ORDER.acquaintance;
  const field = TIER_ORDER[fieldVisibleTo as Tier] ?? TIER_ORDER.none;
  return field > TIER_ORDER.none && field <= granted;
}