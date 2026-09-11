// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that an auto Friend Pod week always has rose, thorn, and bud,
// then the most-voted extras, then fill-ins. Also checks Monday math.
// ============================================
import assert from 'node:assert/strict';
import {
  ROSE_THORN_BUD,
  canListenPastWeek,
  composeAutoWeek,
  fillFromBank,
  isoWeekIndex,
  mondayUtc,
  needsRollover,
  pickTopVoted,
  takeAiFills,
  weekOfLabel
} from '../recap-week.math';

assert.equal(mondayUtc(new Date('2026-09-09T15:00:00.000Z')), '2026-09-07');
assert.equal(mondayUtc(new Date('2026-09-07T00:00:00.000Z')), '2026-09-07');
assert.equal(mondayUtc(new Date('2026-09-13T23:00:00.000Z')), '2026-09-07');
assert.equal(weekOfLabel('2026-09-07'), 'Week of 7 Sep');

assert.equal(canListenPastWeek(false, true), true);
assert.equal(canListenPastWeek(false, false), false);
assert.equal(canListenPastWeek(true, false), true);

assert.equal(needsRollover(null, '2026-09-07'), true);
assert.equal(needsRollover('2026-08-31', '2026-09-07'), true);
assert.equal(needsRollover('2026-09-07', '2026-09-07'), false);

const picked = pickTopVoted(
  [
    { id: 'a', text: 'Best thing you ate?', authorId: 'u1', votes: 2 },
    { id: 'b', text: 'What made you laugh?', authorId: 'u2', votes: 9 },
    { id: 'c', text: 'Used already', authorId: 'u3', votes: 99, used: true }
  ],
  2
);
assert.deepEqual(
  picked.map((q) => q.submittedId),
  ['b', 'a']
);
assert.equal(
  picked.every((q) => q.source === 'submitted'),
  true
);

const week = composeAutoWeek({
  submitted: [
    {
      id: 'a',
      text: 'What made you laugh this week?',
      authorId: 'u1',
      votes: 4
    }
  ],
  weekIndex: isoWeekIndex('2026-09-07')
});
assert.equal(week.length, 5);
assert.deepEqual(
  week.slice(0, 3).map((q) => q.text),
  [...ROSE_THORN_BUD]
);
assert.equal(week[3]?.text, 'What made you laugh this week?');
assert.equal(week[3]?.source, 'submitted');
assert.equal(week[4]?.source, 'builtin');

const withAi = composeAutoWeek({
  submitted: [],
  aiFills: ['What is your favorite thing that happened this week?'],
  weekIndex: 0
});
assert.equal(withAi[3]?.source, 'ai');
assert.match(String(withAi[3]?.text ?? ''), /favorite thing/);
assert.equal(withAi[4]?.source, 'builtin');

const rose = ROSE_THORN_BUD[0] ?? '';
const taken = takeAiFills(
  [rose, 'What did you learn this week?'],
  [...ROSE_THORN_BUD],
  2
);
assert.equal(taken.length, 1);
assert.equal(taken[0]?.text, 'What did you learn this week?');

const a = fillFromBank([], 1, 0)[0]?.text;
const b = fillFromBank([], 1, 1)[0]?.text;
assert.ok(a);
assert.ok(b);
assert.notEqual(a, b);

console.log('recap-week.spec: ok');
