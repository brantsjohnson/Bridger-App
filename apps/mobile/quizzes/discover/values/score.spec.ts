// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks equal Schwartz coverage scoring, level conversion, and that
// adventure / giving dials lean the right way.
// ============================================
import { rawToLevel, scoreValues } from './score';

function pick(questionId: string, optionId: string) {
  return { questionId, optionId };
}

if (rawToLevel(0) !== 1) throw new Error('raw 0 → level 1');
if (rawToLevel(5) !== 5) throw new Error('raw 5 → level 5');
if (rawToLevel(12) !== 10) throw new Error('raw 12 → level 10');

const adventure = scoreValues([
  pick('v01', 'b'),
  pick('v02', 'a'),
  pick('v04', 'd'),
  pick('v05', 'd'),
  pick('v07', 'c'),
  pick('v08', 'c'),
  pick('v11', 'a'),
  pick('v12', 'a'),
  pick('v15', 'd'),
  pick('v21', 'a'),
  pick('v22', 'a'),
  pick('v25', 'd')
]);

const advDial = adventure.dials.find((d) => d.key === 'adventure_stability')!;
if (advDial.score == null || advDial.score < 0.55) {
  throw new Error(`expected adventure lean, got ${advDial.score}`);
}

const giving = scoreValues([
  pick('v02', 'd'),
  pick('v03', 'd'),
  pick('v05', 'c'),
  pick('v06', 'c'),
  pick('v09', 'a'),
  pick('v10', 'a'),
  pick('v13', 'd'),
  pick('v15', 'c'),
  pick('v19', 'a'),
  pick('v20', 'a'),
  pick('v28', 'b'),
  pick('v29', 'b')
]);
const giveDial = giving.dials.find((d) => d.key === 'giving_striving')!;
if (giveDial.score == null || giveDial.score < 0.55) {
  throw new Error(`expected giving lean, got ${giveDial.score}`);
}

const skipped = scoreValues([
  pick('v01', 'skip'),
  pick('v02', 'skip'),
  pick('v03', 'a')
]);
if (skipped.skippedCount !== 2) throw new Error('expected 2 skips');

const loyalty = adventure.dials.find((d) => d.key === 'loyalty_norms')!;
if (!loyalty.pending || loyalty.score != null) {
  throw new Error('loyalty should be pending until friendship pack');
}

console.log('values/score.spec.ts ok');
