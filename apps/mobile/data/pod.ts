// ============================================
// WHAT THIS FILE DOES (plain English):
// Friend Pod (weekly recap podcast) data for the Friends tab: the entry-card
// summary, the full playlist to play, posting your recorded answers, and
// submitting / upvoting questions. Demo mode reads the fixture week; live mode
// talks to the Nest /recap routes.
//
// RETENTION note: the podcast only includes clips from the rolling last 7 days;
// you can only re-record once your own last set is a week old. The server owns
// those rules — this file just relays what it returns.
// ============================================
import type {
  Person,
  RecapAnswer,
  RecapAudience,
  RecapPlaylist,
  RecapSummaryDTO,
  Tier
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
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
  /** true if the signed-in user still has a live recap this rolling week */
  hasMineThisWeek?: boolean;
  /** ISO time the user may record again (null / undefined = can record now) */
  canRecordAfter?: string | null;
};

export type SubmittedQuestion = {
  id: string;
  text: string;
  authorId: string;
  votes: number;
};

/** Summary used by the Friend Pod widget on Friends. */
export async function getRecapWeek(): Promise<RecapSummary> {
  if (isDemoMode()) {
    const voiceIds = Array.from(new Set(RECAP_ANSWERS.map((a) => a.authorId)));
    const voices = voiceIds.map((id) => personById(id));
    const seconds = RECAP_ANSWERS.reduce((n, a) => n + a.duration, 0);
    return {
      week: RECAP_WEEK,
      voices,
      minutes: Math.round(seconds / 60),
      questionCount: RECAP_WEEK.questions.length,
      hasMineThisWeek: false,
      canRecordAfter: null
    };
  }

  try {
    const dto = await apiFetch<RecapSummaryDTO>('/recap/week');
    return {
      week: {
        id: dto.week.id,
        weekOf: dto.week.weekOf,
        questions: dto.week.questions
      },
      voices: dto.voiceIds.map((id) => personById(id)),
      minutes: dto.minutes,
      questionCount: dto.questionCount,
      hasMineThisWeek: dto.hasMineThisWeek,
      canRecordAfter: dto.canRecordAfter ?? null
    };
  } catch {
    return {
      week: { id: '', weekOf: '', questions: [] },
      voices: [],
      minutes: 0,
      questionCount: 0
    };
  }
}

/** The full playlist for the player (clips grouped by question, tier-filtered). */
export async function getRecapPlaylist(): Promise<RecapPlaylist> {
  if (isDemoMode()) {
    return {
      week: {
        id: RECAP_WEEK.id,
        weekOf: RECAP_WEEK.weekOf,
        questions: RECAP_WEEK.questions
      },
      clips: RECAP_ANSWERS.map((a) => {
        // Demo: stagger expiry so the player can show "Expires in N days".
        const daysLeftByAuthor: Record<string, number> = {
          maya: 7,
          ines: 5,
          devon: 2,
          kit: 1,
          nour: 7
        };
        const days = daysLeftByAuthor[a.authorId] ?? 7;
        const created = new Date();
        created.setDate(created.getDate() - (7 - days));
        const expires = new Date(created);
        expires.setDate(expires.getDate() + 7);
        return {
          id: `${a.authorId}-${a.questionIndex}`,
          weekId: a.weekId,
          authorId: a.authorId,
          questionIndex: a.questionIndex,
          audioUrl: a.audioUrl,
          duration: a.duration,
          visibleToTier: a.visibleToTier as RecapAudience,
          createdAt: created.toISOString(),
          expiresAt: expires.toISOString()
        };
      }),
      voiceIds: Array.from(new Set(RECAP_ANSWERS.map((a) => a.authorId)))
    };
  }
  return apiFetch<RecapPlaylist>('/recap/playlist');
}

export type PostRecapInput = {
  audience: RecapAudience;
  answers: Array<{ questionIndex: number; mediaId: string; duration?: number }>;
};

/** Post your recorded answers for the week. */
export async function postRecapAnswers(
  input: PostRecapInput
): Promise<{ posted: number }> {
  if (isDemoMode()) {
    return { posted: input.answers.length };
  }
  return apiFetch('/recap/answers', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Questions friends suggested for the next week. */
export async function listSubmittedQuestions(): Promise<SubmittedQuestion[]> {
  if (isDemoMode()) {
    return SUBMITTED_QUESTIONS.map((q) => ({ ...q }));
  }
  return apiFetch<SubmittedQuestion[]>('/recap/questions');
}

export type SubmitQuestionInput = { text: string };

/** Suggest a question for a future Friend Pod week. */
export async function submitQuestion(input: SubmitQuestionInput): Promise<SubmittedQuestion> {
  if (isDemoMode()) {
    // demo: ephemeral; not persisted into the fixture array
    return {
      id: `sq-${Date.now()}`,
      text: input.text.trim(),
      authorId: 'me',
      votes: 0
    };
  }
  return apiFetch<SubmittedQuestion>('/recap/questions', {
    method: 'POST',
    body: JSON.stringify({ text: input.text.trim() })
  });
}

/** Upvote a submitted question (one vote per person). */
export async function voteQuestion(id: string): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch(`/recap/questions/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/** Send a sticker/emoji reaction to someone's recap clip (live API only). */
export async function sendRecapReaction(
  answerId: string,
  emoji: string
): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch(`/recap/answers/${encodeURIComponent(answerId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji })
  });
}

/**
 * Upload one recorded clip to storage and create its media row, returning the
 * media id the recap post needs. Demo mode returns a throwaway id (no upload).
 * PRIVACY: audio is the user's own capture; RLS only lets you insert your own
 * media row, and the file lives under your user id in the media bucket.
 */
export async function uploadRecapClip(
  uri: string,
  weekId: string,
  questionIndex: number
): Promise<string> {
  if (isDemoMode()) {
    return `demo-media-${weekId}-${questionIndex}`;
  }
  // Shared helper: same bucket + media row rules as story / reaction uploads.
  const { uploadMedia } = await import('../lib/media-upload');
  return uploadMedia(uri, 'audio', `recap/${weekId}/${questionIndex}-${Date.now()}.m4a`);
}

/** Re-export the clip type so player code can import it from here. */
export type RecapClip = RecapAnswer;

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
