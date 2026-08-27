// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves the "What J name are you..." scoring brain works: a max-J run scores
// 100%, the J-name winner is right, the hidden friend-type winner is right,
// and the J-name tie-breaker uses the "pad" question the way we designed.
// Run with: npx tsx apps/mobile/quizzes/what-j-name/score.spec.ts
// ============================================

import { scoreRun, resultCard, type QuizRun } from './engine';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// THIS SECTION DOES: a fully "J-coded" run. Two dark-purple Part 1 answers and
// all seven rapid-fire yeses should give 100%. Every Part 4 answer is index 0.
const maxJ: QuizRun = {
  part1: [
    { questionId: 'q_gender', answerId: 'man' },
    { questionId: 'q_extra_brain', answerId: 'yes' }
  ],
  rapidFire: [
    { id: 'sports', yes: true },
    { id: 'parents_dumb', yes: true },
    { id: 'beer', yes: true },
    { id: 'watched_game', yes: true },
    { id: 'gym_shorts', yes: true },
    { id: 'potty_mouth', yes: true },
    { id: 'j_name_start', yes: true }
  ],
  selectedBestFriends: ['Brad', 'Mike', 'Zack'],
  part4: [
    { questionId: 'phone_lock_screen', answerIndex: 0 },
    { questionId: 'sister', answerIndex: 0 },
    { questionId: 'saturday', answerIndex: 0 },
    { questionId: 'boys_need_you', answerIndex: 0 },
    { questionId: 'purchase', answerIndex: 0 },
    { questionId: 'gas_station', answerIndex: 0 },
    { questionId: 'fridge', answerIndex: 0 },
    { questionId: 'pad', answerIndex: 0 }
  ]
};

const out = scoreRun(maxJ);
assert(out.j_percentage === 100, `expected 100%, got ${out.j_percentage}`);
// Every Part 4 index 0 maps to Jake, so Jake should win with 8 points.
assert(out.j_name === 'Jake', `expected Jake, got ${out.j_name}`);
assert(out.j_name_scores.Jake === 8, `expected Jake=8, got ${out.j_name_scores.Jake}`);
// Paul is flagged on index-0 answers for q1,q3,q5,q7 = 4 times: the most.
assert(out.friend_type === 'Paul', `expected Paul, got ${out.friend_type}`);
assert(out.friend_scores.Paul === 4, `expected Paul=4, got ${out.friend_scores.Paul}`);
assert(
  out.selected_best_friends.join(',') === 'Brad,Mike,Zack',
  'selected best friends should pass through unchanged'
);

// THIS SECTION DOES: a low-J run. All light-pink Part 1 answers and all
// rapid-fire noes should give 0%.
const lowJ: QuizRun = {
  part1: [
    { questionId: 'q_gender', answerId: 'not_man' },
    { questionId: 'q_extra_brain', answerId: 'normal_brain' }
  ],
  rapidFire: maxJ.rapidFire.map((r) => ({ id: r.id, yes: false })),
  selectedBestFriends: ['Ed', 'Paul', 'Adam'],
  part4: maxJ.part4
};
assert(scoreRun(lowJ).j_percentage === 0, 'all light-pink + all no should be 0%');

// THIS SECTION DOES: force a J-name tie between Jake and Josh, then confirm the
// "pad" (Q8) answer breaks it. Q1-Q4 = Jake (idx0), Q5-Q7 = Josh (idx1), and
// Q8 pad = Josh (idx1). 4 vs 4, and pad says Josh, so Josh must win.
const tie: QuizRun = {
  part1: [],
  rapidFire: [],
  selectedBestFriends: ['Brad', 'Mike', 'Zack'],
  part4: [
    { questionId: 'phone_lock_screen', answerIndex: 0 }, // Jake
    { questionId: 'sister', answerIndex: 0 }, // Jake
    { questionId: 'saturday', answerIndex: 0 }, // Jake
    { questionId: 'boys_need_you', answerIndex: 0 }, // Jake
    { questionId: 'purchase', answerIndex: 1 }, // Josh
    { questionId: 'gas_station', answerIndex: 1 }, // Josh
    { questionId: 'fridge', answerIndex: 1 }, // Josh
    { questionId: 'pad', answerIndex: 1 } // Josh (tiebreaker)
  ]
};
const tieOut = scoreRun(tie);
assert(tieOut.j_name_scores.Jake === 4 && tieOut.j_name_scores.Josh === 4, 'expected a 4-4 tie');
assert(tieOut.j_name === 'Josh', `pad tiebreaker should pick Josh, got ${tieOut.j_name}`);

// THIS SECTION DOES: confirm each result carries its authored card content.
const jake = resultCard('Jake');
assert(!!jake, 'Jake card should exist');
assert(jake!.image === 'images/jake.png', `Jake image path wrong: ${jake!.image}`);
assert(jake!.redeeming_quality === 'BD', 'Jake redeeming quality wrong');
assert(jake!.red_flags.length === 7, 'Jake should have 7 red flags');
assert(jake!.text_thread[0].from === 'me', 'Jake thread should start with me');
assert(resultCard('Jonathan') === null, 'Jonathan should no longer exist (renamed to John)');
assert(!!resultCard('John'), 'John card should exist');

console.log('what-j-name/score.spec.ts ok');
