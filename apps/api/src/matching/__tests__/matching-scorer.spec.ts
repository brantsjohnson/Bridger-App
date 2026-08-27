// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure unit tests for scoring math that does not need a live database:
// zero-by-absence, per-shared-quiz alignment, evidence gate, exploration.
// ============================================
import assert from 'node:assert/strict';
import {
  MATCHING_FEATURES,
  MATCHING_V1_WEIGHTS,
  emptyMatchingFeatureRecord,
  normalizePairFeaturesSnapshot
} from '@bridger/shared';

function scoreFromFeatures(
  features: Partial<Record<string, number>>,
  weights = MATCHING_V1_WEIGHTS
): number {
  let s = 0;
  for (const f of MATCHING_FEATURES) {
    // Missing key → 0 (zero-by-absence).
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

/**
 * THIS SECTION DOES: mirror quiz_alignment's intersection rule —
 * only quizzes both people finished count; score = mean of those quiz scores.
 */
function quizAlignmentFromMaps(
  aQuizzes: Record<string, number>,
  bQuizzes: Record<string, number>
): { value: number; sharedQuizIds: string[] } {
  const sharedQuizIds: string[] = [];
  const quizScores: number[] = [];
  for (const id of Object.keys(aQuizzes)) {
    if (!(id in bQuizzes)) continue;
    sharedQuizIds.push(id);
    quizScores.push((aQuizzes[id]! + bQuizzes[id]!) / 2);
  }
  if (!quizScores.length) return { value: 0, sharedQuizIds };
  const value =
    quizScores.reduce((x, y) => x + y, 0) / quizScores.length;
  return { value, sharedQuizIds };
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

// --- zero-by-absence: omitted keys count as 0, not "skip the component" ---
const onlyAttrs = scoreFromFeatures({ shared_attributes: 1 });
assert.equal(
  onlyAttrs,
  MATCHING_V1_WEIGHTS.shared_attributes,
  'only shared_attributes present → other five contribute 0'
);

const allAbsent = scoreFromFeatures({});
assert.equal(allAbsent, 0, 'no features → score 0');

const partial = scoreFromFeatures({
  quiz_alignment: 0,
  embedding_similarity: 0.8,
  shared_attributes: 0.9,
  moderator_notes_affinity: 0,
  mutual_warmth: 0.7,
  context_fit: 0
});
assert.ok(partial > 0.4, 'partial features still produce a real score');
assert.equal(
  scoreFromFeatures({
    embedding_similarity: 0.8,
    shared_attributes: 0.9,
    mutual_warmth: 0.7
  }),
  partial,
  'explicit zeros vs omitted keys score the same'
);

// --- all six dictionary keys always present after normalize ---
const sparseSnap = normalizePairFeaturesSnapshot({
  features: { shared_attributes: 0.5 } as never,
  contribs: { shared_attributes: 0.15 } as never,
  score: 0.15,
  evidenceGatePassed: true
});
for (const f of MATCHING_FEATURES) {
  assert.ok(f in sparseSnap.features, `features.${f} present`);
  assert.ok(f in sparseSnap.contribs, `contribs.${f} present`);
}
assert.equal(sparseSnap.features.shared_attributes, 0.5);
assert.equal(sparseSnap.features.quiz_alignment, 0);
assert.equal(sparseSnap.contribs.embedding_similarity, 0);
assert.deepEqual(
  emptyMatchingFeatureRecord().quiz_alignment,
  0,
  'empty baseline is zero'
);

// --- per-shared-quiz: intersection only; one-sided ignored ---
const humorOnly = quizAlignmentFromMaps(
  { humor: 0.9 },
  { humor: 0.7, personality: 0.8 }
);
assert.deepEqual(humorOnly.sharedQuizIds, ['humor']);
assert.equal(humorOnly.value, (0.9 + 0.7) / 2);

const oneSided = quizAlignmentFromMaps(
  { personality: 0.9 },
  { humor: 0.9 }
);
assert.deepEqual(oneSided.sharedQuizIds, []);
assert.equal(oneSided.value, 0, 'no intersection → quiz_alignment 0');
assert.equal(
  evidenceGate(oneSided.sharedQuizIds.length, 0),
  false,
  'one-sided quizzes do not open the evidence gate'
);

const twoShared = quizAlignmentFromMaps(
  { personality: 1, values: 0.4, humor: 0.2 },
  { personality: 0.6, values: 0.8 }
);
assert.deepEqual(twoShared.sharedQuizIds.sort(), ['personality', 'values']);
assert.equal(
  twoShared.value,
  ((1 + 0.6) / 2 + (0.4 + 0.8) / 2) / 2,
  'mean over shared quizzes only'
);
assert.equal(
  evidenceGate(twoShared.sharedQuizIds.length, 0),
  true,
  'one+ shared quiz passes the quiz arm'
);

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
