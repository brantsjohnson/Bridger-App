// ============================================
// WHAT THIS FILE DOES (plain English):
// All co-op + portal data: membership (join / period-end cancel), public portal
// reads (mission, ideas, beta, economics, roles), and member writes. Demo mode
// stays in memory. Vote tallies never come back from the public API.
//
// Product events: coop_joined, coop_cancel_scheduled; coop_left only when
// period actually ends (server reconcile) — mobile may emit left on hard leave.
// ============================================
import type {
  CoopBetaVersion,
  CoopEconomicsRow,
  CoopIdea,
  CoopIdeaComment,
  CoopMembership,
  CoopMissionPrinciple,
  CoopPromoRedeemResult,
  CoopRole
} from '@bridger/shared';
import { trackProduct } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import {
  DEMO_MEMBERSHIP,
  DEMO_PROPOSALS,
  DEMO_SHIPPED,
  DEMO_SPEND,
  type DemoProposal
} from './fixtures/coop';

export type DuesMethod = 'apple' | 'google' | 'card' | 'soft';

/** Which billing period the person picked in the join sheet. */
export type DuesPlan = 'monthly' | 'yearly';

export type PortalOverview = {
  member: boolean;
  members: number;
  dues: string;
  since?: string;
  renews?: string;
  cancelAtPeriodEnd?: boolean;
};

let demoMember = false;
let demoCancelAtPeriodEnd = false;
let demoProposals: DemoProposal[] = DEMO_PROPOSALS.map((p) => ({ ...p }));
let demoMissionSupport = new Set<string>();
let demoBetaUnlocked = false;
let demoBetaVote: 'yes' | 'no' | 'extend' | undefined;

export async function getMembership(): Promise<CoopMembership> {
  if (isDemoMode()) {
    return {
      member: demoMember,
      since: demoMember ? DEMO_MEMBERSHIP.since : undefined,
      renews: demoMember ? DEMO_MEMBERSHIP.renews : undefined,
      dues: DEMO_MEMBERSHIP.dues,
      plan: demoMember ? 'coop' : 'free',
      storage: demoMember ? 'unlimited' : 'rolling30',
      eventCap: demoMember ? 100 : 35,
      video: demoMember,
      cancelAtPeriodEnd: demoMember ? demoCancelAtPeriodEnd : false
    };
  }
  const membership = await apiFetch<CoopMembership>('/coop/membership');
  // Period-end flip: server reconcile sets endedThisRead once on this read.
  if (membership.endedThisRead) {
    trackProduct('coop_left');
  }
  return membership;
}

export async function joinCoop(
  method: DuesMethod = 'soft',
  plan: DuesPlan = 'monthly'
): Promise<CoopMembership> {
  if (isDemoMode()) {
    demoMember = true;
    demoCancelAtPeriodEnd = false;
    trackProduct('coop_joined', { method, plan });
    return getMembership();
  }

  // THIS SECTION DOES: Apple / Google buy the chosen plan (monthly or yearly)
  // straight from our own paywall via RevenueCat + StoreKit / Play Billing.
  // Membership is granted on the server only after a confirmed purchase /
  // restore (never on the tap that begins the store sheet).
  if (method === 'apple' || method === 'google') {
    const { purchaseCoopPlan } = await import('../lib/purchases');
    const { isDemoUnlockAllowed } = await import('../lib/demo');
    const outcome = await purchaseCoopPlan(plan);
    if (outcome.status === 'cancelled' || outcome.status === 'not_presented') {
      throw new PurchaseCancelledError();
    }
    if (outcome.status === 'purchased' || outcome.status === 'restored') {
      // Confirmed purchase / restore: mirror onto Bridger membership (webhook
      // also syncs renewals later).
      const membership = await apiFetch<CoopMembership>('/coop/membership', {
        method: 'POST',
        body: JSON.stringify({ join: true, method: outcome.method })
      });
      trackProduct('coop_joined', { method: outcome.method, plan });
      return membership;
    }
    // Preview / TestFlight builds (DEMO_UNLOCK on) often ship before the App
    // Store (appl_) key and SKUs are fully wired. Soft-join so testers can
    // still open the member portal. Production Store builds never take this path.
    if (isDemoUnlockAllowed() && !isDemoMode()) {
      const membership = await apiFetch<CoopMembership>('/coop/membership', {
        method: 'POST',
        body: JSON.stringify({ join: true, method: 'soft', plan })
      });
      trackProduct('coop_joined', { method: 'soft', plan });
      return membership;
    }
    if (outcome.status === 'unavailable' || outcome.status === 'error') {
      throw new Error(outcome.message);
    }
    throw new Error('Could not complete membership. Try again in a moment.');
  }

  // THIS SECTION DOES: Card opens Stripe Checkout in the browser for the chosen
  // plan. Membership is granted by the Stripe webhook after payment succeeds,
  // not on this tap. iOS must not use this path for digital membership (Apple
  // 3.1.1).
  if (method === 'card') {
    const { Platform } = await import('react-native');
    if (Platform.OS === 'ios') {
      throw new Error(
        'Card membership is available on the web. On iPhone, join with the App Store.'
      );
    }
    const session = await apiFetch<{ url: string; sessionId: string }>(
      '/coop/checkout/stripe',
      {
        method: 'POST',
        body: JSON.stringify({ plan })
      }
    );
    if (!session?.url) {
      throw new Error('Could not start card checkout.');
    }
    if (Platform.OS === 'web') {
      const Linking = await import('expo-linking');
      await Linking.openURL(session.url);
    } else {
      const WebBrowser = await import('expo-web-browser');
      await WebBrowser.openBrowserAsync(session.url);
    }
    // Do not emit coop_joined here; webhook / next membership fetch confirms.
    return getMembership();
  }

  const membership = await apiFetch<CoopMembership>('/coop/membership', {
    method: 'POST',
    body: JSON.stringify({ join: true, method })
  });
  trackProduct('coop_joined', { method, plan });
  return membership;
}

