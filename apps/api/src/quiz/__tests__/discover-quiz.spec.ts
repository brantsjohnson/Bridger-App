// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure unit tests for Discover quiz complete: slug allow-list, score clamp,
// and the attribute mirror shape (none-tier + matchable).
// ============================================
import assert from 'node:assert/strict';
import { DISCOVER_QUIZ_IDS } from '@bridger/shared';

function isDiscoverQuizId(slug: string): boolean {
  return (DISCOVER_QUIZ_IDS as readonly string[]).includes(slug);
}

function sanitizeScores(
  rawScores: Record<string, number>,
  rawConf: Record<string, number>,
  allowedKeys: Set<string>
): {
  dimensionScores: Record<string, number>;
  confidence: Record<string, number>;
} {
  const dimensionScores: Record<string, number> = {};
  const confidence: Record<string, number> = {};
  for (const [key, value] of Object.entries(rawScores)) {
    if (allowedKeys.size && !allowedKeys.has(key)) continue;
    if (!Number.isFinite(value)) continue;
    dimensionScores[key] = Math.min(1, Math.max(0, Number(value)));
    const c = Number(rawConf[key]);
    confidence[key] = Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 1;
  }
  return { dimensionScores, confidence };
}

function mirrorRows(
  userId: string,
  slug: string,
  quizId: string,
  dimensionScores: Record<string, number>,
  labels: Record<string, string>,
  confidence: Record<string, number>
) {
  return Object.entries(dimensionScores).map(([dimensionKey, score]) => ({
    owner_id: userId,
    key: `quiz.${slug}.${dimensionKey}`,
    value: {
      score,
      label: labels[dimensionKey] ?? dimensionKey,
      quizId,
      confidence: confidence[dimensionKey] ?? 1
    },
    layer: 'profile' as const,
    visible_to_tier: 'none' as const,
    matchable: true
  }));
}

// --- slug allow-list ---
assert.equal(isDiscoverQuizId('humor'), true);
assert.equal(isDiscoverQuizId('personality'), true);
assert.equal(isDiscoverQuizId('values'), true);
assert.equal(isDiscoverQuizId('attachment'), true);
assert.equal(isDiscoverQuizId('disclosure'), false);
assert.equal(isDiscoverQuizId('weekly-fun'), false);

// --- completed list shape: slugs only, never scores ---
function completedPayload(slugs: string[]): { completed: string[] } {
  return { completed: [...new Set(slugs)] };
}
assert.deepEqual(completedPayload(['humor', 'humor', 'values']), {
  completed: ['humor', 'values']
});
assert.ok(!('scores' in completedPayload(['personality'])));

// --- sanitize + drop unknown / non-finite ---
const allowed = new Set(['absurdity', 'edge', 'breadth']);
const cleaned = sanitizeScores(
  { absurdity: 1.5, edge: -0.2, breadth: 0.6, sneaky: 1, bad: Number.NaN },
  { absurdity: 2, edge: 0.5 },
  allowed
);
assert.deepEqual(cleaned.dimensionScores, {
  absurdity: 1,
  edge: 0,
  breadth: 0.6
});
assert.equal(cleaned.confidence.absurdity, 1);
assert.equal(cleaned.confidence.edge, 0.5);
assert.equal(cleaned.confidence.breadth, 1, 'missing confidence defaults to 1');
assert.ok(!('sneaky' in cleaned.dimensionScores));

// --- empty scores rejected by caller ---
const empty = sanitizeScores({}, {}, allowed);
assert.equal(Object.keys(empty.dimensionScores).length, 0);

// --- attribute mirror privacy shape ---
const rows = mirrorRows(
  'user-1',
  'humor',
  'quiz-uuid',
  cleaned.dimensionScores,
  { absurdity: 'Absurd', edge: 'Edgy', breadth: 'Range' },
  cleaned.confidence
);
assert.equal(rows.length, 3);
for (const row of rows) {
  assert.equal(row.visible_to_tier, 'none');
  assert.equal(row.matchable, true);
  assert.ok(row.key.startsWith('quiz.humor.'));
  assert.equal(typeof row.value.score, 'number');
  assert.ok(!('answer' in row.value));
}

console.log('discover-quiz.spec.ts: ok');
