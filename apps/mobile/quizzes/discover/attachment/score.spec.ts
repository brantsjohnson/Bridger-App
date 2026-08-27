// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that The Friend Zone scoring separates anxiety from avoidance, and
// that the Q13→Q14 pair changes the result the way we designed.
// ============================================
import { attachmentMatchScore } from './dimensions';
import { scoreAttachment } from './score';

function pick(questionId: string, ...optionIds: string[]) {
  return { questionId, optionIds };
}

// Secure-leaning pattern
const secureish = scoreAttachment([
  pick('a01', 'a'),
  pick('a02', 'b'),
  pick('a03', 'a'),
  pick('a04', 'a'),
  pick('a05', 'a'),
  pick('a09', 'a'),
  pick('a12', 'a'),
  pick('a13', 'c'),
  pick('a14', 'a'),
  pick('a15', 'a'),
  pick('a20', 'a')
]);
if (secureish.style !== 'secure' && secureish.anxiety > 50) {
  throw new Error(`expected secure-leaning, got ${secureish.style} anx=${secureish.anxiety}`);
}

// Pair: exposed when uncertain, relaxes when safe → anxiety not avoidance
const conditional = scoreAttachment([
  pick('a13', 'a'),
  pick('a14', 'a'),
  pick('a05', 'c'),
  pick('a08', 'd'),
  pick('a10', 'b')
]);
const persistent = scoreAttachment([
  pick('a13', 'a'),
  pick('a14', 'd'),
  pick('a05', 'c'),
  pick('a08', 'd'),
  pick('a10', 'b')
]);
if (persistent.avoidance <= conditional.avoidance) {
  throw new Error(
    `expected higher avoidance when discomfort persists after safety (${persistent.avoidance} vs ${conditional.avoidance})`
  );
}
if (!conditional.notes.some((n) => n.includes('uncertain_then_relax'))) {
  throw new Error('expected pair note for relax-after-safety');
}

// Matrix: anxious + avoidant is the trap
const trap = attachmentMatchScore('anxious', 'avoidant');
const ideal = attachmentMatchScore('secure', 'secure');
if (trap >= 0.4) throw new Error(`anxious+avoidant should be low, got ${trap}`);
if (ideal < 0.95) throw new Error(`two secures should be ideal, got ${ideal}`);

console.log('attachment/score.spec.ts ok');
