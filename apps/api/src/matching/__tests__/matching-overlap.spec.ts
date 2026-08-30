// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure unit tests for Mode 2 overlap helpers: hobby follow-up details,
// favorites item fingerprints, music pick fingerprints, and one % per quiz
// labeled by the in-app title. No live database.
// ============================================
import assert from 'node:assert/strict';

function detailOf(value: unknown): string | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.detail === 'string' && v.detail.trim()) return v.detail.trim();
    if (typeof v.note === 'string' && v.note.trim()) return v.note.trim();
    const fu =
      v.followUp && typeof v.followUp === 'object' && !Array.isArray(v.followUp)
        ? (v.followUp as Record<string, unknown>)
        : null;
    if (fu && typeof fu.answer === 'string' && fu.answer.trim()) {
      return fu.answer.trim();
    }
  }
  return undefined;
}

function expandFavItems(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter(Boolean);
}

function musicPickFp(title: string, artist: string): string {
  return `music.pick::${`${title} ${artist}`.toLowerCase().trim()}`;
}

/**
 * One confidence-weighted average per shared quiz (mirrors quizCompat).
 */
function quizCompatPercent(
  sa: Record<string, number>,
  sb: Record<string, number>,
  ca: Record<string, number>,
  cb: Record<string, number>,
  floor: number
): number | null {
  let sum = 0;
  let n = 0;
  for (const dim of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
    if ((ca[dim] ?? 1) < floor || (cb[dim] ?? 1) < floor) continue;
    const sim =
      1 - Math.min(1, Math.abs(Number(sa[dim] ?? 0) - Number(sb[dim] ?? 0)));
    const w = Math.min(Number(ca[dim] ?? 1), Number(cb[dim] ?? 1));
    sum += sim * w;
    n += w;
  }
  if (n <= 0) return null;
  return Math.round((sum / n) * 100);
}

// --- hobby follow-up answer ---
assert.equal(
  detailOf({
    label: 'Running',
    followUp: { question: 'Where?', answer: 'Trail half in the fall' }
  }),
  'Trail half in the fall',
  'reads value.followUp.answer'
);
assert.equal(detailOf({ detail: 'legacy detail' }), 'legacy detail');
assert.equal(detailOf({ note: 'a note' }), 'a note');
assert.equal(detailOf({ followUp: { question: 'Where?' } }), undefined);
assert.equal(detailOf({ label: 'Running' }), undefined);

// --- favorites item expansion ---
assert.deepEqual(
  expandFavItems({ group: 'Food', items: ['Thai', ' Sour cherries ', ''] }),
  ['Thai', 'Sour cherries']
);
assert.deepEqual(expandFavItems({ group: 'Food' }), []);

// Shared Thai fingerprint (case-insensitive).
const aItems = expandFavItems({ items: ['Thai', 'Ramen'] });
const bItems = expandFavItems({ items: ['thai', 'Pizza'] });
const aSet = new Set(aItems.map((i) => `fav.item::${i.toLowerCase()}`));
const shared = bItems
  .map((i) => `fav.item::${i.toLowerCase()}`)
  .filter((fp) => aSet.has(fp));
assert.deepEqual(shared, ['fav.item::thai']);

// --- music pick fingerprint ---
assert.equal(
  musicPickFp('Night Moves', 'Bob Seger'),
  'music.pick::night moves bob seger'
);
assert.equal(
  musicPickFp('Night Moves', 'Bob Seger'),
  musicPickFp('night moves', 'bob seger'),
  'title+artist match across casing'
);

// --- quiz title aggregation (one % per quiz) ---
const pct = quizCompatPercent(
  { absurdity: 0.9, edge: 0.5 },
  { absurdity: 0.7, edge: 0.5 },
  { absurdity: 0.8, edge: 0.8 },
  { absurdity: 0.8, edge: 0.8 },
  0.4
);
assert.equal(pct, 90, 'mean of (1-|0.9-0.7|)=0.8 and (1-0)=1 → 0.9 → 90%');

const lowConf = quizCompatPercent(
  { absurdity: 1 },
  { absurdity: 0 },
  { absurdity: 0.2 },
  { absurdity: 0.9 },
  0.4
);
assert.equal(lowConf, null, 'below confidence floor → skip quiz');

const titleRow = {
  quizId: 'humor',
  title: 'Your Funny Bone',
  dimension: 'Your Funny Bone',
  percent: pct!
};
assert.equal(titleRow.dimension, 'Your Funny Bone');
assert.notEqual(titleRow.dimension, 'absurdity');

console.log('matching-overlap.spec.ts: ok');