/** Thrown when the person closes the store sheet without buying. */
export class PurchaseCancelledError extends Error {
  constructor() {
    super('Purchase cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

/** Restore App Store / Play purchases, then sync Bridger membership. */
export async function restoreCoopPurchases(): Promise<CoopMembership> {
  if (isDemoMode()) {
    demoMember = true;
    trackProduct('coop_joined', { method: 'soft' });
    return getMembership();
  }
  const { restorePurchases } = await import('../lib/purchases');
  const outcome = await restorePurchases();
  if (outcome.status === 'cancelled') throw new PurchaseCancelledError();
  if (outcome.status === 'unavailable' || outcome.status === 'error') {
    throw new Error(outcome.message);
  }
  if (outcome.status !== 'restored' && outcome.status !== 'purchased') {
    throw new Error('No active membership to restore.');
  }
  const membership = await apiFetch<CoopMembership>('/coop/membership', {
    method: 'POST',
    body: JSON.stringify({ join: true, method: outcome.method })
  });
  trackProduct('coop_joined', { method: outcome.method });
  return membership;
}

/**
 * Redeem an auth / promo code for a free year of co-op (no payment). The server
 * checks the code, grants membership, and records that this user used it. We
 * emit coop_promo_redeemed + coop_joined only after the server confirms — never
 * on the tap. The code text itself is never sent to analytics.
 */
export async function redeemPromoCode(
  code: string
): Promise<CoopPromoRedeemResult> {
  if (isDemoMode()) {
    // Demo accepts the seeded code so the flow can be tried without a server.
    if (code.trim().toUpperCase() !== 'BRIDGER-FREE-YEAR') {
      throw new Error('That code is not valid.');
    }
    demoMember = true;
    demoCancelAtPeriodEnd = false;
    trackProduct('coop_promo_redeemed', { method: 'promo' });
    trackProduct('coop_joined', { method: 'promo' });
    return { ok: true, grantMonths: 12, membership: await getMembership() };
  }
  const result = await apiFetch<CoopPromoRedeemResult>(
    '/coop/membership/redeem',
    {
      method: 'POST',
      body: JSON.stringify({ code })
    }
  );
  trackProduct('coop_promo_redeemed', { method: 'promo' });
  trackProduct('coop_joined', { method: 'promo' });
  return result;
}

/** Immediate leave (legacy). Prefer cancelMembership for product UX. */
export async function leaveCoop(): Promise<CoopMembership> {
  if (isDemoMode()) {
    demoMember = false;
    demoCancelAtPeriodEnd = false;
    trackProduct('coop_left');
    return getMembership();
  }
  const membership = await apiFetch<CoopMembership>('/coop/membership', {
    method: 'POST',
    body: JSON.stringify({ join: false })
  });
  trackProduct('coop_left');
  return membership;
}

/** Period-end cancel: keep perks until renews date. */
export async function cancelMembership(): Promise<CoopMembership> {
  if (isDemoMode()) {
    if (!demoMember) throw new Error('Not a member');
    demoCancelAtPeriodEnd = true;
    trackProduct('coop_cancel_scheduled');
    return getMembership();
  }
  const membership = await apiFetch<CoopMembership>('/coop/membership/cancel', {
    method: 'POST',
    body: JSON.stringify({})
  });
  trackProduct('coop_cancel_scheduled');
  return membership;
}

export async function getPortalOverview(): Promise<PortalOverview> {
  if (isDemoMode()) {
    const m = await getMembership();
    return {
      member: m.member,
      members: DEMO_MEMBERSHIP.members,
      dues: DEMO_MEMBERSHIP.dues,
      since: m.since,
      renews: m.renews,
      cancelAtPeriodEnd: m.cancelAtPeriodEnd
    };
  }
  return apiFetch<PortalOverview>('/coop/portal/overview');
}

export async function listMission(): Promise<CoopMissionPrinciple[]> {
  if (isDemoMode()) {
    return [
      {
        id: 'm1',
        slug: 'people-over-engagement',
        title: 'People over engagement',
        body: 'Bridger should help people spend less time scrolling and more time building real-world relationships.',
        supportedByMe: demoMissionSupport.has('m1')
      },
      {
        id: 'm2',
        slug: 'no-attention-traps',
        title: 'No attention traps',
        body: 'Bridger will not rely on addiction, endless feeds, or data extraction to make money.',
        supportedByMe: demoMissionSupport.has('m2')
      },
      {
        id: 'm3',
        slug: 'one-member-one-vote',
        title: 'One member, one vote',
        body: "Every member's voice carries equal weight, no matter when they joined or how much they pay.",
        supportedByMe: demoMissionSupport.has('m3')
      },
      {
        id: 'm4',
        slug: 'mission-cant-be-sold',
        title: "The mission can't be sold",
        body: "Bridger's purpose is protected from buyers, investors, or pressure that would gut what it stands for.",
        supportedByMe: demoMissionSupport.has('m4')
      },
      {
        id: 'm5',
        slug: 'value-stays-with-members',
        title: 'Value stays with members',
        body: 'Bridger exists to serve the people who use it, not outside owners extracting profit from them.',
        supportedByMe: demoMissionSupport.has('m5')
      },
      {
        id: 'm6',
        slug: 'you-control-your-data',
        title: 'You control your data',
        body: 'Members decide what they share, and their information is never sold or treated as the product.',
        supportedByMe: demoMissionSupport.has('m6')
      },
      {
        id: 'm7',
        slug: 'transparency-by-default',
        title: 'Transparency by default',
        body: 'Costs, tradeoffs, and decisions should be visible so members can understand how the platform runs.',
        supportedByMe: demoMissionSupport.has('m7')
      }
    ];
  }
  return apiFetch<CoopMissionPrinciple[]>('/coop/portal/mission');
}

export async function toggleMissionSupport(id: string): Promise<boolean> {
  if (isDemoMode()) {
    if (demoMissionSupport.has(id)) demoMissionSupport.delete(id);
    else demoMissionSupport.add(id);
    return demoMissionSupport.has(id);
  }
  const res = await apiFetch<{ supported: boolean }>(
    `/coop/portal/mission/${encodeURIComponent(id)}/support`,
    { method: 'POST', body: '{}' }
  );
  return !!res.supported;
}

export async function listIdeas(): Promise<CoopIdea[]> {
  if (isDemoMode()) {
    return demoProposals.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.line,
      category: 'other',
      status: 'community_discussion',
      supportedByMe: p.myVote
    }));
  }
  return apiFetch<CoopIdea[]>('/coop/portal/ideas');
}

