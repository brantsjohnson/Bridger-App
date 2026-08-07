// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Discover tab needs: opt-in settings, friend-of-friend
// suggestions, "wants to connect" approvals, and private match modules.
// Demo mode keeps state in memory. Live mode will call discovery / matching /
// connections APIs — same function names either way.
// ============================================
import type {
  ApprovalRequest,
  DiscoverSettings,
  Suggestion
} from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { loadPeople } from '../lib/people-cache';
import {
  ABOUT_ME_CATEGORIES,
  COMMONALITIES,
  DEFAULT_DISCOVER_SETTINGS,
  MATCH_MODULES,
  QUIZ_MATCHES,
  REQUESTS as FIXTURE_REQUESTS,
  SUGGESTIONS as FIXTURE_SUGGESTIONS,
  type Commonality,
  type MatchModule,
  type ModuleQuestion,
  type QuizMatch
} from './fixtures/discover';

export type { Commonality, MatchModule, ModuleQuestion, QuizMatch };
export { ABOUT_ME_CATEGORIES };

/** PRIVACY: people you've blocked never appear as suggestions or bridges. */
const demoBlockedIds = new Set<string>();

let demoSettings: DiscoverSettings = {
  ...DEFAULT_DISCOVER_SETTINGS,
  sources: { ...DEFAULT_DISCOVER_SETTINGS.sources }
};

let demoSuggestions: Suggestion[] = FIXTURE_SUGGESTIONS.map((s) => ({
  ...s,
  signals: [...s.signals]
}));

let demoRequests: ApprovalRequest[] = FIXTURE_REQUESTS.map((r) => ({ ...r }));

/** Module ids you've finished — answers stay local, never on a profile. */
let demoCompletedModules: string[] = [];

function cloneSettings(): DiscoverSettings {
  return {
    discoverable: demoSettings.discoverable,
    sources: { ...demoSettings.sources }
  };
}

function filterSuggestions(list: Suggestion[]): Suggestion[] {
  // SECURITY / PRIVACY: only mutual opted-in FoF; never blocked people or bridges
  return list.filter(
    (s) =>
      s.bothOptedIn === true &&
      !demoBlockedIds.has(s.personId) &&
      !demoBlockedIds.has(s.viaFriendId)
  );
}

export async function getDiscoverSettings(): Promise<DiscoverSettings> {
  if (isDemoMode()) return cloneSettings();
  // TODO: GET /discovery/settings
  return cloneSettings();
}

export async function setDiscoverable(on: boolean): Promise<DiscoverSettings> {
  if (isDemoMode()) {
    demoSettings = { ...demoSettings, discoverable: on };
    return cloneSettings();
  }
  // TODO: PATCH /discovery/settings
  return cloneSettings();
}

export async function setSources(
  patch: Partial<DiscoverSettings['sources']>
): Promise<DiscoverSettings> {
  if (isDemoMode()) {
    const sources = { ...demoSettings.sources, ...patch };
    // Turning off all quiz sources stops matching (same as master off).
    const anyQuiz = sources.onboardingQuiz || sources.discoverMe || sources.aboutMe;
    demoSettings = {
      discoverable: anyQuiz ? demoSettings.discoverable : false,
      sources
    };
    return cloneSettings();
  }
  // TODO: PATCH /discovery/settings
  return cloneSettings();
}

export async function listSuggestions(): Promise<Suggestion[]> {
  if (isDemoMode()) {
    if (!demoSettings.discoverable) return [];
    return filterSuggestions(demoSuggestions).map((s) => ({
      ...s,
      signals: [...s.signals]
    }));
  }
  const rows = await apiFetch<
    Array<{
      id: string;
      personId: string;
      viaFriendId?: string;
      sharedThread: string;
      signals: string[];
      bothOptedIn: true;
    }>
  >('/matching/suggestions');
  return (rows ?? []).map((s) => ({
    id: s.id,
    personId: s.personId,
    viaFriendId: s.viaFriendId ?? '',
    sharedThread: s.sharedThread,
    signals: [...(s.signals ?? [])],
    accent: 'teal' as const,
    bothOptedIn: true as const
  }));
}

export async function listRequests(): Promise<ApprovalRequest[]> {
  if (isDemoMode()) {
    return demoRequests
      .filter((r) => !demoBlockedIds.has(r.personId))
      .map((r) => ({ ...r }));
  }
  return apiFetch<ApprovalRequest[]>('/connections/requests');
}

