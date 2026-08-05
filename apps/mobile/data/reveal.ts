// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Connection Reveal and the friend "In common" tab need:
// load what you share, save how you met (coarse place only), and read
// shared place photos. Demo mode keeps state in memory for the session.
// Live mode will call the connections / matching APIs — same names either way.
//
// PRIVACY (load-bearing):
// - Place is coarse ("RiNo, Denver") and approximate — never GPS / street.
// - Only the two people see the how-you-met memory; either can edit or remove.
// - Analytics never gets place strings, names, or commonality text —
//   only opaque outcomes like recorded_where (bool).
// ============================================
import type { HowYouMet, MeetContext, Person, Tier } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { getCachedPerson, loadPeople } from '../lib/people-cache';
import { getCommonalities, getQuizMatches, type Commonality, type QuizMatch } from './discover';
import {
  HOW_YOU_MET as FIXTURE_HOW,
  NEARBY_AREA,
  SHARED_PLACES as FIXTURE_PLACES,
  type SharedPlace
} from './fixtures/connections';
import { SUGGESTIONS, REQUESTS } from './fixtures/discover';
import { getMe, personById } from './people';

export type { SharedPlace };
export { NEARBY_AREA };

/** What the reveal screen needs to paint one connection celebration. */
export type RevealPayload = {
  person: Person;
  me: Person;
  /** Mutual friend who connects you, when there is one */
  via: Person | null;
  strongest: Commonality | null;
  /** Up to 3 more commonalities (screen 2 shrinks if thin) */
  others: Commonality[];
  /** Full set for the re-openable In common tab */
  all: Commonality[];
  /** Compatibility scores from matching-only quizzes (e.g. "95% in Humor") */
  quizMatches: QuizMatch[];
};

// --- DEMO STATE: mutates so saving how-you-met sticks for this session ---
let demoHowYouMet: Record<string, HowYouMet[]> = Object.fromEntries(
  Object.entries(FIXTURE_HOW).map(([id, rows]) => [id, rows.map((r) => ({ ...r }))])
);

/** Initial tier chosen at reveal — just-met → acquaintance, already-know → friend */
const demoTiers: Record<string, Tier> = {};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Resolve the mutual friend from Discover fixtures when viaId is not passed. */
function resolveViaId(personId: string, viaFriendId?: string): string | undefined {
  if (viaFriendId) return viaFriendId;
  const fromReq = REQUESTS.find((r) => r.personId === personId);
  if (fromReq?.viaFriendId) return fromReq.viaFriendId;
  const fromSug = SUGGESTIONS.find((s) => s.personId === personId);
  return fromSug?.viaFriendId;
}

/**
 * Load everything the reveal (and In common tab) needs for one person.
 * PRIVACY: commonalities already respect tier on the live API; demo shows fixtures.
 */
export async function getReveal(
  personId: string,
  viaFriendId?: string
): Promise<RevealPayload> {
  const person = personById(personId);
  const me = getMe();
  const viaId = resolveViaId(personId, viaFriendId);
  const via = viaId ? personById(viaId) : null;

  // Full overlap list — strongest flagged, rest for "you've also got".
  // Live: matching/RAG is deferred, so getCommonalities / getQuizMatches return
  // [] until that module ships. Person / me / via already come from the cache.
  const all = await getCommonalities(personId);

  const strongest = all.find((c) => c.strongest) ?? all[0] ?? null;
  const others = all.filter((c) => c.key !== strongest?.key).slice(0, 3);

  // Matching-quiz scores ("95% in Humor") — shown in the reveal, never on a card.
  const quizMatches = await getQuizMatches(personId);

  return { person, me, via, strongest, others, all, quizMatches };
}

/**
 * Persist Screen 0 choices.
 *
 * Tier rules (SECURITY — nothing private shows before a tier exists):
 * - just-met → always Acquaintances
 * - already-know → their optional bucket, or Friends if they skipped
 *
 * Memory rules (PRIVACY):
 * - coarse place only when recordPlace is on (never GPS / street)
 * - optional short note for Discover connects (never logged to analytics)
 */
export async function saveHowYouMet(
  personId: string,
  input: {
    context: MeetContext;
    recordPlace: boolean;
    /** Optional how-you-met note (Discover). Trimmed; empty is ignored. */
    meetNote?: string;
    /** Optional circle when already-know. Ignored for just-met. */
    tier?: Tier | null;
    viaName?: string;
  }
): Promise<{ tier: Tier; recordedWhere: boolean; addedNote: boolean }> {
  // SECURITY: just-met always starts as Acquaintances. Already-know can pick
  // a circle; if they skip, Friends is the soft default.
  const tier: Tier =
    input.context === 'just-met'
      ? 'acquaintance'
      : input.tier === 'close' || input.tier === 'friend' || input.tier === 'acquaintance'
        ? input.tier
        : 'friend';

  const note = input.meetNote?.trim() ?? '';
  const addedNote = note.length > 0;

  if (isDemoMode()) {
    demoTiers[personId] = tier;
    const next = [...(demoHowYouMet[personId] ?? [])];

    if (input.viaName) {
      const alreadyVia = next.some((r) => r.kind === 'via' && r.label === input.viaName);
      if (!alreadyVia) {
        next.push({ kind: 'via', label: input.viaName, date: todayLabel() });
      }
    }

    if (input.recordPlace) {
      // PRIVACY: coarse place chip only — approximate by design
      next.push({
        kind: 'place',
        label: NEARBY_AREA,
        date: todayLabel(),
        approximate: true,
        viaName: input.viaName
      });
    }

    if (addedNote) {
      // PRIVACY: short freeform memory — only the two of you see it
      next.push({
        kind: 'note',
        label: note.slice(0, 80),
        date: todayLabel(),
        viaName: input.viaName
      });
    }

    demoHowYouMet[personId] = next;
    return { tier, recordedWhere: input.recordPlace, addedNote };
  }

  // PRIVACY: place / note text never go to analytics — only the bool outcomes.
  const result = await apiFetch<{
    tier: Tier;
    recordedWhere: boolean;
    addedNote: boolean;
  }>(`/connections/${encodeURIComponent(personId)}/how-you-met`, {
    method: 'POST',
    body: JSON.stringify({
      context: input.context,
      recordPlace: input.recordPlace,
      meetNote: input.meetNote,
      tier: input.tier,
      placeLabel: NEARBY_AREA
    })
  });
  await loadPeople();
  return result;
}

/** Shared memories on their profile — either of you can edit or remove later. */
export async function getHowYouMet(personId: string): Promise<HowYouMet[]> {
  if (isDemoMode()) {
    return (demoHowYouMet[personId] ?? []).map((r) => ({ ...r }));
  }
  return apiFetch<HowYouMet[]>(
    `/connections/${encodeURIComponent(personId)}/how-you-met`
  );
}

/** Side-by-side place photos for the In common tab (co-op expressive layer). */
export async function getSharedPlaces(_personId: string): Promise<SharedPlace[]> {
  if (isDemoMode()) {
    return FIXTURE_PLACES.map((p) => ({
      ...p,
      yours: { ...p.yours },
      theirs: { ...p.theirs }
    }));
  }
  // TODO: GET /connections/:personId/shared-places
  return [];
}

/** Tier chosen at reveal (or later on Friends), if any. */
export async function getRevealTier(personId: string): Promise<Tier | null> {
  if (isDemoMode()) return demoTiers[personId] ?? null;
  return getCachedPerson(personId)?.tier ?? null;
}
