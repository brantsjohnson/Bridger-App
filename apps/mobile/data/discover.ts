// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Discover tab needs: opt-in settings, friend-of-friend
// suggestions, "wants to connect" approvals, and private match modules.
// Demo mode keeps state in memory. Live mode will call discovery / matching /
// connections APIs — same function names either way.
// ============================================
import type {
  ApprovalRequest,
  DisclosureProfile,
  DisclosureSaveInput,
  DiscoverSettings,
  Suggestion
} from '@bridger/shared';
import type { AttachmentScoreResult } from '../quizzes/discover/attachment/score';
import { attachmentToMatchDimensions } from '../quizzes/discover/attachment/score';
import type { HumorScoreResult } from '../quizzes/discover/humor/score';
import { humorToMatchDimensions } from '../quizzes/discover/humor/score';
import type { PersonalityScoreResult } from '../quizzes/discover/personality/score';
import { personalityToMatchDimensions } from '../quizzes/discover/personality/score';
import type { ValuesScoreResult } from '../quizzes/discover/values/score';
import { valuesToMatchDimensions } from '../quizzes/discover/values/score';
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

/** One friend-of-friend card shown on reveal Screen 3. */
export type BridgeSuggestion = {
  id: string;
  personId: string;
  viaFriendId: string;
  sharedThread: string;
  signals: string[];
};

/** Emoji / accent for quiz compatibility bars, keyed by internal slug. */
const EMOJI_BY_SLUG: Record<string, string> = {
  humor: '😂',
  values: '🧭',
  personality: '✨',
  attachment: '🤝'
};
const ACCENT_BY_SLUG: Record<string, QuizMatch['accent']> = {
  humor: 'coral',
  values: 'purple',
  personality: 'teal',
  attachment: 'blue'
};

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

/**
 * PRIVACY: Behind the Scenes answers. Demo keeps them in memory only.
 * Never shown on a profile. Never sent to other users.
 */
let demoDisclosure: DisclosureProfile | null = null;

/** Demo store for Your Vibe scores (private; never on a profile). */
let demoPersonality: PersonalityScoreResult | null = null;

/** Demo store for The Friend Zone scores (private; never on a profile). */
let demoAttachment: AttachmentScoreResult | null = null;

/** Demo store for What Gets You Going scores (private; never on a profile). */
let demoValues: ValuesScoreResult | null = null;

/** Demo store for Your Funny Bone scores (private; never on a profile). */
let demoHumor: HumorScoreResult | null = null;

function cloneSettings(): DiscoverSettings {
  return {
    discoverable: demoSettings.discoverable,
    sources: {
      ...demoSettings.sources,
      aboutMeCategories: demoSettings.sources.aboutMeCategories
        ? { ...demoSettings.sources.aboutMeCategories }
        : undefined
    }
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
  // Live: read the master switch from user_settings. On any failure, fall back
  // to matching OFF so the Discover splash (gate) can still render.
  try {
    const s = await apiFetch<{
      discoverable?: boolean;
    }>('/me/settings');
    return {
      discoverable: s?.discoverable === true,
      sources: { ...DEFAULT_DISCOVER_SETTINGS.sources }
    };
  } catch {
    return {
      discoverable: false,
      sources: { ...DEFAULT_DISCOVER_SETTINGS.sources }
    };
  }
}

export async function setDiscoverable(on: boolean): Promise<DiscoverSettings> {
  if (isDemoMode()) {
    demoSettings = { ...demoSettings, discoverable: on };
    return cloneSettings();
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ discoverable: on })
  });
  return getDiscoverSettings();
}

