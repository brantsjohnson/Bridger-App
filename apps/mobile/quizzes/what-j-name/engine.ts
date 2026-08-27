// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the "brain" of the "What J name are you..." quiz. It takes what a
// person tapped during the quiz and turns it into their final result: their
// J-percentage (how "J-coded" they are), which J-name they are most like, a
// hidden friend-type read, and the three real friends they picked. It follows
// the authored quiz.json EXACTLY. There is no AI and no guessing here so the
// same answers always give the same result (deterministic scoring).
// ============================================

import quiz from './quiz.json';

// THIS SECTION DOES: describe the shapes we read out of quiz.json so the rest
// of the file has real types instead of "any".
type ScoreBlock = { j_percentage?: number };
type FlowAnswer = { id: string; score?: ScoreBlock };
type FlowQuestion = { id: string; type: string; part?: number; answers?: FlowAnswer[] };
type RapidFireQ = { id: string; yes_score: number; no_score: number };
type Part4Answer = { text: string; j_name: string; friend_signals: string[] };
type Part4Q = { id: string; is_primary_j_name_tiebreaker?: boolean; answers: Part4Answer[] };

const FLOW = quiz.flow as FlowQuestion[];
const RAPID_FIRE = quiz.rapid_fire as RapidFireQ[];
const PART4 = (quiz.part4 as { questions: Part4Q[] }).questions;
const FRIEND_NAMES = Object.keys(
  (quiz.scoring as { friend_type: { friend_types: Record<string, string> } }).friend_type
    .friend_types
);
const J_NAMES = Object.keys(quiz.j_name_results as Record<string, unknown>);

// THIS SECTION DOES: describe what one full run of the quiz looks like as input
// to the scorer. We record exactly what the person encountered and picked.
export type QuizRun = {
  /** Part 1 answers, only the questions the person actually saw, in order. */
  part1: Array<{ questionId: string; answerId: string }>;
  /** The 7 rapid-fire yes/no answers. */
  rapidFire: Array<{ id: string; yes: boolean }>;
  /** The 3 friend archetypes the person picked in Part 3. */
  selectedBestFriends: string[];
  /** The 8 Part 4 picks, given as the chosen answer's index per question id. */
  part4: Array<{ questionId: string; answerIndex: number }>;
};

// THIS SECTION DOES: describe the final result object the app stores/shares.
export type QuizOutput = {
  j_percentage: number;
  j_name: string;
  j_name_scores: Record<string, number>;
  friend_type: string;
  friend_scores: Record<string, number>;
  selected_best_friends: string[];
};

// THIS SECTION DOES: build quick lookups so scoring is fast and readable.
const flowQuestionsById = new Map<string, FlowQuestion>();
for (const item of FLOW) {
  if (item.type === 'question') flowQuestionsById.set(item.id, item);
}
const rapidFireById = new Map<string, RapidFireQ>();
for (const rf of RAPID_FIRE) rapidFireById.set(rf.id, rf);
const part4ById = new Map<string, Part4Q>();
for (const q of PART4) part4ById.set(q.id, q);

// --- J-PERCENTAGE: how "J-coded" you are ---
// Every scorable question you actually saw counts. You earn 1 for a dark-purple
// answer, 0 for a light-pink one. The denominator is the most points those
// questions COULD have given you, so all-zero questions never drag you down.
function scoreJPercentage(run: QuizRun): number {
  let points = 0;
  let maxPoints = 0;

  for (const a of run.part1) {
    const q = flowQuestionsById.get(a.questionId);
    if (!q || !q.answers) continue;
    const best = Math.max(...q.answers.map((o) => o.score?.j_percentage ?? 0));
    if (best <= 0) continue; // question can't award a point; skip denominator
    const chosen = q.answers.find((o) => o.id === a.answerId);
    points += chosen?.score?.j_percentage ?? 0;
    maxPoints += best;
  }

  for (const a of run.rapidFire) {
    const rf = rapidFireById.get(a.id);
    if (!rf) continue;
    const best = Math.max(rf.yes_score, rf.no_score);
    if (best <= 0) continue;
    points += a.yes ? rf.yes_score : rf.no_score;
    maxPoints += best;
  }

  if (maxPoints <= 0) return 0;
  return Math.round((100 * points) / maxPoints);
}

