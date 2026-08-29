import type { Accent } from './person';

/**
 * Co-op membership. The rule: never pay to connect.
 * Membership changes what you can create and organize, never what you can see.
 */

// THIS SECTION DOES: describe free vs member benefits and the shared perk list.

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

/**
 * What members unlock, as short cards / bullets. Used on the Co-op benefits
 * page and the onboarding join screen so both stay in sync.
 */
export const MEMBER_UNLOCKS: ReadonlyArray<{
  key: string;
  title: string;
  line: string;
  emoji: string;
  accent: Accent;
}> = [
  {
    key: 'personalization',
    title: 'Make it yours',
    line: 'Widgets, photos, backgrounds, colors.',
    emoji: '🎨',
    accent: 'purple'
  },
  {
    key: 'circles',
    title: 'Bigger circles',
    line: '25 Close, 125 Friends, plus named groups.',
    emoji: '👥',
    accent: 'teal'
  },
  {
    key: 'video',
    title: 'Post video',
    line: 'Video updates and video replies.',
    emoji: '🎥',
    accent: 'coral'
  },
  {
    key: 'ask',
    title: 'Ask the group',
    line: 'Create polls and open questions.',
    emoji: '📊',
    accent: 'purple'
  },
  {
    key: 'recaps',
    title: 'Daily recaps',
    line: 'Updated daily, not a week behind.',
    emoji: '📅',
    accent: 'amber'
  },
  {
    key: 'storage',
    title: 'Keep everything',
    line: 'No 30 day rolling window.',
    emoji: '📦',
    accent: 'blue'
  },
  {
    key: 'events',
    title: 'Host up to 100',
    line: 'Plus co-hosts, allergies, and assignments.',
    emoji: '🎉',
    accent: 'pink'
  },
  {
    key: 'no_ads',
    title: 'No ads',
    line: 'Ever. You are not the product.',
    emoji: '🚫',
    accent: 'green'
  }
];

/**
 * Free vs Co-op, one row per thing that differs. The onboarding join screen
 * shows the `top` rows first (the headline reasons), then "See more" reveals
 * the rest. Kept here so the Co-op benefits page and onboarding stay in sync.
 *
 * NOTE: Bridger has no ads on any plan, so there is no "ads" row here. Membership
 * is what keeps the product ad-free; we do not imply Free is missing that.
 */
export const COOP_PLAN_COMPARISON: ReadonlyArray<{
  /** stable key for lists / analytics */
  key: string;
  /** short, plain-language feature name */
  label: string;
  /** what the free plan gets */
  free: string;
  /** what a co-op member gets */
  member: string;
  /** true for the headline rows shown before "See more" */
  top: boolean;
}> = [
  { key: 'profit', label: 'Share in the profits', free: 'No', member: 'Yes', top: true },
  { key: 'vote', label: 'A vote in Bridger', free: 'No', member: '1 vote', top: true },
  { key: 'storage', label: 'Keep everything', free: '30 days', member: 'Unlimited', top: true },
  { key: 'friends', label: 'More friends', free: 'Up to 30', member: 'Up to 125', top: true },
  // Acquaintances are the "everyone you added" tier: connection is never capped,
  // so this row is Unlimited on both plans on purpose.
  { key: 'acquaintances', label: 'Add anyone', free: 'Unlimited', member: 'Unlimited', top: false },
  { key: 'video', label: 'Post video', free: 'No', member: 'Yes', top: false },
  { key: 'ask', label: 'Polls and questions', free: 'No', member: 'Yes', top: false },
  { key: 'recaps', label: 'Recaps', free: 'Weekly', member: 'Daily', top: false },
  { key: 'events', label: 'Host big events', free: 'Up to 35', member: 'Up to 100', top: false },
  { key: 'groups', label: 'Named groups', free: 'No', member: 'Yes', top: false },
  { key: 'personalize', label: 'Make it yours', free: 'No', member: 'Yes', top: false }
];

export interface CoopMembership {
  member: boolean;
  /** display only */
  since?: string;
  renews?: string;
  /** Display price, e.g. "$24/year" */
  dues: string;
  plan?: 'free' | 'coop';
  storage?: 'rolling30' | 'unlimited';
  eventCap?: number;
  video?: boolean;
  /** Scheduled leave; perks stay until renews / dues_paid_through */
  cancelAtPeriodEnd?: boolean;
  /**
   * True once when reconcile just flipped active → free (paid period ended).
   * Mobile emits coop_left on this read; not set on hard leave or cancel schedule.
   */
  endedThisRead?: boolean;
}

/**
 * Result of redeeming a promo / auth code for a free year of co-op.
 * `membership` is the updated membership; `grantMonths` is how long was granted.
 */
export interface CoopPromoRedeemResult {
  ok: true;
  grantMonths: number;
  membership: CoopMembership;
}

/**
 * A promo / auth code as the admin console sees it. `code` is shown so the
 * operator can copy and hand it out; `remaining` is how many uses are left.
 */
export interface CoopPromoCode {
  id: string;
  code: string;
  label: string;
  grantMonths: number;
  maxRedemptions: number;
  redeemedCount: number;
  remaining: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One person's redemption of a code (admin view). Opaque user id only. */
export interface CoopPromoRedemption {
  userId: string;
  redeemedAt: string;
}

/** One public idea / proposal in the member portal. PRIVACY: no author names. */
export interface CoopIdea {
  id: string;
  title: string;
  body?: string;
  category: string;
  status: string;
  /** Omitted on public/member portal (no vanity tallies). Admin may include. */
  supportCount?: number;
  supportedByMe?: boolean;
  /** Admin-only opaque id — never returned on public portal DTOs. */
  authorId?: string;
  createdAt?: string;
  evidence?: string;
  drawbacks?: string;
  urgency?: string;
  impact?: string;
  costGuess?: string;
  fundingModel?: string;
}

export interface CoopIdeaComment {
  id: string;
  body: string;
  createdAt: string;
  /** Always "A member" on portal — never a real name. */
  authorLabel?: string;
}

export interface CoopBetaVersion {
  id: string;
  label: string;
  releaseNotes?: string;
  knownIssues?: string;
  unfinished?: string;
  testUrl?: string;
  status: string;
  roundEndsAt?: string;
  /** Member's own vote only — never tallies on portal. */
  myVote?: 'yes' | 'no' | 'extend';
  unlocked?: boolean;
}

export interface CoopMissionPrinciple {
  id: string;
  slug: string;
  title: string;
  body: string;
  supportedByMe?: boolean;
}

export interface CoopEconomicsRow {
  id: string;
  category: string;
  label: string;
  monthlyCents: number;
  notes?: string;
}

export interface CoopRole {
  id: string;
  title: string;
  responsibilities?: string;
  hoursWeek?: string;
  risks?: string;
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