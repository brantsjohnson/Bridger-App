// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure unit tests for reveal Screen 3 FoF gating: Discover off → empty,
// threshold + limit + exclude the just-connected person, prefer reciprocal.
// ============================================
import assert from 'node:assert/strict';

type Candidate = {
  candidateId: string;
  viaFriendId: string;
  score: number | null;
  isBridge: boolean;
};

function suggestMany(
  discoverable: boolean,
  metContext: string | null,
  personId: string,
  candidates: Candidate[],
  limit: number
): { discoverable: boolean; suggestions: Candidate[] } {
  if (!discoverable) return { discoverable: false, suggestions: [] };
  if (!metContext) return { discoverable, suggestions: [] };
  const kept = candidates
    .filter((c) => c.candidateId !== personId)
    .filter((c) => c.score != null && c.score >= 0.5)
    .sort((a, b) => {
      // Prefer true bridge (friend of the new person), then score.
      if (a.isBridge !== b.isBridge) return a.isBridge ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, Math.max(1, Math.min(3, limit)));
  return { discoverable, suggestions: kept };
}

// --- Discover off → nudge path ---
const off = suggestMany(false, 'just-met', 'new-friend', [
  {
    candidateId: 'fof-1',
    viaFriendId: 'new-friend',
    score: 0.9,
    isBridge: true
  }
], 3);
assert.equal(off.discoverable, false);
assert.equal(off.suggestions.length, 0);

// --- no met_context → empty (beat 0 not done) ---
const early = suggestMany(true, null, 'new-friend', [
  {
    candidateId: 'fof-1',
    viaFriendId: 'new-friend',
    score: 0.9,
    isBridge: true
  }
], 3);
assert.equal(early.suggestions.length, 0);

// --- below threshold excluded; limit 3; never suggest the new friend ---
const pool: Candidate[] = [
  { candidateId: 'new-friend', viaFriendId: 'x', score: 0.99, isBridge: false },
  { candidateId: 'a', viaFriendId: 'new-friend', score: 0.95, isBridge: true },
  { candidateId: 'b', viaFriendId: 'new-friend', score: 0.9, isBridge: true },
  { candidateId: 'c', viaFriendId: 'other', score: 0.85, isBridge: false },
  { candidateId: 'd', viaFriendId: 'other', score: 0.8, isBridge: false },
  { candidateId: 'e', viaFriendId: 'other', score: 0.3, isBridge: true }
];
const out = suggestMany(true, 'just-met', 'new-friend', pool, 3);
assert.equal(out.discoverable, true);
assert.equal(out.suggestions.length, 3);
assert.ok(
  out.suggestions.every((s) => s.candidateId !== 'new-friend'),
  'just-connected person never suggested'
);
assert.ok(
  out.suggestions.every((s) => (s.score ?? 0) >= 0.5),
  'below-threshold excluded'
);
assert.deepEqual(
  out.suggestions.map((s) => s.candidateId),
  ['a', 'b', 'c'],
  'bridge preferred, then score; capped at 3'
);

console.log('matching-reveal-bridges.spec.ts: ok');