export async function setSources(
  patch: Partial<DiscoverSettings['sources']>
): Promise<DiscoverSettings> {
  if (isDemoMode()) {
    const sources: DiscoverSettings['sources'] = {
      ...demoSettings.sources,
      ...patch,
      aboutMeCategories: patch.aboutMeCategories
        ? { ...patch.aboutMeCategories }
        : demoSettings.sources.aboutMeCategories
          ? { ...demoSettings.sources.aboutMeCategories }
          : undefined
    };
    // Turning off all quiz / about-me sources stops matching (same as master off).
    const anyQuiz =
      sources.onboardingQuiz || sources.discoverMe || sources.aboutMe;
    demoSettings = {
      discoverable: anyQuiz ? demoSettings.discoverable : false,
      sources
    };
    return cloneSettings();
  }
  // TODO: persist source toggles when the discovery settings API lands.
  // For now keep the master switch and return a local sources merge.
  const current = await getDiscoverSettings();
  const sources: DiscoverSettings['sources'] = {
    ...current.sources,
    ...patch,
    aboutMeCategories: patch.aboutMeCategories
      ? { ...patch.aboutMeCategories }
      : current.sources.aboutMeCategories
        ? { ...current.sources.aboutMeCategories }
        : undefined
  };
  const anyQuiz =
    sources.onboardingQuiz || sources.discoverMe || sources.aboutMe;
  if (!anyQuiz && current.discoverable) {
    return setDiscoverable(false);
  }
  return { discoverable: current.discoverable, sources };
}

export async function listSuggestions(): Promise<Suggestion[]> {
  if (isDemoMode()) {
    if (!demoSettings.discoverable) return [];
    return filterSuggestions(demoSuggestions).map((s) => ({
      ...s,
      signals: [...s.signals]
    }));
  }
  try {
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
  } catch {
    // Matching may be unreachable; Discover still needs to open (gate or main).
    return [];
  }
}

export async function listRequests(): Promise<ApprovalRequest[]> {
  if (isDemoMode()) {
    return demoRequests
      .filter((r) => !demoBlockedIds.has(r.personId))
      .map((r) => ({ ...r }));
  }
  try {
    return (await apiFetch<ApprovalRequest[]>('/connections/requests')) ?? [];
  } catch {
    return [];
  }
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
    strongest: {
      title: string;
      kind?: string;
      pairedAnswers?: { yours: string; theirs: string };
    } | null;
    extras: Array<{
      title: string;
      kind?: string;
      pairedAnswers?: { yours: string; theirs: string };
    }>;
    fullList?: Array<{
      title: string;
      kind?: string;
      pairedAnswers?: { yours: string; theirs: string };
    }>;
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
    strongest: i === 0,
    yours: item.pairedAnswers?.yours,
    theirs: item.pairedAnswers?.theirs
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
    quizCompat: Array<{
      quizId: string;
      title?: string;
      dimension: string;
      percent: number;
    }>;
  }>(`/matching/overlap/${encodeURIComponent(personId)}?variant=reveal`);
  return (payload.quizCompat ?? []).map((q, i) => ({
    key: `qm-${i}`,
    quizId: q.quizId,
    // Prefer the in-app title ("Your Funny Bone") over a raw dimension key.
    dimension: q.title ?? q.dimension,
    score: q.percent,
    emoji: EMOJI_BY_SLUG[q.quizId] ?? '✨',
    accent: ACCENT_BY_SLUG[q.quizId] ?? 'teal'
  }));
}

/**
 * Friend-of-friend suggestions for reveal Screen 3.
 * PRIVACY: only when the viewer opted into Discover; otherwise empty + false.
 */
export async function getRevealBridges(
  personId?: string
): Promise<{ discoverable: boolean; suggestions: BridgeSuggestion[] }> {
  if (isDemoMode()) {
    const suggestions = FIXTURE_SUGGESTIONS.filter((s) => s.personId !== personId)
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        personId: s.personId,
        viaFriendId: s.viaFriendId,
        sharedThread: s.sharedThread,
        signals: [...s.signals]
      }));
    return { discoverable: demoSettings.discoverable, suggestions };
  }
  if (!personId) return { discoverable: false, suggestions: [] };
  try {
    const payload = await apiFetch<{
      discoverable: boolean;
      suggestions: Array<{
        personId: string;
        viaFriendId?: string;
        sharedThread: string;
        signals: string[];
        score?: number;
      }>;
    }>(
      `/matching/reveal-bridges/${encodeURIComponent(personId)}?limit=3`
    );
    return {
      discoverable: Boolean(payload.discoverable),
      suggestions: (payload.suggestions ?? []).map((s, i) => ({
        id: `bridge-${s.personId}-${i}`,
        personId: s.personId,
        viaFriendId: s.viaFriendId ?? '',
        sharedThread: s.sharedThread,
        signals: [...(s.signals ?? [])]
      }))
    };
  } catch {
    return { discoverable: false, suggestions: [] };
  }
}

