// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain of the onboarding run. It holds the draft answers across steps
// (name, photo, notification prefs, birthday, meet, visibility), moves
// forward / back / skips through the ordered steps, and on the very last step
// marks onboarding complete. Each step saves its own slice as you advance, so
// the screen components stay simple.
//
// Order (decided from founder feedback): name is the FIRST ask; we explain the
// friend groups + invite a friend BEFORE asking profile questions; the only
// profile questions are city (asked with "meet people") and birthday; the
// visibility review at the end only covers city + birthday.
// ============================================
import { useCallback, useMemo, useState } from 'react';
import { trackFlowCompleted, trackFlowStep, type Tier } from '@bridger/shared';
import {
  saveBirthday,
  saveMeet,
  saveName,
  saveNotifications,
  savePhoto,
  saveVisibility,
  setOnboardingComplete,
  type MeetScope,
  type PhotoSource,
  type VisibilityRow
} from '../data/onboarding';

export type OnboardingStepKey =
  | 'privacy'
  | 'name'
  | 'photo'
  | 'notifications'
  | 'groups'
  | 'meet'
  | 'birthday'
  | 'visibility'
  | 'coop'
  | 'welcome-in';

export const ONBOARDING_ORDER: OnboardingStepKey[] = [
  'privacy',
  'name',
  'photo',
  'notifications',
  'groups',
  'meet',
  'birthday',
  'visibility',
  'coop',
  'welcome-in'
];

/** The whole run's draft — the only required answer is the name. */
type Draft = {
  firstName: string;
  lastName: string;
  photoSource: PhotoSource | null;
  notifPrefs: string[];
  meetScope: MeetScope | null;
  meetCity: string;
  birthday: string;
  visibility: VisibilityRow[];
  coopJoined: boolean | null;
};

const EMPTY_DRAFT: Draft = {
  firstName: '',
  lastName: '',
  photoSource: null,
  notifPrefs: ['close', 'birthdays'],
  meetScope: null,
  meetCity: '',
  birthday: '',
  visibility: [],
  coopJoined: null
};

export function useOnboarding(onDone: () => void) {
  const [step, setStep] = useState<OnboardingStepKey>('privacy');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [startedAt] = useState(() => Date.now());

  const index = ONBOARDING_ORDER.indexOf(step);
  const patch = useCallback(
    (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next })),
    []
  );

  /** Save the step we're leaving, then move to the next (or finish). */
  const goNext = useCallback(async () => {
    // Persist just the slice this step owns.
    switch (step) {
      case 'name':
        await saveName(`${draft.firstName} ${draft.lastName}`.trim());
        break;
      case 'photo':
        if (draft.photoSource) await savePhoto({ source: draft.photoSource });
        break;
      case 'notifications':
        await saveNotifications(draft.notifPrefs);
        break;
      case 'meet':
        if (draft.meetScope) {
          await saveMeet({ scope: draft.meetScope, city: draft.meetCity });
        }
        break;
      case 'birthday':
        if (draft.birthday) await saveBirthday(draft.birthday);
        break;
      case 'visibility':
        await saveVisibility(draft.visibility);
        break;
      // 'groups' just explains + invites; 'coop' saves in the screen (needs the
      // fresh join/decline value).
      default:
        break;
    }

    const nextIndex = index + 1;
    if (nextIndex < ONBOARDING_ORDER.length) {
      const nextStep = ONBOARDING_ORDER[nextIndex];
      trackFlowStep('onboarding', nextStep);
      setStep(nextStep);
    }
  }, [step, index, draft]);

  /** Skip a step: move on without saving its slice. */
  const goSkip = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < ONBOARDING_ORDER.length) {
      const nextStep = ONBOARDING_ORDER[nextIndex];
      trackFlowStep('onboarding', nextStep);
      setStep(nextStep);
    }
  }, [index]);

  /** Step back to fix an earlier answer (no-op on the first screen). */
  const goBack = useCallback(() => {
    const prevIndex = index - 1;
    if (prevIndex >= 0) setStep(ONBOARDING_ORDER[prevIndex]);
  }, [index]);

  /** The finish line — only welcome-in calls this. */
  const complete = useCallback(async () => {
    await setOnboardingComplete();
    trackFlowCompleted('onboarding', Date.now() - startedAt);
    onDone();
  }, [onDone, startedAt]);

  const setVisibilityTier = useCallback((rowId: string, tier: Tier) => {
    setDraft((d) => ({
      ...d,
      visibility: d.visibility.map((r) => (r.id === rowId ? { ...r, tier } : r))
    }));
  }, []);

  const setAllVisibility = useCallback((tier: Tier) => {
    setDraft((d) => ({
      ...d,
      visibility: d.visibility.map((r) => ({ ...r, tier }))
    }));
  }, []);

  return useMemo(
    () => ({
      step,
      index,
      // progress covers every step except the final welcome-in celebration
      total: ONBOARDING_ORDER.length - 1,
      draft,
      patch,
      goNext,
      goSkip,
      goBack,
      complete,
      setVisibilityTier,
      setAllVisibility
    }),
    [step, index, draft, patch, goNext, goSkip, goBack, complete, setVisibilityTier, setAllVisibility]
  );
}
