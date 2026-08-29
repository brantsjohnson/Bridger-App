// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain of the onboarding run. It holds every draft answer across the
// screens, moves forward / back / skips through the ordered steps, kicks off
// each step's save as you leave (UI moves first; only confirm-profile waits
// on the network), and when Co-op (the last step) finishes it marks
// onboarding complete. The screen components stay simple because all the
// state lives here.
//
// The run mixes two kinds of screens:
//  - FORM steps (questions) — these show the progress bar.
//  - STAT interstitials — full-screen moments that are NOT counted in the
//    progress bar (so progress reflects real questions answered).
//
// Order (from the new flow doc): confirm profile → birthday → [feed stat] →
// contacts → [isolation stat] → friends of friends → [retention stat] →
// notifications → taste intro → right now → obsession → social battery → color
// → places → privacy circles → privacy & control → [screentime stat] → co-op.
// Finishing Co-op completes onboarding and lands on Home, which plays the
// welcome fireworks (the old "You're in" screen was removed 2026-08-28).
// (Recap voice step archived 2026-08-28; Friend Pod still records weekly recaps.)
// ============================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { trackFlowCompleted, trackFlowStep, type Tier } from '@bridger/shared';
import { clearDevPreview, getDemoOnboardSeed, isDemoMode } from '../lib/demo';
import type { GeocodeHit } from '../lib/geocode';
import { getOAuthProfilePrefill } from '../lib/oauth';
import { supabase } from '../lib/supabase';
import {
  buildPrivacyRows,
  clearOnboardingProgress,
  flushOnboardingDraft,
  loadOnboardingProgress,
  persistOnboardingProgressLocal,
  saveBirthday,
  saveColor,
  saveConnectionStyle,
  saveName,
  saveNotifications,
  saveObsessionSong,
  saveOnboardingProgress,
  savePhoto,
  savePlaces,
  savePrivacyRowValue,
  saveRightNow,
  saveSocialBattery,
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
  | 'privacy-circles'
  | 'privacy-control'
  | 'stat-screentime'
  | 'coop-intro'
  | 'coop';

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
  'privacy-circles',
  'privacy-control',
  'stat-screentime',
  'coop-intro',
  'coop'
];