/** Lighter than block: drop one person from your suggestions. */
export async function dontSuggestAgain(suggestionId: string): Promise<void> {
  if (isDemoMode()) {
    demoSuggestions = demoSuggestions.filter((s) => s.id !== suggestionId);
    return;
  }
  // Resolve candidate from the active list, then dismiss forever.
  const current = await listSuggestions();
  const hit = current.find((s) => s.id === suggestionId);
  if (!hit) return;
  await apiFetch('/matching/dismiss', {
    method: 'POST',
    body: JSON.stringify({ candidateId: hit.personId, forever: true })
  });
}

export async function acceptRequest(requestId: string): Promise<void> {
  if (isDemoMode()) {
    demoRequests = demoRequests.filter((r) => r.id !== requestId);
    return;
  }
  await apiFetch(`/connections/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  // New friend just landed — refresh the people cache for the roster / reveal.
  await loadPeople();
}

export async function declineRequest(requestId: string): Promise<void> {
  if (isDemoMode()) {
    demoRequests = demoRequests.filter((r) => r.id !== requestId);
    return;
  }
  await apiFetch(
    `/connections/requests/${encodeURIComponent(requestId)}/decline`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

/**
 * Start connecting from a suggestion.
 * Live: suggestions stay demo until matching ships, so this posts a pending
 * request when we have a real personId; otherwise it is a no-op. The live add
 * path today is invite-link / QR redeem.
 */
export async function addSuggestion(suggestionId: string): Promise<void> {
  if (isDemoMode()) {
    demoSuggestions = demoSuggestions.filter((s) => s.id !== suggestionId);
    return;
  }
  const current = await listSuggestions();
  const sug = current.find((s) => s.id === suggestionId);
  if (!sug) return;
  await apiFetch('/connections', {
    method: 'POST',
    body: JSON.stringify({
      targetId: sug.personId,
      madeVia: 'suggestion',
      viaFriendId: sug.viaFriendId
    })
  });
}

export async function getCommonalities(personId?: string): Promise<Commonality[]> {
  if (isDemoMode()) {
    // Full overlap for reveal + In common; ConnectionDetail can show a subset.
    return COMMONALITIES.map((c) => ({ ...c }));
  }
  if (!personId) return [];
  const payload = await apiFetch<{
    strongest: { title: string; kind?: string } | null;
    extras: Array<{ title: string; kind?: string }>;
    fullList?: Array<{ title: string; kind?: string }>;
  }>(
    `/matching/overlap/${encodeURIComponent(personId)}?variant=in_common`
  );
  const list = payload.fullList?.length
    ? payload.fullList
    : [
        ...(payload.strongest ? [payload.strongest] : []),
        ...(payload.extras ?? [])
      ];
  return list.map((item, i) => ({
    key: `ov-${i}`,
    label: item.title,
    strongest: i === 0
  }));
}

/**
 * Compatibility scores from matching-only quizzes (e.g. "95% in Humor").
 * PRIVACY: only the dimension + number cross the connection, never answers.
 */
export async function getQuizMatches(personId?: string): Promise<QuizMatch[]> {
  if (isDemoMode()) return QUIZ_MATCHES.map((q) => ({ ...q }));
  if (!personId) return [];
  const payload = await apiFetch<{
    quizCompat: Array<{ quizId: string; dimension: string; percent: number }>;
  }>(`/matching/overlap/${encodeURIComponent(personId)}?variant=reveal`);
  return (payload.quizCompat ?? []).map((q, i) => ({
    key: `qm-${i}`,
    quizId: q.quizId,
    dimension: q.dimension,
    score: q.percent,
    emoji: '✨',
    accent: 'teal' as const
  }));
}

export async function listMatchModules(): Promise<MatchModule[]> {
  if (isDemoMode()) {
    return MATCH_MODULES.map((m) => ({
      ...m,
      questions: m.questions.map((q) => ({ ...q }))
    }));
  }
  // TODO: GET /quizzes/match-modules
  return [];
}

export async function listCompletedModules(): Promise<string[]> {
  if (isDemoMode()) return [...demoCompletedModules];
  return [];
}

/**
 * PRIVACY: answers are private matchable signals only — never written onto a
 * profile card. Demo just marks the module done.
 */
export async function completeMatchModule(moduleId: string): Promise<void> {
  if (isDemoMode()) {
    if (!demoCompletedModules.includes(moduleId)) {
      demoCompletedModules = [...demoCompletedModules, moduleId];
    }
    return;
  }
  // TODO: POST /quizzes/match-modules/:id/complete (private ProfileAttributes)
}
