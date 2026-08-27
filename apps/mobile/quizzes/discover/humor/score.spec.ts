// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that wholesome media leans low on edge, absurdist media leans high
// on absurdity, and more clusters raise breadth.
// ============================================
import { scoreHumor } from './score';

function ans(questionId: string, ...optionIds: string[]) {
  return { questionId, optionIds };
}

// Same-cluster warm workplace picks → narrow palate.
const nicheWholesome = scoreHumor([
  ans('h01', 'c'),
  ans('h02', 'c'),
  ans('h03', 'c'),
  ans('h04', 'd'),
  ans('h05', 'parks', 'b99', 'abbott'),
  ans('h06', 'meangirls'),
  ans('h07', 'nate'),
  ans('h08', 'ron'),
  ans('h09', 'a'),
  ans('h10', 'b'),
  ans('h11', 'b'),
  ans('h12', 'a'),
  ans('h13', 'a', 'f'),
  ans('h14', 'e'),
  ans('h15', 'e'),
  ans('h16', 'a'),
  ans('h17', 'a'),
  ans('h18', 'a'),
  ans('h19', 'd'),
  ans('h20', 'd')
]);

const edge = nicheWholesome.axes.find((a) => a.key === 'edge')!;
if (edge.score > 0.45) {
  throw new Error(`expected wholesome edge lean, got ${edge.score}`);
}

const chaotic = scoreHumor([
  ans('h01', 'f', 'g'),
  ans('h02', 'd'),
  ans('h03', 'e'),
  ans('h04', 'e'),
  ans('h05', 'sunny', 'itysl', 'community', 'arrested'),
  ans('h06', 'python', 'airplane', 'bottoms'),
  ans('h07', 'bo', 'conan'),
  ans('h08', 'gob', 'abed'),
  ans('h09', 'e'),
  ans('h10', 'e'),
  ans('h11', 'e'),
  ans('h12', 'c'),
  ans('h13', 'c', 'e'),
  ans('h14', 'c'),
  ans('h15', 'c'),
  ans('h16', 'f'),
  ans('h17', 'd'),
  ans('h18', 'e'),
  ans('h19', 'e'),
  ans('h20', 'e')
]);

const absurd = chaotic.axes.find((a) => a.key === 'absurdity')!;
if (absurd.score < 0.55) {
  throw new Error(`expected high absurdity, got ${absurd.score}`);
}

if (chaotic.breadth <= nicheWholesome.breadth) {
  throw new Error(
    `expected chaotic breadth > niche (${chaotic.breadth} vs ${nicheWholesome.breadth})`
  );
}

if (nicheWholesome.matchBandHalfWidth >= chaotic.matchBandHalfWidth) {
  throw new Error('omnivore should have a wider match band');
}

console.log('humor/score.spec.ts ok');