export async function getIdea(
  id: string
): Promise<CoopIdea & { comments: CoopIdeaComment[] }> {
  if (isDemoMode()) {
    const p = demoProposals.find((x) => x.id === id);
    return {
      id,
      title: p?.title ?? 'Idea',
      body: p?.line,
      category: 'other',
      status: 'community_discussion',
      supportedByMe: p?.myVote,
      comments: []
    };
  }
  return apiFetch(`/coop/portal/ideas/${encodeURIComponent(id)}`);
}

export async function createIdea(input: {
  title: string;
  problem?: string;
  category?: string;
  evidence?: string;
  drawbacks?: string;
  urgency?: string;
  impact?: string;
  costGuess?: string;
  fundingModel?: string;
}): Promise<CoopIdea> {
  if (isDemoMode()) {
    const id = `demo-${Date.now()}`;
    demoProposals = [
      {
        id,
        title: input.title,
        line: input.problem ?? '',
        votes: 0,
        myVote: false,
        closes: 'Pending review'
      },
      ...demoProposals
    ];
    return {
      id,
      title: input.title,
      body: input.problem,
      category: input.category ?? 'other',
      status: 'submitted',
      supportedByMe: false
    };
  }
  return apiFetch('/coop/portal/ideas', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function toggleIdeaSupport(id: string): Promise<boolean> {
  if (isDemoMode()) {
    demoProposals = demoProposals.map((p) =>
      p.id === id ? { ...p, myVote: !p.myVote } : p
    );
    return !!demoProposals.find((p) => p.id === id)?.myVote;
  }
  const res = await apiFetch<{ supported: boolean }>(
    `/coop/portal/ideas/${encodeURIComponent(id)}/support`,
    { method: 'POST', body: '{}' }
  );
  return !!res.supported;
}

export async function addIdeaComment(
  id: string,
  body: string
): Promise<CoopIdeaComment> {
  if (isDemoMode()) {
    return {
      id: `c-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      authorLabel: 'A member'
    };
  }
  return apiFetch(`/coop/portal/ideas/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

export async function getBetaCurrent(): Promise<CoopBetaVersion | null> {
  if (isDemoMode()) {
    return {
      id: 'beta-demo',
      label: 'Beta 0.2',
      releaseNotes:
        '• Smoother onboarding\n• Faster friend discovery\n• Portal soft launch',
      knownIssues: 'Theme previews can flicker when switching presets quickly.',
      unfinished:
        '• Group activities not built yet\n• Notifications may be delayed',
      status: 'open',
      unlocked: demoBetaUnlocked,
      myVote: demoBetaVote
    };
  }
  return apiFetch<CoopBetaVersion | null>('/coop/portal/beta/current');
}

export async function verifyBeta(accessCode: string): Promise<void> {
  if (isDemoMode()) {
    if (accessCode.trim().toUpperCase() !== 'BRIDGER-BETA') {
      throw new Error('Invalid access code');
    }
    demoBetaUnlocked = true;
    return;
  }
  await apiFetch('/coop/portal/beta/verify', {
    method: 'POST',
    body: JSON.stringify({ accessCode })
  });
}

export async function voteBeta(choice: 'yes' | 'no' | 'extend'): Promise<void> {
  if (isDemoMode()) {
    demoBetaVote = choice;
    return;
  }
  await apiFetch('/coop/portal/beta/vote', {
    method: 'POST',
    body: JSON.stringify({ choice })
  });
}

export async function listEconomics(): Promise<CoopEconomicsRow[]> {
  if (isDemoMode()) {
    return DEMO_SPEND.map((s, i) => ({
      id: `e${i}`,
      category: s.label,
      label: s.label,
      monthlyCents: Math.round((s.pct / 100) * 500000)
    }));
  }
  return apiFetch<CoopEconomicsRow[]>('/coop/portal/economics');
}

export async function listRoles(): Promise<CoopRole[]> {
  if (isDemoMode()) {
    return [
      {
        id: 'r1',
        title: 'Founder / CEO',
        hoursWeek: '12–45',
        responsibilities: 'Product strategy, roadmap, stewardship',
        risks: 'Time burden\nCommunity accountability'
      },
      {
        id: 'r2',
        title: 'Developer',
        hoursWeek: '8–37',
        responsibilities: 'Build features, maintain privacy invariants'
      },
      {
        id: 'r3',
        title: 'Designer',
        hoursWeek: '3–14',
        responsibilities: 'UX, accessibility, brand consistency'
      }
    ];
  }
  return apiFetch<CoopRole[]>('/coop/portal/roles');
}

/** Kept for older hub fixtures — shipped list from implemented ideas. */
export async function listShipped() {
  if (isDemoMode()) return DEMO_SHIPPED.map((s) => ({ ...s }));
  const ideas = await listIdeas();
  return ideas
    .filter((i) => i.status === 'implemented')
    .map((i) => ({ id: i.id, title: i.title, line: i.body ?? 'Shipped' }));
}
