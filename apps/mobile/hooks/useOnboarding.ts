// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain of the onboarding run. It holds every draft answer across the
// screens, moves forward / back / skips through the ordered steps, saves each
// step's slice as you leave it, and on the very last screen marks onboarding
// complete. The screen components stay simple because all the state lives here.
//
// The run mixes two kinds of screens:
//  - FORM steps (questions) — these show the progress bar.
//  - STAT interstitials + welcome-in — full-screen moments that are NOT counted
//    in the progress bar (so progress reflects real questions answered).
//
// Order (from the new flow doc): confirm profile → birthday → [feed stat] →
// contacts → [isolation stat] → friends of friends → [retention stat] →
// notifications → taste intro → right now → obsession → social battery → color
// → places → recap → privacy & control → [screentime stat] → co-op → welcome.
// ============================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackFlowCompleted, trackFlowStep, type Tier } from '@bridger/shared';
import { clearDevPreview, getDemoOnboardSeed, isDemoMode } from '../lib/demo';
import { getOAuthProfilePrefill } from '../lib/oauth';
import { supabase } from '../lib/supabase';
import {
  buildPrivacyRows,
  saveBirthday,
  saveColor,
  saveConnectionStyle,
  saveName,
  saveNotifications,
  saveObsessionSong,
  savePhoto,
  savePlaces,
  saveRightNow,
  saveSocialBattery,
  saveRecap,
  saveVisibility,
  setOnboardingComplete,
  type PhotoSource,
  type VisibilityRow
} from '../data/onboarding';
import type { PhotoFilterKey } from '../components/onboarding/PhotoFilterPicker';

export type OnboardingStepKey =
  | 'confirm-profile'
  | 'birthday'
  | 'stat-feed'
  | 'contacts'
  | 'stat-isolation'
  | 'friends-of-friends'
  | 'stat-retention'
  | 'notifications'
  | 'taste-intro'
  | 'right-now'
  | 'obsession'
  | 'social-battery'
  | 'color'
  | 'places'
  | 'recap'
  | 'privacy-control'
  | 'stat-screentime'
  | 'coop'
  | 'welcome-in';

export const ONBOARDING_ORDER: OnboardingStepKey[] = [
  'confirm-profile',
  'birthday',
  'stat-feed',
  'contacts',
  'stat-isolation',
  'friends-of-friends',
  'stat-retention',
  'notifications',
  'taste-intro',
  'right-now',
  'obsession',
  'social-battery',
  'color',
  'places',
  'recap',
  'privacy-control',
  'stat-screentime',
  'coop',
  'welcome-in'
];

/** Screens that do NOT count toward the progress bar (moments, not questions). */
const NON_FORM: OnboardingStepKey[] = [
  'stat-feed',
  'stat-isolation',
  'stat-retention',
  'stat-screentime',
  'welcome-in'
];

/** Just the question screens, in order — used to number the progress bar. */
const FORM_STEPS = ONBOARDING_ORDER.filter((s) => !NON_FORM.includes(s));

/** The whole run's draft. The only required answers are first + last name. */
type Draft = {
  firstName: string;
  lastName: string;
  photoSource: PhotoSource | null;
  photoUri: string | null;
  /** Demo-only: an emoji shown as the avatar when there is no real photo. */
  photoEmoji: string | null;
  /** Which look is picked under the photo (Pop art / X-ray / Comic / Sepia). */
  photoFilter: PhotoFilterKey;
  /** Server-baked picture id to save as the avatar (Comic), or null for plain. */
  filteredMediaId: string | null;
  birthday: string;
  contactsSynced: boolean;
  invited: boolean;
  /** Three invite slots filled during contacts (#1 / #2 / #3). */
  inviteSlots: Array<{ sent: boolean; label: string | null }>;
  connectStyles: string[];
  notifPrefs: string[];
  currentJob: string;
  dreamJob: string;
  song: string;
  spotifyConnected: boolean;
  appleConnected: boolean;
  nights: number | null;
  color: string | null;
  hometown: string;
  currentTown: string;
  favoritePlace: string;
  recapMode: 'voice' | 'text';
  recapText: string;
  recapRecorded: boolean;
  recapUri: string | null;
  visibility: VisibilityRow[];
};

