/** 'none' = private but still matchable (used by Discover, shown to no one). */
export type Tier = 'close' | 'friend' | 'acquaintance' | 'none';

export const TIER_ORDER: Record<Tier, number> = {
  close: 3,
  friend: 2,
  acquaintance: 1,
  none: 0
};

export const TIER_LABEL: Record<Tier, string> = {
  close: 'Close',
  friend: 'Friends',
  acquaintance: 'Acquaintances',
  none: 'Private'
};