/** Send a connect request from reveal Screen 3 (bridge suggestion). */
export async function connectFromReveal(
  personId: string,
  viaFriendId: string
): Promise<void> {
  if (isDemoMode()) return;
  await apiFetch('/connections', {
    method: 'POST',
    body: JSON.stringify({
      targetId: personId,
      madeVia: 'suggestion',
      viaFriendId: viaFriendId || undefined
    })
  });
}

/**
 * Connect Over cards always come from the on-device catalog (titles, emoji,
 * accent). The server only stores scores after you finish — it does not own
 * the card list. Demo and live share the same five modules.
 */
export async function listMatchModules(): Promise<MatchModule[]> {
  return MATCH_MODULES.map((m) => ({
    ...m,
    questions: m.questions.map((q) => ({ ...q }))
  }));
}

/**
 * Which Connect Over modules this person already finished (Done tags).
 * Live mode asks the API so Done survives relaunch; scores stay on the server.
 */
export async function listCompletedModules(): Promise<string[]> {
  if (isDemoMode()) return [...demoCompletedModules];
  try {
    const payload = await apiFetch<{ completed?: string[] }>(
      '/discover/quizzes/completed'
    );
    return Array.isArray(payload?.completed) ? [...payload.completed] : [];
  } catch {
    // Matching API may be down; still show the cards as To do.
    return [];
  }
}

/**
 * PRIVACY: answers are private matchable signals only — never written onto a
 * profile card. Demo marks the module done; live mode relies on the save*
 * calls (which already wrote quiz_results) and refreshes Done from the API.
 */
export async function completeMatchModule(moduleId: string): Promise<void> {
  if (isDemoMode()) {
    if (!demoCompletedModules.includes(moduleId)) {
      demoCompletedModules = [...demoCompletedModules, moduleId];
    }
    return;
  }
  // Live: humor / personality / values / attachment already POSTed via
  // save*Result. Disclosure still has no server path — mark nothing here.
  void moduleId;
}

/**
 * Save Behind the Scenes (disclosure). Owner-only. Additive matching later.
 * PRIVACY: never log free-text notes or custom labels in analytics.
 */
export async function saveDisclosure(input: DisclosureSaveInput): Promise<void> {
  if (isDemoMode()) {
    demoDisclosure = {
      version: input.version,
      status: input.status,
      matchWeightPreference: input.matchWeightPreference,
      matchingEnabled: true,
      items: input.items.map((i) => ({ ...i })),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!demoCompletedModules.includes('disclosure')) {
      demoCompletedModules = [...demoCompletedModules, 'disclosure'];
    }
    return;
  }
  // TODO: PUT /discover/disclosure (writes disclosure_profiles + disclosure_items)
  void input;
  void apiFetch;
}

/** Read the current disclosure profile (owner only). */
export async function getDisclosure(): Promise<DisclosureProfile | null> {
  if (isDemoMode()) {
    return demoDisclosure
      ? {
          ...demoDisclosure,
          items: demoDisclosure.items.map((i) => ({ ...i }))
        }
      : null;
  }
  // TODO: GET /discover/disclosure
  return null;
}

/**
 * Save Your Vibe trait dials. Private + matchable (except neuroticism).
 * PRIVACY: never write explain text here; scores only.
 */
export async function savePersonalityResult(
  result: PersonalityScoreResult
): Promise<void> {
  if (isDemoMode()) {
    demoPersonality = {
      ...result,
      traits: result.traits.map((t) => ({ ...t })),
      symptomFlags: [...result.symptomFlags],
      notes: [...result.notes]
    };
    if (!demoCompletedModules.includes('personality')) {
      demoCompletedModules = [...demoCompletedModules, 'personality'];
    }
    return;
  }
  // Live: store the scored dials for matching (scores only, never answers).
  await apiFetch('/discover/quizzes/personality/complete', {
    method: 'POST',
    body: JSON.stringify(personalityToMatchDimensions(result))
  });
}

