// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers an in-progress Discover Connect Over quiz on this phone so leaving
// mid-take does not wipe answers. Never uploads answers or puts them in
// analytics. Cleared when the quiz is finished or the person discards.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'bridger.quiz.discover.draft.v1.';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type DiscoverQuizDraft<TAnswer = unknown> = {
  slug: string;
  phase: 'intro' | 'take' | 'result';
  index: number;
  answers: TAnswer[];
  selected: string[];
  explain: string;
  startedAt: number;
  savedAt: number;
  totalQuestions: number;
};

function keyFor(slug: string) {
  return `${KEY_PREFIX}${slug}`;
}

export async function loadDiscoverDraft<TAnswer = unknown>(
  slug: string
): Promise<DiscoverQuizDraft<TAnswer> | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoverQuizDraft<TAnswer>;
    if (!parsed?.slug || parsed.slug !== slug) return null;
    if (Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
      await clearDiscoverDraft(slug);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDiscoverDraft<TAnswer = unknown>(
  draft: Omit<DiscoverQuizDraft<TAnswer>, 'savedAt'>
): Promise<void> {
  try {
    const payload: DiscoverQuizDraft<TAnswer> = {
      ...draft,
      savedAt: Date.now()
    };
    await AsyncStorage.setItem(keyFor(draft.slug), JSON.stringify(payload));
  } catch {
    // Storage full: quiz still works without resume.
  }
}

export async function clearDiscoverDraft(slug: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(slug));
  } catch {
    // ignore
  }
}

/** 0–100 progress for a "30% completed. Finish this quiz?" chip. */
export function draftProgressPercent(draft: DiscoverQuizDraft | null): number {
  if (!draft || !draft.totalQuestions) return 0;
  if (draft.phase === 'result') return 100;
  if (draft.phase === 'intro') return 0;
  const answered = draft.answers?.length ?? 0;
  return Math.min(99, Math.round((answered / draft.totalQuestions) * 100));
}