// --- J-NAME: which J are you most like ---
// Each of the 8 Part 4 answers adds +1 to its mapped J-name. Highest total wins.
// Ties break on Q8 (the "pad" question) first, then Q7..Q1 in reverse order.
function scoreJName(run: QuizRun): { jName: string; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const n of J_NAMES) scores[n] = 0;

  const answerFor = (questionId: string): Part4Answer | undefined => {
    const pick = run.part4.find((p) => p.questionId === questionId);
    const q = part4ById.get(questionId);
    if (!pick || !q) return undefined;
    return q.answers[pick.answerIndex];
  };

  for (const q of PART4) {
    const ans = answerFor(q.id);
    if (ans) scores[ans.j_name] = (scores[ans.j_name] ?? 0) + 1;
  }

  const top = Math.max(...Object.values(scores));
  const leaders = Object.keys(scores).filter((n) => scores[n] === top);
  if (leaders.length === 1) return { jName: leaders[0], scores };

  // Tie-break: prefer the primary tiebreaker question (Q8 "pad"), then walk
  // the earlier Part 4 questions from last to first.
  const primary = PART4.find((q) => q.is_primary_j_name_tiebreaker);
  const order = [
    ...(primary ? [primary.id] : []),
    ...[...PART4].reverse().map((q) => q.id)
  ];
  for (const qid of order) {
    const ans = answerFor(qid);
    if (ans && leaders.includes(ans.j_name)) return { jName: ans.j_name, scores };
  }
  return { jName: leaders[0], scores };
}

// --- FRIEND TYPE: the hidden read on what kind of friend you are ---
// Each Part 4 answer can flag one or two friend types (+1 each). Highest wins.
// Ties break by walking Q8..Q1 and taking the most recent answer that flags
// exactly one of the tied friends; if nothing resolves it, pick one at random.
function scoreFriendType(
  run: QuizRun,
  rng: () => number
): { friendType: string; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const n of FRIEND_NAMES) scores[n] = 0;

  const answerFor = (questionId: string): Part4Answer | undefined => {
    const pick = run.part4.find((p) => p.questionId === questionId);
    const q = part4ById.get(questionId);
    if (!pick || !q) return undefined;
    return q.answers[pick.answerIndex];
  };

  for (const q of PART4) {
    const ans = answerFor(q.id);
    if (!ans) continue;
    for (const f of ans.friend_signals) scores[f] = (scores[f] ?? 0) + 1;
  }

  const top = Math.max(...Object.values(scores));
  const leaders = Object.keys(scores).filter((n) => scores[n] === top);
  if (leaders.length === 1) return { friendType: leaders[0], scores };

  for (const q of [...PART4].reverse()) {
    const ans = answerFor(q.id);
    if (!ans) continue;
    const hits = ans.friend_signals.filter((f) => leaders.includes(f));
    if (hits.length === 1) return { friendType: hits[0], scores };
  }
  const pick = leaders[Math.floor(rng() * leaders.length)] ?? leaders[0];
  return { friendType: pick, scores };
}

// THIS SECTION DOES: run all four scores and hand back the final result object.
// `rng` is injectable only so tests can make the rare random tie deterministic.
export function scoreRun(run: QuizRun, rng: () => number = Math.random): QuizOutput {
  const jPercentage = scoreJPercentage(run);
  const jn = scoreJName(run);
  const ft = scoreFriendType(run, rng);
  return {
    j_percentage: jPercentage,
    j_name: jn.jName,
    j_name_scores: jn.scores,
    friend_type: ft.friendType,
    friend_scores: ft.scores,
    selected_best_friends: [...run.selectedBestFriends]
  };
}

// THIS SECTION DOES: pick the top N J-names by score (used for "your version of
// X" notifications: a friend landed on one of your top three).
export function topJNames(
  scores: Record<string, number>,
  n = 3
): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([name]) => name);
}

// THIS SECTION DOES: expose the authored result card content (description,
// picture, redeeming quality, red flags, quote, me/them text thread) so the
// result screen can render it without re-parsing the JSON everywhere.
export type ThreadLine = { from: 'me' | 'them'; text: string; action?: boolean };
export type ResultCard = {
  jName: string;
  description: string;
  image: string;
  redeeming_quality: string;
  red_flags: string[];
  quote: string;
  text_thread: ThreadLine[];
};

export function resultCard(jName: string): ResultCard | null {
  const all = quiz.j_name_results as Record<string, Omit<ResultCard, 'jName'>>;
  const found = all[jName];
  if (!found) return null;
  return { jName, ...found };
}
