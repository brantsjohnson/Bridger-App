// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Friends tab needs for the roster: list your confirmed friends
// grouped by tier, and move someone between Close / Friends / Acquaintances.
// Demo mode keeps tiers in memory so Edit feels real. Live mode calls the
// connections + tiers APIs — same function names either way.
// ============================================
import type { Person, Tier } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { getCachedPeople, loadPeople } from '../lib/people-cache';
import { BIRTHDAYS, PEOPLE as FIXTURE_PEOPLE } from './fixtures/catalog';

/** The three circles you can put a friend in (never "none" on this page). */
export const ROSTER_TIERS: Tier[] = ['close', 'friend', 'acquaintance'];

/** Free-plan caps from FRIENDS.md. Acquaintances are never capped. */
const FREE_CLOSE_CAP = 10;
const FREE_FRIEND_CAP = 25;

/** One row on the Friends roster. */
export type FriendRow = Person & {
  /** SECURITY / PRIVACY: only true if they shared birthday with your tier */
  birthdayToday?: boolean;
};

export type RosterSection = {
  tier: Tier;
  people: FriendRow[];
};

export type MoveTierResult = {
  /** which circle they ended up in (may differ if a free cap was hit) */
  landedIn: Tier;
  /** true when a free-plan cap blocked Close/Friends and we offered co-op */
  upsell: boolean;
};

/** In-memory tiers for demo mode (so Edit sticks for the session). */
let demoTiers: Record<string, Tier> = Object.fromEntries(
  FIXTURE_PEOPLE.map((p) => [p.id, p.tier])
);

function toRow(p: Person): FriendRow {
  const bday = BIRTHDAYS[p.id];
  return {
    ...p,
    tier: demoTiers[p.id] ?? p.tier,
    birthdayToday: bday?.today === true
  };
}

function countInTier(tier: Tier): number {
  return Object.values(demoTiers).filter((t) => t === tier).length;
}

/**
 * Demo: the circle this friend is in right now (Edit / profile retier).
 * Used by personById so the profile pill matches the Friends roster.
 */
export function demoTierFor(personId: string): Tier | undefined {
  return demoTiers[personId];
}

/**
 * Load the Friends roster grouped by tier (closest first).
 * Empty tiers are omitted unless includeEmpty is true (Edit mode shows drop zones).
 */
export async function listRoster(opts?: { includeEmpty?: boolean }): Promise<RosterSection[]> {
  if (isDemoMode()) {
    const rows = FIXTURE_PEOPLE.map(toRow);
    return ROSTER_TIERS.map((tier) => ({
      tier,
      people: rows.filter((p) => p.tier === tier)
    })).filter((s) => opts?.includeEmpty || s.people.length > 0);
  }

  // Live: refresh the people cache, then group by each person's tier.
  await loadPeople();
  const rows: FriendRow[] = getCachedPeople().map((p) => ({
    ...p,
    // TODO: festive birthday row needs each friend's shared birthday attribute.
    birthdayToday: false
  }));
  return ROSTER_TIERS.map((tier) => ({
    tier,
    people: rows.filter((p) => p.tier === tier)
  })).filter((s) => opts?.includeEmpty || s.people.length > 0);
}

/** Flat list of confirmed friends (for search stub / pickers). */
export async function listFriends(): Promise<FriendRow[]> {
  const sections = await listRoster({ includeEmpty: true });
  return sections.flatMap((s) => s.people);
}

/**
 * Move a friend into another circle.
 * PRIVACY / PAYMENT: free members who hit the Close (10) or Friends (25) cap
 * get a co-op upsell; the person still lands in Acquaintances so the connection
 * is never blocked.
 */
export async function moveTier(personId: string, target: Tier): Promise<MoveTierResult> {
  if (!ROSTER_TIERS.includes(target)) {
    return { landedIn: 'acquaintance', upsell: false };
  }

  if (isDemoMode()) {
    // Demo assumes free plan for now (co-op membership comes later).
    const isCoop = false;
    let landedIn = target;
    let upsell = false;

    if (!isCoop && target === 'close' && countInTier('close') >= FREE_CLOSE_CAP) {
      // already in close does not count against "adding" when staying put
      if (demoTiers[personId] !== 'close') {
        landedIn = 'acquaintance';
        upsell = true;
      }
    }
    if (!isCoop && target === 'friend' && countInTier('friend') >= FREE_FRIEND_CAP) {
      if (demoTiers[personId] !== 'friend') {
        landedIn = 'acquaintance';
        upsell = true;
      }
    }

    demoTiers = { ...demoTiers, [personId]: landedIn };
    return { landedIn, upsell };
  }

  const result = await apiFetch<MoveTierResult>(
    `/tiers/${encodeURIComponent(personId)}`,
    { method: 'PATCH', body: JSON.stringify({ tier: target }) }
  );
  // Keep the people cache's tier in sync so personById stays accurate.
  await loadPeople({ force: true });
  return result;
}

/** Stub kept for callers that want an async list; Friends filters client-side. */
export async function searchFriends(query: string): Promise<FriendRow[]> {
  const all = await listFriends();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)
  );
}