const EMPTY_DRAFT: Draft = {
  firstName: '',
  lastName: '',
  photoSource: null,
  photoUri: null,
  photoEmoji: null,
  photoFilter: 'pop_art',
  filteredMediaId: null,
  birthday: '',
  contactsSynced: false,
  invited: false,
  inviteSlots: [
    { sent: false, label: null },
    { sent: false, label: null },
    { sent: false, label: null }
  ],
  connectStyles: [],
  // Every reminder starts off. Nothing is turned on for you: you opt in.
  notifPrefs: [],
  currentJob: '',
  dreamJob: '',
  song: '',
  spotifyConnected: false,
  appleConnected: false,
  nights: null,
  color: null,
  hometown: '',
  currentTown: '',
  favoritePlace: '',
  recapMode: 'voice',
  recapText: '',
  recapRecorded: false,
  recapUri: null,
  visibility: []
};

export function useOnboarding(onDone: () => void) {
  const [step, setStep] = useState<OnboardingStepKey>('confirm-profile');
  // Start empty, unless we entered via the "onboard" demo bypass — then pre-fill
  // the first + last name and an emoji avatar so it feels already set up.
  const [draft, setDraft] = useState<Draft>(() => {
    const seed = isDemoMode() ? getDemoOnboardSeed() : null;
    if (!seed) return EMPTY_DRAFT;
    return {
      ...EMPTY_DRAFT,
      firstName: seed.firstName,
      lastName: seed.lastName,
      photoEmoji: seed.emoji
    };
  });
  const [startedAt] = useState(() => Date.now());

  // THIS SECTION DOES: for real (non-demo) sign-ins, pre-fill the first name,
  // last name, and profile photo from the Google/Apple account so the person
  // just confirms instead of retyping. We only fill blanks, so anything they
  // have already typed is never overwritten. Re-runs when auth session arrives
  // (the first mount can beat the OAuth hand-off).
  useEffect(() => {
    if (isDemoMode()) return;
    let cancelled = false;

    const applyPrefill = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session?.user || cancelled) return;

        const prefill = await getOAuthProfilePrefill();
        if (cancelled) return;
        setDraft((d) => ({
          ...d,
          firstName: d.firstName || prefill.firstName,
          lastName: d.lastName || prefill.lastName,
          photoSource: d.photoSource ?? (prefill.avatarUrl ? 'library' : null),
          photoUri: d.photoUri ?? prefill.avatarUrl
        }));
      } catch {
        // No prefill available (e.g. email sign-up): leave the form empty.
      }
    };

    void applyPrefill();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void applyPrefill();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  // THIS SECTION DOES: remember which way we moved so the slide animation
  // knows whether to come in from the right (forward) or the left (back).
  const [dir, setDir] = useState<1 | -1>(1);

  const index = ONBOARDING_ORDER.indexOf(step);
  const patch = useCallback(
    (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next })),
    []
  );

  /** Move to the next screen (or finish), logging a flow step as we go. */
  const advance = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < ONBOARDING_ORDER.length) {
      const nextStep = ONBOARDING_ORDER[nextIndex];
      trackFlowStep('onboarding', nextStep);
      setDir(1);
      setStep(nextStep);
    }
  }, [index]);

  /**
   * Save the step we're leaving, then move to the next.
   *
   * IMPORTANT: the save is wrapped so a failed network/API call can NEVER trap
   * someone on a screen. Before this, if saving the name on step 1 threw (for
   * example the API was unreachable), Continue silently did nothing. Now we try
   * to save, but always move forward either way, so the button always advances.
   */
  const goNext = useCallback(async () => {
    try {
      switch (step) {
        case 'confirm-profile':
          await saveName(`${draft.firstName} ${draft.lastName}`.trim());
          if (draft.photoSource)
            await savePhoto({
              source: draft.photoSource,
              uri: draft.photoUri ?? undefined,
              filteredMediaId: draft.filteredMediaId
            });
          break;
        case 'birthday':
          if (draft.birthday) await saveBirthday(draft.birthday);
          break;
        case 'friends-of-friends':
          await saveConnectionStyle(draft.connectStyles);
          break;
        case 'notifications':
          await saveNotifications(draft.notifPrefs);
          break;
        case 'right-now':
          await saveRightNow({ currentJob: draft.currentJob, dreamJob: draft.dreamJob });
          break;
        case 'obsession':
          await saveObsessionSong(draft.song);
          break;
        case 'social-battery':
          if (draft.nights != null) await saveSocialBattery(draft.nights);
          break;
        case 'color':
          if (draft.color) await saveColor(draft.color);
          break;
        case 'places':
          await savePlaces({
            hometown: draft.hometown,
            currentTown: draft.currentTown,
            favoritePlace: draft.favoritePlace
          });
          break;
        case 'recap':
          await saveRecap({
            mode: draft.recapMode,
            text: draft.recapText,
            recorded: draft.recapRecorded,
            recordedUri: draft.recapUri ?? undefined
          });
          break;
        case 'privacy-control':
          await saveVisibility(draft.visibility);
          break;
        // stat screens, taste-intro, contacts, and co-op save inside their screens.
        default:
          break;
      }
    } catch (err) {
      // Saving failed (offline, API down, etc.). Don't strand the person on the
      // step: log it for debugging and still move forward.
      console.warn(`Onboarding save failed on "${step}"; continuing.`, err);
    }
    advance();
  }, [step, draft, advance]);

  /** Skip a step: move on without saving its slice. */
  const goSkip = useCallback(() => advance(), [advance]);

  /** Step back to fix an earlier answer (no-op on the first screen). */
  const goBack = useCallback(() => {
    const prevIndex = index - 1;
    if (prevIndex >= 0) {
      setDir(-1);
      setStep(ONBOARDING_ORDER[prevIndex]);
    }
  }, [index]);

  /** The finish line — only welcome-in calls this. */
  const complete = useCallback(async () => {
    await setOnboardingComplete();
    trackFlowCompleted('onboarding', Date.now() - startedAt);
    clearDevPreview();
    onDone();
  }, [onDone, startedAt]);

  /** Build the Privacy & Control rows from the six taste answers. */
  const initVisibility = useCallback(() => {
    setDraft((d) => ({
      ...d,
      visibility: buildPrivacyRows({
        birthday: d.birthday,
        currentJob: d.currentJob,
        dreamJob: d.dreamJob,
        favoritePlace: d.favoritePlace,
        song: d.song,
        recapText: d.recapText,
        recapRecorded: d.recapRecorded
      })
    }));
  }, []);

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

  // Progress numbers: where we are among the question screens (stat + welcome
  // don't count). formStep is 0 on a non-form screen.
  const formTotal = FORM_STEPS.length;
  const formStep = FORM_STEPS.includes(step) ? FORM_STEPS.indexOf(step) + 1 : 0;

  return useMemo(
    () => ({
      step,
      index,
      draft,
      patch,
      goNext,
      goSkip,
      goBack,
      complete,
      initVisibility,
      setVisibilityTier,
      setAllVisibility,
      formStep,
      formTotal,
      dir
    }),
    [
      step,
      index,
      draft,
      patch,
      goNext,
      goSkip,
      goBack,
      complete,
      initVisibility,
      setVisibilityTier,
      setAllVisibility,
      formStep,
      formTotal,
      dir
    ]
  );
}
