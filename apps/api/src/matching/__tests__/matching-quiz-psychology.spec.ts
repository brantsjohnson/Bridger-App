// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves each Personality quiz uses its own matching rule: same humor is
// good, opposite assertiveness is good, Friend Zone uses the style chart,
// emotional sensitivity never gates a match.
// ============================================
import assert from 'node:assert/strict';
import {
  attachmentStyleFromDials,
  pairDimensionScore,
  quizDimMatchMode,
  sharedQuizAlignment
} from '@bridger/shared';

assert.equal(quizDimMatchMode('humor', 'absurdity'), 'similarity');
assert.equal(quizDimMatchMode('values', 'adventure'), 'similarity');
assert.equal(quizDimMatchMode('personality', 'agreeableness'), 'similarity');
assert.equal(
  quizDimMatchMode('personality', 'assertiveness'),
  'complementarity'
);
assert.equal(quizDimMatchMode('personality', 'neuroticism'), 'none');
assert.equal(quizDimMatchMode('attachment', 'anxiety'), 'matrix');

assert.equal(pairDimensionScore('similarity', 0.9, 0.8), 0.9);
assert.equal(pairDimensionScore('complementarity', 0.9, 0.2), 0.7);
assert.equal(pairDimensionScore('complementarity', 0.9, 0.9), 0);
assert.equal(pairDimensionScore('none', 0.9, 0.1), null);

assert.equal(attachmentStyleFromDials(0.2, 0.2), 'secure');
assert.equal(attachmentStyleFromDials(0.8, 0.2), 'anxious');
assert.equal(attachmentStyleFromDials(0.2, 0.8), 'avoidant');
assert.equal(attachmentStyleFromDials(0.8, 0.8), 'fearful');

const humorSame = sharedQuizAlignment({
  quizSlug: 'humor',
  scoresA: { absurdity: 0.9 },
  scoresB: { absurdity: 0.85 },
  confA: { absurdity: 1 },
  confB: { absurdity: 1 },
  confidenceFloor: 0.4
});
const humorOpp = sharedQuizAlignment({
  quizSlug: 'humor',
  scoresA: { absurdity: 0.9 },
  scoresB: { absurdity: 0.1 },
  confA: { absurdity: 1 },
  confB: { absurdity: 1 },
  confidenceFloor: 0.4
});
assert.ok(
  (humorSame ?? 0) > (humorOpp ?? 0),
  'similar humor beats opposite humor'
);

const leadFollow = sharedQuizAlignment({
  quizSlug: 'personality',
  scoresA: { assertiveness: 0.9, agreeableness: 0.7 },
  scoresB: { assertiveness: 0.2, agreeableness: 0.7 },
  confA: { assertiveness: 1, agreeableness: 1 },
  confB: { assertiveness: 1, agreeableness: 1 },
  confidenceFloor: 0.4
});
const twoLeads = sharedQuizAlignment({
  quizSlug: 'personality',
  scoresA: { assertiveness: 0.9, agreeableness: 0.7 },
  scoresB: { assertiveness: 0.9, agreeableness: 0.7 },
  confA: { assertiveness: 1, agreeableness: 1 },
  confB: { assertiveness: 1, agreeableness: 1 },
  confidenceFloor: 0.4
});
assert.ok(
  (leadFollow ?? 0) > (twoLeads ?? 0),
  'leader + go-along scores above two leaders'
);

const securePair = sharedQuizAlignment({
  quizSlug: 'attachment',
  scoresA: { anxiety: 0.2, avoidance: 0.2 },
  scoresB: { anxiety: 0.2, avoidance: 0.2 },
  confA: { anxiety: 1, avoidance: 1 },
  confB: { anxiety: 1, avoidance: 1 },
  confidenceFloor: 0.4
});
const trapPair = sharedQuizAlignment({
  quizSlug: 'attachment',
  scoresA: { anxiety: 0.8, avoidance: 0.2 },
  scoresB: { anxiety: 0.2, avoidance: 0.8 },
  confA: { anxiety: 1, avoidance: 1 },
  confB: { anxiety: 1, avoidance: 1 },
  confidenceFloor: 0.4
});
assert.equal(securePair, 1);
assert.equal(trapPair, 0.25);

const skipNeuro = sharedQuizAlignment({
  quizSlug: 'personality',
  scoresA: { neuroticism: 0.9, agreeableness: 0.8 },
  scoresB: { neuroticism: 0.1, agreeableness: 0.8 },
  confA: { neuroticism: 1, agreeableness: 1 },
  confB: { neuroticism: 1, agreeableness: 1 },
  confidenceFloor: 0.4
});
assert.equal(skipNeuro, 1, 'emotional sensitivity is not a match gate');

console.log('matching-quiz-psychology.spec.ts: ok');
