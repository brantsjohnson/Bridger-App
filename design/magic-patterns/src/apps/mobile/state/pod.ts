import { Tier } from '../../../packages/shared';

export interface RecapWeek {
  id: string;
  weekOf: string;
  /** the 5 — set by rotation or drawn from friend submissions */
  questions: string[];
}

export interface RecapAnswer {
  weekId: string;
  authorId: string;
  /** 0–4 */
  questionIndex: number;
  /** recorded in-app, ~45s */
  audioUrl: string;
  /** seconds — drives the scrubber */
  duration: number;
  visibleToTier: Tier;
}

export const RECAP_WEEK: RecapWeek = {
  id: 'w31',
  weekOf: 'Week of 27 Jul',
  questions: [
  'High of the week?',
  'Best thing this week?',
  'What are you stuck on?',
  'Who did you see?',
  'Next week, one plan?']

};

const SPEAKERS = ['ines', 'maya', 'devon', 'kit', 'nour'];

/** Roundtable order: everyone on Q1, then everyone on Q2. */
export const RECAP_ANSWERS: RecapAnswer[] = RECAP_WEEK.questions.flatMap((_, qi) =>
SPEAKERS.map((authorId, si) => ({
  weekId: RECAP_WEEK.id,
  authorId,
  questionIndex: qi,
  audioUrl: `bridger://recap/${RECAP_WEEK.id}/${authorId}/${qi}`,
  duration: 28 + (si * 7 + qi * 5) % 18,
  visibleToTier: (si === 4 ? 'close' : 'friend') as Tier
}))
);

export type PollOption = {
  id: string;
  label: string;
  votes: number;
  /** who picked it — a poll among friends is never anonymous */
  voterIds?: string[];
};

export type PollReply = {id: string;authorId: string;text: string;time: string;};

export interface HomePoll {
  id: string;
  kind: 'poll' | 'question';
  authorId: string;
  prompt: string;
  options: PollOption[];
  /** which option you picked */
  myVote?: string;
  replies?: number;
  /** for questions: the actual answers */
  replyList?: PollReply[];
  /** everyone it went out to, so "yet to vote" is knowable */
  askedIds?: string[];
  audience?: string;
  /** set once it stops taking answers — the archive reads this */
  closedAt?: string;
}

export const HOME_POLLS: HomePoll[] = [
{
  id: 'p1',
  kind: 'poll',
  authorId: 'me',
  prompt: 'Best taco spot?',
  audience: 'Friends',
  askedIds: ['maya', 'devon', 'kit', 'ines', 'nour', 'theo'],
  options: [
  { id: 'o1', label: 'El Rey', votes: 3, voterIds: ['maya', 'devon', 'kit'] },
  { id: 'o2', label: 'La Playa', votes: 1, voterIds: ['ines'] },
  { id: 'o3', label: 'Nixta', votes: 1, voterIds: ['nour'] }]

},
{
  id: 'p2',
  kind: 'question',
  authorId: 'me',
  prompt: 'Anyone got a good dentist?',
  audience: 'Friends',
  options: [],
  replies: 4,
  replyList: [
  { id: 'r1', authorId: 'maya', text: 'Dr. Okafor on Alberta. Painless.', time: '2h' },
  { id: 'r2', authorId: 'devon', text: 'Same one, been going five years.', time: '2h' },
  { id: 'r3', authorId: 'kit', text: 'Avoid the place on Belmont.', time: '1h' },
  { id: 'r4', authorId: 'ines', text: 'I can text you mine tonight.', time: '40m' }]

},
{
  id: 'p3',
  kind: 'poll',
  authorId: 'maya',
  prompt: 'Camp or cabin?',
  audience: 'Close friends',
  askedIds: ['me', 'devon', 'kit', 'ines', 'nour', 'theo'],
  options: [
  { id: 'o1', label: 'Camp', votes: 2, voterIds: ['devon', 'kit'] },
  { id: 'o2', label: 'Cabin', votes: 3, voterIds: ['me', 'ines', 'nour'] }]

}];


/** Closed polls and questions — the archive behind "See previous polls." */
export const PREVIOUS_POLLS: HomePoll[] = [
{
  id: 'pp1',
  kind: 'poll',
  authorId: 'me',
  prompt: 'Where for my birthday?',
  audience: 'Friends',
  closedAt: 'Closed 2 weeks ago',
  askedIds: ['maya', 'devon', 'kit', 'ines', 'nour', 'theo'],
  myVote: 'o2',
  options: [
  { id: 'o1', label: 'The old bowling alley', votes: 2, voterIds: ['devon', 'theo'] },
  { id: 'o2', label: 'Backyard, potluck', votes: 4, voterIds: ['me', 'maya', 'kit', 'ines'] },
  { id: 'o3', label: 'Karaoke', votes: 1, voterIds: ['nour'] }]

},
{
  id: 'pp2',
  kind: 'question',
  authorId: 'me',
  prompt: 'Anyone have a truck I could borrow Saturday?',
  audience: 'Close friends',
  closedAt: 'Closed last month',
  options: [],
  replies: 3,
  replyList: [
  { id: 'r1', authorId: 'theo', text: 'Mine is free after 10. Keys are under the mat.', time: '3w' },
  { id: 'r2', authorId: 'kit', text: 'I can help load if you need hands.', time: '3w' },
  { id: 'r3', authorId: 'maya', text: 'Too late but I have a dolly.', time: '3w' }]

},
{
  id: 'pp3',
  kind: 'poll',
  authorId: 'me',
  prompt: 'Which photo for the zine cover?',
  audience: 'Friends',
  closedAt: 'Closed last month',
  askedIds: ['maya', 'devon', 'kit', 'ines'],
  myVote: 'o1',
  options: [
  { id: 'o1', label: 'The one with the dog', votes: 3, voterIds: ['me', 'maya', 'ines'] },
  { id: 'o2', label: 'The blurry bridge', votes: 1, voterIds: ['devon'] }]

}];


/** A person's live polls, shown on their profile and in their Catch-Up. */
export const pollsByAuthor = (authorId: string) =>
HOME_POLLS.filter((p) => p.authorId === authorId);

export const SUBMITTED_QUESTIONS = [
{ id: 'sq1', text: 'What made you laugh this week?', authorId: 'maya', votes: 6 },
{ id: 'sq2', text: 'Best thing you ate?', authorId: 'kit', votes: 4 }];