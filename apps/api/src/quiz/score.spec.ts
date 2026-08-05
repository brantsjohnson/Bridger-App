// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny checks that scoreFromWeights sums and normalizes the way we expect.
// Run with: npm test (from apps/api).
// ============================================
import assert from 'node:assert/strict';
import { scoreFromWeights, topDimensionKey, topOptionLabel } from './score';

// Empty input → empty scores.
assert.deepEqual(scoreFromWeights([]), {});

// Single option with one dimension → that dimension is 1.
assert.deepEqual(scoreFromWeights([{ spontaneity: 3 }]), {
  spontaneity: 1
});

// Two dimensions: stronger one is 1, weaker is the ratio.
assert.deepEqual(
  scoreFromWeights([{ a: 2, b: 1 }, { a: 2 }]),
  { a: 1, b: 0.25 }
);

// Zero weights stay zero.
assert.deepEqual(scoreFromWeights([{ a: 0, b: 0 }]), { a: 0, b: 0 });

// Top helpers.
assert.equal(
  topOptionLabel([
    { label: 'Planner', weights: { planning: 1 } },
    { label: 'Coastal cruiser', weights: { chill: 5, fun: 2 } }
  ]),
  'Coastal cruiser'
);
assert.equal(topDimensionKey({ a: 0.2, b: 0.9, c: 0.5 }), 'b');

console.log('score.spec.ts: all assertions passed');
