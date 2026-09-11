// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that we keep the same photo link when only the token changed,
// and that the tab snapshot box remembers / forgets a page correctly.
// ============================================
import assert from 'node:assert/strict';
import { keepLoadedMediaUrl, mediaUrlKey } from '../media-url';
import { createTabSnapshotMemory } from '../tab-snapshots.math';

const sameFile =
  'https://storage.example/object/sign/avatars/abc.jpg?token=old';
const sameFileNewToken =
  'https://storage.example/object/sign/avatars/abc.jpg?token=new';
const otherFile =
  'https://storage.example/object/sign/avatars/xyz.jpg?token=new';

assert.equal(
  mediaUrlKey(sameFile),
  'https://storage.example/object/sign/avatars/abc.jpg'
);
assert.equal(keepLoadedMediaUrl(sameFile, sameFileNewToken), sameFile);
assert.equal(keepLoadedMediaUrl(sameFile, otherFile), otherFile);
assert.equal(keepLoadedMediaUrl(null, sameFileNewToken), sameFileNewToken);
assert.equal(keepLoadedMediaUrl(sameFile, null), null);

const mem = createTabSnapshotMemory();
assert.equal(mem.has('home'), false);
mem.set('home', { stories: [1] });
assert.equal(mem.has('home'), true);
assert.deepEqual(mem.get<{ stories: number[] }>('home'), { stories: [1] });

const bag = mem.serialize();
const other = createTabSnapshotMemory();
other.loadBag(bag);
assert.deepEqual(other.get<{ stories: number[] }>('home'), { stories: [1] });

mem.clear();
assert.equal(mem.has('home'), false);

console.log('tab-snapshots.spec.ts: ok');
