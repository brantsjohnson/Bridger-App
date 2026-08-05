// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the app needs for quizzes: the live one on Home, saving each
// answer, finishing (which scores you), and the archive list of quizzes you
// have not taken yet. Demo mode uses the fixture catalog; live mode calls
// the Nest /quizzes routes.
// ============================================
import type {
  Cover,
  LiveQuiz,
  QuizQuestionPublic,
  QuizRegistryEntry,
  QuizResult
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { QUIZ } from './fixtures/catalog';

/** Home widget shape (fixture + live mapped to the same fields). */
export type HomeQuiz = {
  id: string;
  title: string;
  description?: string;
  comparable: boolean;
  cover?: Cover;
  results: Array<{
    id: string;
    label: string;
    accent: 'teal' | 'amber' | 'coral' | 'purple' | 'pink' | 'blue' | 'green';
    friendIds: string[];
  }>;
  /** Set when the signed-in user already finished this quiz. */
  resultId?: string | null;
};

/** Demo archive: older quizzes friends took that you have not. */
const DEMO_ARCHIVED: Array<{
  slug: string;
  title: string;
  friendsTakenCount: number;
  comparable: boolean;
}> = [
  {
    slug: 'sunday-morning',
    title: 'What kind of Sunday morning are you?',
    friendsTakenCount: 3,
    comparable: true
  },
  {
    slug: 'snack-personality',
    title: 'What snack are you on a road trip?',
    friendsTakenCount: 4,
    comparable: false
  }
];

/** Session-only demo result so Home can show "Who got who" after take. */
let demoResultId: string | null = null;

/** Remember a demo result (called by the road-trip plugin on complete). */
export function __demoSetQuizResult(resultId: string): void {
  demoResultId = resultId;
}

/** Map a LiveQuiz API payload into the Home widget shape. */
function toHomeQuiz(live: LiveQuiz): HomeQuiz {
  const accents = ['teal', 'amber', 'coral', 'purple', 'pink', 'blue', 'green'] as const;
  return {
    id: live.slug,
    title: live.title,
    description: live.description,
    comparable: live.comparable,
    cover: live.cover,
    resultId: live.resultId ?? null,
    results: (live.results ?? []).map((r, i) => ({
      id: r.id,
      label: r.label,
      accent: (r.accent as (typeof accents)[number] | undefined) ?? accents[i % accents.length],
      friendIds: r.friendIds ?? []
    }))
  };
}

/** The quiz currently featured on Home. */
export async function getLiveQuiz(): Promise<HomeQuiz | null> {
  if (isDemoMode()) {
    return {
      id: QUIZ.id,
      title: QUIZ.title,
      description: QUIZ.description,
      comparable: QUIZ.comparable,
      cover: QUIZ.cover,
      results: QUIZ.results.map((r) => ({ ...r, friendIds: [...r.friendIds] })),
      resultId: demoResultId
    };
  }

  try {
    const live = await apiFetch<LiveQuiz>('/quizzes/current');
    return toHomeQuiz(live);
  } catch {
    return null;
  }
}

/** Full live quiz payload (questions included) for the take flow. */
export async function getLiveQuizDetail(slug: string): Promise<LiveQuiz | null> {
  if (isDemoMode()) {
    // Demo plugins ship their own questions; return a thin shell for routing.
    if (slug === QUIZ.id || slug === 'which-road-trip' || slug === 'road-trip') {
      return {
        slug: QUIZ.id,
        title: QUIZ.title,
        comparable: QUIZ.comparable,
        quizId: QUIZ.id,
        version: 1,
        questions: [],
        results: QUIZ.results.map((r) => ({
          id: r.id,
          label: r.label,
          accent: r.accent,
          friendIds: [...r.friendIds]
        })),
        resultId: null
      };
    }
    return null;
  }

  // Live API exposes the current quiz; archived take-by-slug lands later.
  try {
    const live = await apiFetch<LiveQuiz>('/quizzes/current');
    return live;
  } catch {
    return null;
  }
}

/** Save one answer while taking a quiz. */
export async function submitResponse(
  slug: string,
  body: {
    questionId: string;
    selectedOptionIds: string[];
    explainText?: string;
  }
): Promise<{
  nextQuestion?: QuizQuestionPublic;
  confidence?: Record<string, number>;
  flags?: string[];
  adapted?: boolean;
}> {
  if (isDemoMode()) {
    // Demo scoring is local inside the plugin; nothing to persist.
    return {};
  }
  return apiFetch(`/quizzes/${encodeURIComponent(slug)}/responses`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/** Finish the quiz and get the scored result. */
export async function completeQuiz(slug: string): Promise<{
  result: QuizResult;
  whoGotWho?: Array<{ id: string; label: string; friendIds: string[] }>;
}> {
  if (isDemoMode()) {
    throw new Error('completeQuiz is not used in demo (plugin scores locally)');
  }
  return apiFetch(`/quizzes/${encodeURIComponent(slug)}/complete`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/** Archived quizzes you have not finished yet (Profile list). */
export async function listArchivedQuizzes(): Promise<
  Array<Pick<QuizRegistryEntry, 'slug' | 'title' | 'friendsTakenCount' | 'comparable'>>
> {
  if (isDemoMode()) {
    return DEMO_ARCHIVED.map((q) => ({ ...q }));
  }
  return apiFetch('/quizzes/archived');
}
