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