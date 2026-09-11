// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves the Profile list loaders won't crash when the API hands back rows
// whose `value` is missing (null/undefined). We feed the pure helpers a mix
// of good rows and empty rows and check the empty ones are dropped and the
// good ones come back in their saved order (Top 5 / Obsession).
// ============================================
import assert from 'node:assert/strict';
import { compactValues, compactSortedByOrder } from '../profile.math';

// --- Plain lists (Favorites, This-or-that, Places): empty rows fall away ---
const favRows = [
  { value: { group: 'Food', emoji: '🍜', items: ['ramen'], total: 1 } },
  { value: null },
  { value: undefined },
  { value: { group: 'Sports', emoji: '🚲', items: ['cycling'], total: 1 } }
];
const favs = compactValues(favRows);
assert.equal(favs.length, 2);
assert.deepEqual(
  favs.map((f) => f.group),
  ['Food', 'Sports']
);

// A response that is entirely null rows returns an empty list, not a crash.
assert.deepEqual(compactValues([{ value: null }, { value: undefined }]), []);

// --- Ordered lists (Top 5 / Obsession): filter THEN sort, never read null ---
const top5Rows = [
  { value: { id: 'b', text: 'Second', order: 1 } },
  { value: null },
  { value: { id: 'a', text: 'First', order: 0 } },
  { value: undefined },
  { value: { id: 'c', text: 'Third', order: 2 } }
];
// Before the fix this line threw: the sort comparator read `.order` off null.
const top5 = compactSortedByOrder(top5Rows);
assert.deepEqual(
  top5.map((t) => t.id),
  ['a', 'b', 'c']
);

console.log('profile-null-guard.spec.ts passed');
