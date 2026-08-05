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
  summaryCadence: 'weekly' | 'daily';
  storage: 'rolling30' | 'unlimited';
  eventGuestCap: number;
  /** creating polls and open questions for your friends. Answering is never gated. */
  askTheGroup: boolean;
}

export const FREE_BENEFITS: CoopBenefits = {
  personalization: false,
  circleCaps: { close: 10, friends: 25, acquaintances: 'unlimited' },
  customGroups: false,
  video: false,
  summaryCadence: 'weekly',
  storage: 'rolling30',
  eventGuestCap: 35,
  askTheGroup: false
};

export const MEMBER_BENEFITS: CoopBenefits = {
  personalization: true,
  circleCaps: { close: Infinity, friends: Infinity, acquaintances: 'unlimited' },
  customGroups: true,
  video: true,
  summaryCadence: 'daily',
  storage: 'unlimited',
  eventGuestCap: 100,
  askTheGroup: true
};

export interface CoopMembership {
  member: boolean;
  /** display only */
  since?: string;
  renews?: string;
  dues: string;
}

/** A co-op notice published to members (Home banner). */
export interface CoopAnnouncement {
  id: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  publishedAt?: string;
  /** Alias used by the mobile fixture / widget ("action" copy). */
  action?: string;
}