/** Screens that do NOT count toward the progress bar (moments, not questions). */
const NON_FORM: OnboardingStepKey[] = [
  'stat-feed',
  'stat-isolation',
  'stat-retention',
  'stat-screentime',
  // The blue "what a co-op is" splash is a moment, like the stat screens.
  'coop-intro'
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
  /** Geocoded pick for the favorite trip (map pin). Null until they search and pick. */
  favoritePlaceHit: GeocodeHit | null;
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
  favoritePlaceHit: null,
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

  // THIS SECTION DOES: track whether we have finished checking for a saved
  // resume point yet. The screen waits on this so it never flashes screen one
  // before jumping to where the person actually left off.
  const [hydrated, setHydrated] = useState(false);

  // An always-current copy of the draft so the save-on-advance helpers below
  // record the latest answers without stale-closure bugs.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // THIS SECTION DOES: on relaunch, look for a saved resume point (device first,
  // then Supabase). If one exists, drop the person back on that screen with the
  // answers they already gave, so a crash / force-quit never restarts the run.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await loadOnboardingProgress();
        if (
          !cancelled &&
          saved &&
          ONBOARDING_ORDER.includes(saved.step as OnboardingStepKey)
        ) {
          setDraft((d) => ({ ...d, ...(saved.draft as Partial<Draft>) }));
          setStep(saved.step as OnboardingStepKey);
        }
      } catch {
        // No resume point / read failed: start at the beginning.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // THIS SECTION DOES: quietly keep a DEVICE copy of the current screen + answers
  // as they change (short debounce), so even mid-typing progress survives a
  // force-quit. The heavier "also save to Supabase" write happens on advance /
  // back below. We wait until hydration so we never overwrite a saved point with
  // the empty starting draft.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      void persistOnboardingProgressLocal(step, draft as Record<string, unknown>);
    }, 400);
    return () => clearTimeout(t);
  }, [step, draft, hydrated]);

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
      // Record the new resume point (device + Supabase) as we move forward.
      void saveOnboardingProgress(nextStep, draftRef.current as Record<string, unknown>);
    }
  }, [index]);

  /**
   * Leave this step: move the UI first, save in the background.
   *
   * IMPORTANT: Continue should feel instant. We only wait on the network for
   * confirm-profile (name + photo must land before Home). Every other step
   * advances immediately and finishes its save quietly; a failed save never
   * traps someone on the screen.
   */
  const goNext = useCallback(async () => {
    // Snapshot what we're leaving so a background save still has the answers.
    const leaving = step;
    const snapshot = draft;

    const runSave = async () => {
      switch (leaving) {
        case 'confirm-profile': {
          // REQUIRED: name + photo must reach the server before we advance.
          await saveName(`${snapshot.firstName} ${snapshot.lastName}`.trim());
          if (snapshot.photoUri || snapshot.filteredMediaId) {
            await savePhoto({
              source: snapshot.photoSource,
              uri: snapshot.photoUri ?? undefined,
              filteredMediaId: snapshot.filteredMediaId
            });
          } else if (!snapshot.photoEmoji) {
            // Live requires a real photo; demo may use an emoji stand-in.
            throw new Error('Add a profile photo to continue.');
          }
          break;
        }
        case 'birthday':
          if (snapshot.birthday) await saveBirthday(snapshot.birthday);
          break;
        case 'friends-of-friends':
          await saveConnectionStyle(snapshot.connectStyles);
          break;
        case 'notifications':
          await saveNotifications(snapshot.notifPrefs);
          break;
        case 'right-now':
          await saveRightNow({
            currentJob: snapshot.currentJob,
            dreamJob: snapshot.dreamJob
          });
          break;
        case 'obsession':
          await saveObsessionSong(snapshot.song);
          break;
        case 'social-battery':
          if (snapshot.nights != null) await saveSocialBattery(snapshot.nights);
          break;
        case 'color':
          if (snapshot.color) await saveColor(snapshot.color);
          break;
        case 'places':
          await savePlaces({
            hometown: snapshot.hometown,
            currentTown: snapshot.currentTown,
            favoritePlace: snapshot.favoritePlace,
            favoritePlaceHit: snapshot.favoritePlaceHit
          });
          break;
        case 'privacy-control':
          await saveVisibility(snapshot.visibility);
          break;
        // stat screens, taste-intro, contacts, and co-op save inside their screens.
        default:
          break;
      }
    };

    // confirm-profile: must succeed before we leave, or Home is blank.
    if (leaving === 'confirm-profile') {
      try {
        await runSave();
      } catch (err) {
        console.warn('Onboarding save failed on confirm-profile; staying put.', err);
        Alert.alert(
          'Could not save your profile',
          err instanceof Error
            ? err.message
            : 'Check your connection and try Continue again.'
        );
        return;
      }
      advance();
      return;
    }

    // Everything else: flip the screen now, save while they look at the next step.
    advance();
    void runSave().catch((err) => {
      console.warn(`Onboarding save failed on "${leaving}"; continuing.`, err);
    });
  }, [step, draft, advance]);

  /** Skip a step: move on without saving its slice. */
  const goSkip = useCallback(() => advance(), [advance]);

  /** Step back to fix an earlier answer (no-op on the first screen). */
  const goBack = useCallback(() => {
    const prevIndex = index - 1;
    if (prevIndex >= 0) {
      const prevStep = ONBOARDING_ORDER[prevIndex]!;
      setDir(-1);
      setStep(prevStep);
      // Stepping back updates the resume point too, so the last-known screen and
      // any edited answers stay in sync (device + Supabase).
      void saveOnboardingProgress(prevStep, draftRef.current as Record<string, unknown>);
    }
  }, [index]);

  /** The finish line — Co-op (the last step) calls this. Always leaves to Home. */
  const complete = useCallback(async () => {
    // THIS SECTION DOES: one last pass so every draft answer is in Supabase,
    // even if an earlier step's save failed quietly.
    try {
      await flushOnboardingDraft(draftRef.current);
    } catch (err) {
      console.warn('Onboarding flush failed; continuing to Home.', err);
    }
    try {
      await setOnboardingComplete();
    } catch (err) {
      // Local flag should already be set inside setOnboardingComplete; still
      // never strand the person on the last onboarding step.
      console.warn('Onboarding complete save failed; continuing to Home.', err);
    }
    try {
      trackFlowCompleted('onboarding', Date.now() - startedAt);
    } catch {
      // Analytics must never block the finish.
    }
    // Finished for real: wipe the resume point (device + Supabase) so a later
    // launch never tries to drop them back into a run they already completed.
    void clearOnboardingProgress();
    clearDevPreview();
    onDone();
  }, [onDone, startedAt]);

  /** Build the Privacy & Control rows from the taste answers (no onboarding recap). */
  const initVisibility = useCallback(() => {
    setDraft((d) => {
      // Drop a leftover weekly_recap row from an older draft so it never shows.
      if (d.visibility.length > 0) {
        const cleaned = d.visibility.filter((r) => r.id !== 'weekly_recap');
        if (cleaned.length === d.visibility.length) return d;
        return { ...d, visibility: cleaned };
      }
      return {
        ...d,
        visibility: buildPrivacyRows({
          birthday: d.birthday,
          hometown: d.hometown,
          currentTown: d.currentTown,
          currentJob: d.currentJob,
          dreamJob: d.dreamJob,
          favoritePlace: d.favoritePlace,
          song: d.song
        })
      };
    });
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

  /**
   * Privacy Edit: update the draft field + row display, then write Supabase
   * right away so the change is not waiting on Continue.
   */
  const updateVisibilityValue = useCallback(async (rowId: string, value: string) => {
    const trimmed = value.trim();
    const display = trimmed || 'Not added';

    // THIS SECTION DOES: mirror the edit into the matching draft fields.
    setDraft((d) => {
      const next = {
        ...d,
        visibility: d.visibility.map((r) =>
          r.id === rowId ? { ...r, value: display } : r
        )
      };
      if (rowId === 'about:about-birthday') next.birthday = trimmed;
      if (rowId === 'about:about-from') next.hometown = trimmed;
      if (rowId === 'about:about-town') next.currentTown = trimmed;
      if (rowId === 'about:about-job') next.currentJob = trimmed;
      if (rowId === 'about:about-dream-job') next.dreamJob = trimmed;
      if (rowId === 'about:about-favorite-place') {
        next.favoritePlace = trimmed;
        // Text-only edit: drop the old map hit so we do not keep a stale pin label.
        next.favoritePlaceHit = null;
      }
      if (rowId === 'currently_song') next.song = trimmed;
      return next;
    });

    await savePrivacyRowValue(rowId, trimmed);
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
      hydrated,
      patch,
      goNext,
      goSkip,
      goBack,
      complete,
      initVisibility,
      setVisibilityTier,
      setAllVisibility,
      updateVisibilityValue,
      formStep,
      formTotal,
      dir
    }),
    [
      step,
      index,
      draft,
      hydrated,
      patch,
      goNext,
      goSkip,
      goBack,
      complete,
      initVisibility,
      setVisibilityTier,
      setAllVisibility,
      updateVisibilityValue,
      formStep,
      formTotal,
      dir
    ]
  );
}
