// ============================================
// WHAT THIS FILE DOES (plain English):
// Quick checks that Your Vibe scoring leans the right way and that symptom
// follow-ups soften confidence (especially with disclosure).
// ============================================
import { scorePersonality } from './score';

function pick(questionId: string, ...optionIds: string[]) {
  return { questionId, optionIds };
}

// High sociability + assertiveness pattern
const outgoing = [
  pick('p01', 'a'),
  pick('p06', 'a'),
  pick('p11', 'a'),
  pick('p16', 'a'),
  pick('p21', 'a'),
  pick('p26', 'a'),
  pick('p30', 'a'),
  pick('p31', 'a'),
  pick('p46', 'a')
];

const result = scorePersonality(outgoing);
const soc = result.traits.find((t) => t.key === 'sociability')!;
const assert_ = result.traits.find((t) => t.key === 'assertiveness')!;
if (soc.score < 0.6) {
  throw new Error(`expected high sociability, got ${soc.score}`);
}
if (assert_.score < 0.55) {
  throw new Error(`expected elevated assertiveness, got ${assert_.score}`);
}

// Symptom follow-up + ADHD disclosure should dampen conscientiousness confidence
const withSymptom = scorePersonality(
  [
    pick('p02', 'a'),
    pick('p07', 'a'),
    pick('p51', 'b') // wanted to but could not start
  ],
  {
    status: 'completed',
    matchingEnabled: true,
    matchWeightPreference: 'a_little',
    items: [{ conditionKey: 'adhd', impactLevel: 4 }]
  }
);
const cons = withSymptom.traits.find((t) => t.key === 'conscientiousness')!;
const baseline = scorePersonality([pick('p02', 'a'), pick('p07', 'a')]).traits.find(
  (t) => t.key === 'conscientiousness'
)!;
if (cons.confidence >= baseline.confidence) {
  throw new Error(
    `expected lower conscientiousness confidence with ADHD + execution flag (${cons.confidence} vs ${baseline.confidence})`
  );
}
if (!withSymptom.symptomFlags.includes('_execution_block')) {
  throw new Error('expected _execution_block flag');
}

const neuro = result.traits.find((t) => t.key === 'neuroticism')!;
if (neuro.matchable) {
  throw new Error('neuroticism must not be matchable');
}

console.log('personality/score.spec.ts ok');
