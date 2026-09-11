// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the app needs for quizzes: the live one on Home, saving each
// answer, finishing (which scores you), and the archive list of quizzes you
// have not taken yet. Demo mode uses the fixture catalog; live mode calls
// the Nest /quizzes routes.
// ============================================
import type { ImageSourcePropType } from 'react-native';
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
import { HOME_COVER_FACES } from '../quizzes/what-j-name/images';

/** Home widget shape (fixture + live mapped to the same fields). */
export type HomeQuiz = {
  id: string;
  title: string;
  description?: string;
  comparable: boolean;
  cover?: Cover;
  /** Optional faces the Home card cross-fades through instead of a static cover. */
  coverImages?: ImageSourcePropType[];
  results: Array<{
    id: string;
    label: string;
    accent: 'teal' | 'amber' | 'coral' | 'purple' | 'pink' | 'blue' | 'green';
    friendIds: string[];
    /** Per-friend compatibility with you (J-name only; fun % only). */
    friends?: Array<{
      userId: string;
      percent: number;
      compatibilityPercent: number;
    }>;
  }>;
  /** Set when the signed-in user already finished this quiz. */
  resultId?: string | null;
  /** Your own J-name result label for Home (independent of friend buckets). */
  myResultLabel?: string | null;
  myResultAccent?: 'teal' | 'amber' | 'coral' | 'purple' | 'pink' | 'blue' | 'green';
  myResultPercent?: number | null;
};

const JNAME_ACCENTS = [
  'teal',
  'amber',
  'coral',
  'purple',
  'pink',
  'blue',
  'green'
] as const;

const JNAME_ACCENT_BY: Record<string, (typeof JNAME_ACCENTS)[number]> = {
  Justin: 'pink',
  Josh: 'green',
  Joey: 'amber',
  James: 'blue',
  Jake: 'coral',
  Jared: 'purple',
  John: 'teal'
};

function accentForJName(name: string, index = 0): (typeof JNAME_ACCENTS)[number] {
  return JNAME_ACCENT_BY[name] ?? JNAME_ACCENTS[index % JNAME_ACCENTS.length];
}

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

/** Live session overlay so Home shows Results right after finish (before API). */
let liveSessionResult: { jName: string; percent: number } | null = null;

/** Remember a demo result (called by the road-trip plugin on complete). */
export function __demoSetQuizResult(resultId: string): void {
  demoResultId = resultId;
}

/** Remember a live J-name result so Home CTA flips to Results immediately. */
export function setLiveJnameSessionResult(result: {
  jName: string;
  percent: number;
} | null): void {
  liveSessionResult = result;
}

export function getLiveJnameSessionResult(): {
  jName: string;
  percent: number;
} | null {
  return liveSessionResult;
}

/** First (canonical) J-name result this session, including demo. */
export function getCanonicalJnamePreview(): {
  jName: string;
  percent: number;
} | null {
  if (liveSessionResult) return liveSessionResult;
  if (demoResultId) return { jName: demoResultId, percent: 87 };
  return null;
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
      comparable: QUIZ.comparable,
      cover: QUIZ.cover,
      coverImages: HOME_COVER_FACES,
      results: QUIZ.results.map((r) => ({ ...r, friendIds: [...r.friendIds] })),
      resultId: demoResultId,
      myResultLabel: demoResultId,
      myResultAccent: demoResultId ? accentForJName(demoResultId) : undefined,
      myResultPercent: demoResultId ? 87 : null
    };
  }

  // J-name is the standing Home quiz. Load it from /jname/* so we do not depend
  // on admin_config.live_quiz_slug or the generic quiz_results table.
  try {
    const board = await apiFetch<{
      buckets: Array<{
        jName: string;
        friendIds: string[];
        friends?: Array<{
          userId: string;
          percent: number;
          compatibilityPercent: number;
        }>;
      }>;
      myResult?: { jName: string; percent: number } | null;
    }>('/jname/leaderboard');

    const my = board?.myResult ?? liveSessionResult ?? null;
    return {
      id: 'what-j-name',
      title: 'Which "J" name are you?',
      description: 'Find out which J name you are. Share it with friends.',
      comparable: true,
      cover: { kind: 'color', bg: '#101012' },
      coverImages: HOME_COVER_FACES,
      resultId: my?.jName ?? null,
      myResultLabel: my?.jName ?? null,
      myResultAccent: my?.jName ? accentForJName(my.jName) : undefined,
      myResultPercent: my?.percent ?? null,
      results: (board?.buckets ?? []).map((b, i) => ({
        id: b.jName,
        label: b.jName,
        accent: accentForJName(b.jName, i),
        friendIds: b.friendIds ?? [],
        friends: b.friends
      }))
    };
  } catch {
    // Fall through to the generic featured quiz if J-name is not reachable.
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

  // Prefer slug route so admin-published quizzes work; fall back to current.
  try {
    return await apiFetch<LiveQuiz>(`/quizzes/${encodeURIComponent(slug)}`);
  } catch {
    try {
      const live = await apiFetch<LiveQuiz>('/quizzes/current');
      if (live.slug === slug || slug === 'road-trip') return live;
      return null;
    } catch {
      return null;
    }
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
