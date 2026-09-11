// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that a new Inside Joke sorts first, shows on the poster's wall,
// and shows on the tagged friend's wall.
// ============================================
import assert from 'node:assert/strict';
import type { InsideJoke } from '@bridger/shared';
import {
  matchesInsideJokeFilter,
  newestInsideJokesFirst
} from '../inside-jokes.math';

const older: InsideJoke = {
  id: 'old',
  text: 'Older note',
  fromName: 'You',
  postedById: 'me',
  quotedId: 'me',
  createdAt: 100,
  accent: 'amber'
};

const posted: InsideJoke = {
  id: 'new',
  text: 'Bread is a warm friend',
  fromName: 'Jade',
  postedById: 'me',
  quotedId: 'maya',
  taggedIds: ['maya'],
  createdAt: 200,
  accent: 'pink'
};

const first = newestInsideJokesFirst([older, posted])[0];
assert.equal(first?.id, 'new');

assert.equal(matchesInsideJokeFilter(posted, 'all', 'me'), true);
assert.equal(matchesInsideJokeFilter(posted, 'by', 'me'), true);
assert.equal(matchesInsideJokeFilter(posted, 'about', 'me'), false);

assert.equal(matchesInsideJokeFilter(posted, 'all', 'maya'), true);
assert.equal(matchesInsideJokeFilter(posted, 'about', 'maya'), true);
assert.equal(matchesInsideJokeFilter(posted, 'by', 'maya'), false);

console.log('inside-jokes.spec.ts passed');
