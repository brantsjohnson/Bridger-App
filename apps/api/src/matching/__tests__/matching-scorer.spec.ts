// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure unit tests for exploration reshuffle and evidence-gate math helpers
// that do not need a live database.
// ============================================
import assert from 'node:assert/strict';
import { MATCHING_FEATURES, MATCHING_V1_WEIGHTS } from '@bridger/shared';

function scoreFromFeatures(
  features: Record<string, number>,
  weights = MATCHING_V1_WEIGHTS
): number {
  let s = 0;
  for (const f of MATCHING_FEATURES) {
    s += (weights[f] ?? 0) * (features[f] ?? 0);
  }
  return s;
}

function evidenceGate(
  sharedQuizCount: number,
  sharedAttrCount: number,
  minShared = 3
): boolean {
  return sharedQuizCount >= 1 || sharedAttrCount >= minShared;
}

function applyExploration<T extends { score: number; isSpotlight: boolean }>(
  ranked: T[],
  epsilon: number,
  cap: number,
  rng: () => number
): T[] {
  if (ranked.length <= cap) return ranked;
  const head = ranked.slice(0, cap);
  if (rng() >= epsilon) return head;
  const rest = ranked.slice(cap);
  if (!rest.length) return head;
  let swapIdx = -1;
  for (let i = head.length - 1; i >= 0; i--) {
    if (!head[i]!.isSpotlight) {
      swapIdx = i;
      break;
    }
  }
  if (swapIdx < 0) return head;
  head[swapIdx] = rest[0]!;
  return head;
}

// --- quiz intersection gate ---
assert.equal(evidenceGate(1, 0), true, 'one shared quiz passes');
assert.equal(evidenceGate(0, 3), true, 'three attrs pass');
assert.equal(evidenceGate(0, 2), false, 'two attrs fail');
assert.equal(evidenceGate(0, 0), false, 'empty fails');

// --- zero-by-absence still scores other features ---
const partial = scoreFromFeatures({
  quiz_alignment: 0,
  embedding_similarity: 0.8,
  shared_attributes: 0.9,
  moderator_notes_affinity: 0,
  mutual_warmth: 0.7,
  context_fit: 0
});
assert.ok(partial > 0.4, 'partial features still produce a real score');

// --- exploration never picks outside qualified list ---
const ranked = [
  { score: 0.9, isSpotlight: true, id: 'a' },
  { score: 0.8, isSpotlight: false, id: 'b' },
  { score: 0.7, isSpotlight: false, id: 'c' },
  { score: 0.6, isSpotlight: false, id: 'd' }
];
const picked = applyExploration(ranked, 1, 3, () => 0);
assert.equal(picked.length, 3);
assert.ok(
  picked.every((p) => ranked.some((r) => r.id === p.id)),
  'exploration stays inside qualified set'
);

console.log('matching-scorer.spec.ts: ok');
