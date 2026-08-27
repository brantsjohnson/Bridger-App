/**
 * Co-op membership. The rule: never pay to connect.
 * Membership changes what you can create and organize, never what you can see.
 */
export interface CoopBenefits {
  /** widgets, added photos, backgrounds, colors */
  personalization: boolean;
  circleCaps: {close: number;friends: number;acquaintances: 'unlimited';};
  /** named groups beyond the three tiers */
  customGroups: boolean;
  /** posting video updates and video reactions. Viewing is never gated. */
  video: boolean;
  /** extra photos on places traveled (can show up in In common) */
  placePhotos: boolean;
  summaryCadence: 'weekly' | 'daily';
  storage: 'rolling30' | 'unlimited';
  eventGuestCap: number;
  /** co-hosts, collect allergies, assignments. Hosting itself is never gated. */
  premiumHostTools: boolean;
  /** creating polls and open questions for your friends. Answering is never gated. */
  askTheGroup: boolean;
}

export const FREE_BENEFITS: CoopBenefits = {
  personalization: false,
  circleCaps: { close: 5, friends: 30, acquaintances: 'unlimited' },
  customGroups: false,
  video: false,
  placePhotos: false,
  summaryCadence: 'weekly',
  storage: 'rolling30',
  eventGuestCap: 35,
  premiumHostTools: false,
  askTheGroup: false
};

export const MEMBER_BENEFITS: CoopBenefits = {
  personalization: true,
  circleCaps: { close: 25, friends: 125, acquaintances: 'unlimited' },
  customGroups: true,
  video: true,
  placePhotos: true,
  summaryCadence: 'daily',
  storage: 'unlimited',
  eventGuestCap: 100,
  premiumHostTools: true,
  askTheGroup: true
};

export interface CoopMembership {
  member: boolean;
  /** display only */
  since?: string;
  renews?: string;
  dues: string;
}