export async function getPersonalityResult(): Promise<PersonalityScoreResult | null> {
  if (isDemoMode()) {
    return demoPersonality
      ? {
          ...demoPersonality,
          traits: demoPersonality.traits.map((t) => ({ ...t })),
          symptomFlags: [...demoPersonality.symptomFlags],
          notes: [...demoPersonality.notes]
        }
      : null;
  }
  return null;
}

/**
 * Save The Friend Zone dials (anxiety / avoidance / style). Private.
 * Matching uses the style matrix later. Never write explain text.
 */
export async function saveAttachmentResult(
  result: AttachmentScoreResult
): Promise<void> {
  if (isDemoMode()) {
    demoAttachment = {
      ...result,
      bands: { ...result.bands },
      confidence: { ...result.confidence },
      notes: [...result.notes]
    };
    if (!demoCompletedModules.includes('attachment')) {
      demoCompletedModules = [...demoCompletedModules, 'attachment'];
    }
    return;
  }
  // Live: store the scored dials for matching (scores only, never answers).
  await apiFetch('/discover/quizzes/attachment/complete', {
    method: 'POST',
    body: JSON.stringify(attachmentToMatchDimensions(result))
  });
}

export async function getAttachmentResult(): Promise<AttachmentScoreResult | null> {
  if (isDemoMode()) {
    return demoAttachment
      ? {
          ...demoAttachment,
          bands: { ...demoAttachment.bands },
          confidence: { ...demoAttachment.confidence },
          notes: [...demoAttachment.notes]
        }
      : null;
  }
  return null;
}

/**
 * Save What Gets You Going dials + Schwartz priorities. Private.
 * Matching uses similarity on adventure/giving/hedonism. Never explain text.
 */
export async function saveValuesResult(
  result: ValuesScoreResult
): Promise<void> {
  if (isDemoMode()) {
    demoValues = {
      ...result,
      schwartz: result.schwartz.map((s) => ({ ...s })),
      dials: result.dials.map((d) => ({ ...d })),
      notes: [...result.notes]
    };
    if (!demoCompletedModules.includes('values')) {
      demoCompletedModules = [...demoCompletedModules, 'values'];
    }
    return;
  }
  // Live: store the scored dials for matching (scores only, never answers).
  await apiFetch('/discover/quizzes/values/complete', {
    method: 'POST',
    body: JSON.stringify(valuesToMatchDimensions(result))
  });
}

export async function getValuesResult(): Promise<ValuesScoreResult | null> {
  if (isDemoMode()) {
    return demoValues
      ? {
          ...demoValues,
          schwartz: demoValues.schwartz.map((s) => ({ ...s })),
          dials: demoValues.dials.map((d) => ({ ...d })),
          notes: [...demoValues.notes]
        }
      : null;
  }
  return null;
}

/**
 * Save Your Funny Bone taste vector + breadth. Private.
 * Matching uses similarity + breadth band. Never write explain text.
 */
export async function saveHumorResult(
  result: HumorScoreResult
): Promise<void> {
  if (isDemoMode()) {
    demoHumor = {
      ...result,
      axes: result.axes.map((a) => ({ ...a })),
      styleHints: result.styleHints.map((s) => ({ ...s })),
      mediaIds: [...result.mediaIds],
      clusters: [...result.clusters],
      notes: [...result.notes]
    };
    if (!demoCompletedModules.includes('humor')) {
      demoCompletedModules = [...demoCompletedModules, 'humor'];
    }
    return;
  }
  // Live: store the scored dials for matching (scores only, never answers).
  await apiFetch('/discover/quizzes/humor/complete', {
    method: 'POST',
    body: JSON.stringify(humorToMatchDimensions(result))
  });
}

export async function getHumorResult(): Promise<HumorScoreResult | null> {
  if (isDemoMode()) {
    return demoHumor
      ? {
          ...demoHumor,
          axes: demoHumor.axes.map((a) => ({ ...a })),
          styleHints: demoHumor.styleHints.map((s) => ({ ...s })),
          mediaIds: [...demoHumor.mediaIds],
          clusters: [...demoHumor.clusters],
          notes: [...demoHumor.notes]
        }
      : null;
  }
  return null;
}
