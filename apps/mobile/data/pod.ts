// ============================================
// WHAT THIS FILE DOES (plain English):
// Friend Pod (weekly recap podcast) data for the Friends tab: the entry-card
// summary, the full playlist to play, posting your recorded answers, and
// submitting / upvoting questions. Demo mode reads the fixture week; live mode
// talks to the Nest /recap routes.
//
// RETENTION note: this week's podcast uses the rolling last 7 days. Co-op
// members can also open an earlier locked week (kept clips only). You can
// only re-record once your own last set is a week old. The server owns
// those rules — this file just relays what it returns.
// ============================================
import type {
  Person,
  RecapAnswer,
  RecapAudience,
  RecapPlaylist,
  RecapSummaryDTO,
  RecapWeeksDTO,
  Tier
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import {
  RECAP_ANSWERS,
  RECAP_ANSWERS_PREVIOUS,
  RECAP_WEEK,
  RECAP_WEEK_PREVIOUS,
  SUBMITTED_QUESTIONS,
  type RecapWeek
} from './fixtures/catalog';
import { personById } from './people';

export type RecapSummary = {
  week: RecapWeek;
  /** Monday UTC this week is locked to, YYYY-MM-DD. */
  weekStart?: string;
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
      weekStart: '2026-09-07',
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
      weekStart: dto.week.weekStart,
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

function demoClips(
  weekId: string,
  answers: typeof RECAP_ANSWERS,
  keepForever: boolean
) {
  return answers.map((a) => {
    const created = new Date();
    created.setDate(created.getDate() - (weekId === RECAP_WEEK.id ? 2 : 14));
    const expires = keepForever
      ? undefined
      : new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `${a.authorId}-${weekId}-${a.questionIndex}`,
      weekId: a.weekId,
      authorId: a.authorId,
      questionIndex: a.questionIndex,
      audioUrl: a.audioUrl,
      duration: a.duration,
      visibleToTier: a.visibleToTier as RecapAudience,
      createdAt: created.toISOString(),
      expiresAt: expires
    };
  });
}

/** Weeks this listener may open. Co-op gets earlier locked weeks. */
export async function listRecapWeeks(): Promise<RecapWeeksDTO> {
  if (isDemoMode()) {
    const { getMembership } = await import('./coop');
    const member = (await getMembership()).member;
    const current = {
      id: RECAP_WEEK.id,
      weekOf: RECAP_WEEK.weekOf,
      isCurrent: true
    };
    if (!member) return { canBrowsePast: false, weeks: [current] };
    return {
      canBrowsePast: true,
      weeks: [
        current,
        {
          id: RECAP_WEEK_PREVIOUS.id,
          weekOf: RECAP_WEEK_PREVIOUS.weekOf,
          isCurrent: false
        }
      ]
    };
  }
  return apiFetch<RecapWeeksDTO>('/recap/weeks');
}

/** The full playlist for the player (clips grouped by question, tier-filtered). */
export async function getRecapPlaylist(weekId?: string): Promise<RecapPlaylist> {
  if (isDemoMode()) {
    const { getMembership } = await import('./coop');
    const member = (await getMembership()).member;
    const past = weekId === RECAP_WEEK_PREVIOUS.id;
    if (past && !member) {
      throw new Error('Earlier weeks are a co-op perk');
    }
    const week = past ? RECAP_WEEK_PREVIOUS : RECAP_WEEK;
    const source = past ? RECAP_ANSWERS_PREVIOUS : RECAP_ANSWERS;
    return {
      week: {
        id: week.id,
        weekOf: week.weekOf,
        questions: week.questions
      },
      clips: demoClips(week.id, source, past || member),
      voiceIds: Array.from(new Set(source.map((a) => a.authorId))),
      isCurrent: !past,
      canBrowsePast: member
    };
  }
  const q = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
  return apiFetch<RecapPlaylist>(`/recap/playlist${q}`);
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
export async function taggablePeople(): Promise<Person[]> {
  const { listFriends } = await import('./friends');
  return listFriends();
}

/** Event title chips for "where it happened" on an Inside Joke. */
export async function recentEventNames(): Promise<string[]> {
  const { listEvents } = await import('./events');
  const events = await listEvents().catch(() => []);
  return events
    .map((e) => e.title?.trim())
    .filter((t): t is string => Boolean(t))
    .slice(0, 6);
}

/** Tier type re-export for callers that need it next to pod types. */
export type { Tier };
