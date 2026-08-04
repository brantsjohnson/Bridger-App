// ============================================
// WHAT THIS FILE DOES (plain English):
// Friend Pod (weekly recap podcast) data for the Friends tab widget. Demo mode
// reads the fixture week. The full player + recorder ship later
// (RECAP-PODCAST.md); this file just feeds the entry card.
// ============================================
import type { Person, Tier } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  PEOPLE,
  RECAP_ANSWERS,
  RECAP_WEEK,
  SUBMITTED_QUESTIONS,
  type RecapWeek
} from './fixtures/catalog';
import { personById } from './people';

export type RecapSummary = {
  week: RecapWeek;
  /** unique friends who recorded this week */
  voices: Person[];
  /** total audio length in whole minutes */
  minutes: number;
  questionCount: number;
};

export type SubmittedQuestion = {
  id: string;
  text: string;
  authorId: string;
  votes: number;
};

/** Summary used by the Friend Pod widget on Friends (and someday Home). */
export async function getRecapWeek(): Promise<RecapSummary> {
  if (isDemoMode()) {
    const voiceIds = Array.from(new Set(RECAP_ANSWERS.map((a) => a.authorId)));
    const voices = voiceIds.map((id) => personById(id));
    const seconds = RECAP_ANSWERS.reduce((n, a) => n + a.duration, 0);
    return {
      week: RECAP_WEEK,
      voices,
      minutes: Math.round(seconds / 60),
      questionCount: RECAP_WEEK.questions.length
    };
  }

  // TODO: GET /pod/week
  return {
    week: { id: '', weekOf: '', questions: [] },
    voices: [],
    minutes: 0,
    questionCount: 0
  };
}

/** Questions friends suggested for the next week. */
export async function listSubmittedQuestions(): Promise<SubmittedQuestion[]> {
  if (isDemoMode()) {
    return SUBMITTED_QUESTIONS.map((q) => ({ ...q }));
  }
  // TODO: GET /pod/questions
  return [];
}

export type SubmitQuestionInput = { text: string };

/** Suggest a question for a future Friend Pod week. */
export async function submitQuestion(input: SubmitQuestionInput): Promise<SubmittedQuestion> {
  const q: SubmittedQuestion = {
    id: `sq-${Date.now()}`,
    text: input.text.trim(),
    authorId: 'me',
    votes: 0
  };

  if (isDemoMode()) {
    // demo: ephemeral; not persisted into the fixture array
    return q;
  }

  // TODO: POST /pod/questions
  return q;
}

/** People available to tag when writing an Inside Joke (confirmed friends). */
export function taggablePeople(): Person[] {
  if (isDemoMode()) {
    return [...PEOPLE];
  }
  return [];
}

/** Event title chips for "where it happened" on an Inside Joke. */
export function recentEventNames(): string[] {
  if (isDemoMode()) {
    return ['Sketch night', 'Sunrise ride', 'Vinyl swap'];
  }
  return [];
}

/** Tier type re-export for callers that need it next to pod types. */
export type { Tier };
