// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves Close-friend labels pull weights toward the features those pairs
// actually shared, and that we will not flip live weights on a tiny sample.
// ============================================
import assert from 'node:assert/strict';
import {
  MATCHING_V1_WEIGHTS,
  emptyMatchingFeatureRecord,
  normalizePairFeaturesSnapshot
} from '@bridger/shared';
import {
  proposeMatchingWeights,
  shouldActivateLearnedWeights,
  type LearnRow
} from '../matching-learn.math';

function row(
  outcome: LearnRow['outcome'],
  weight: number,
  features: Partial<ReturnType<typeof emptyMatchingFeatureRecord>>
): LearnRow {
  return {
    outcome,
    weight,
    snapshot: normalizePairFeaturesSnapshot({
      features: { ...emptyMatchingFeatureRecord(), ...features }
    })
  };
}

const closeHobby = Array.from({ length: 20 }, () =>
  row('close', 1, { shared_attributes: 0.95, quiz_alignment: 0.2 })
);
const dismissedQuiz = Array.from({ length: 20 }, () =>
  row('dismissed', -0.3, { shared_attributes: 0.1, quiz_alignment: 0.9 })
);

const proposed = proposeMatchingWeights(
  [...closeHobby, ...dismissedQuiz],
  MATCHING_V1_WEIGHTS,
  3000
);
assert.ok(
  proposed.weights.shared_attributes > proposed.weights.quiz_alignment,
  'Close pairs who shared hobbies should lift shared_attributes'
);
assert.equal(proposed.closeCount, 20);
assert.equal(shouldActivateLearnedWeights(proposed, 3000, 40), false);

const lots: LearnRow[] = [];
for (let i = 0; i < 1600; i++) {
  lots.push(row('close', 1, { shared_attributes: 0.9, quiz_alignment: 0.2 }));
  lots.push(row('dismissed', -0.3, { shared_attributes: 0.1, quiz_alignment: 0.85 }));
}
const big = proposeMatchingWeights(lots, MATCHING_V1_WEIGHTS, 3000);
assert.equal(big.labeled, 3200);
assert.ok(big.closeCount >= 40);
assert.equal(shouldActivateLearnedWeights(big, 3000, 40), true);

console.log('matching-learn.spec.ts: ok');
