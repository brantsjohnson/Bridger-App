// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain of the onboarding run. It holds every draft answer, moves through
// the screens, and saves as you leave. New accounts walk the New story flow
// (profile, then education, then optional feature tours). Demo can still run
// the Old 19-step flow. Finishing marks onboarding complete and lands on Home.
//
// New flow: name → photo → birthday → why → privacy → what would help →
// only the feature screens they picked → co-op story → join / invite → Home.
// Home plays the congratulations splash. Joining stays skippable via invite 3.
//
// Old flow (demo): confirm profile through Co-op, same as before.
// ============================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { trackFlowCompleted, trackFlowStep, type Tier } from '@bridger/shared';
import { clearDevPreview, getDemoOnboardSeed, isDemoMode } from '../lib/demo';
import { setPendingDeepLink } from '../lib/pending-deep-link';
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
  saveBirthdayAudience,
  saveColor,
  saveConnectionStyle,
  saveHelpInterests,
  saveMembershipInterests,
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
import {
  BRANCH_DEEP_LINK,
  BRANCH_START,
  NEW_ONBOARDING_ORDER,
  ROUTING_ONLY_STEPS,
  STEP_BRANCH,
  type CtaAction,
  type NewOnboardingStepKey
} from '../components/onboarding/onboarding-new-copy';
import {
  FEATURE_IDS,
  LEGACY_HELP_INTEREST,
  RESUME_ALIASES
} from '../components/onboarding/onboarding-new-flow';

export type FlowVariant = 'new' | 'old';

export type OldOnboardingStepKey =
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

export type OnboardingStepKey = OldOnboardingStepKey | NewOnboardingStepKey;

export const OLD_ONBOARDING_ORDER: OldOnboardingStepKey[] = [
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

/** @deprecated Use OLD_ONBOARDING_ORDER. Kept so older imports still compile. */
export const ONBOARDING_ORDER = OLD_ONBOARDING_ORDER;

const OLD_NON_FORM: OldOnboardingStepKey[] = [
  'stat-feed',
  'stat-isolation',
  'stat-retention',
  'stat-screentime',
  'coop-intro'
];

const OLD_FORM_STEPS = OLD_ONBOARDING_ORDER.filter((s) => !OLD_NON_FORM.includes(s));

const NEW_FORM_STEPS: NewOnboardingStepKey[] = [
  'name',
  'photo',
  'birthday',
  'privacy-birthday',
  'product-picks',
  'coop-matters'
];

const ROUTING_SET = new Set<string>(ROUTING_ONLY_STEPS);

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
  /** Server-baked picture id to save as the avatar, or null for plain. */
  filteredMediaId: string | null;
  /** Unfiltered media id (live) so Edit can switch looks later. */
  originalMediaId: string | null;
  /**
   * Demo / preview: a baked data-URL (or signed URL) to show as the avatar
   * when there is no server media id yet.
   */
  bakedPhotoUri: string | null;
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
  /** Places step: Private (none) or Close friends only (close). */
  hometownPrivacy: 'none' | 'close';
  currentTownPrivacy: 'none' | 'close';
  favoritePlacePrivacy: 'none' | 'close';
  visibility: VisibilityRow[];
  /** New: who can see the birthday (Groups). */
  birthdayTier: Tier | null;
  membershipInterests: string[];
  helpInterests: string[];
  pageAuthoring: 'auto' | 'manual' | 'assist' | null;
  branchQueue: string[];
  branchIndex: number;
  pendingDeepLink: string | null;
};

const EMPTY_DRAFT: Draft = {
  firstName: '',
  lastName: '',
  photoSource: null,
  photoUri: null,
  photoEmoji: null,
  photoFilter: 'pop_art',
  filteredMediaId: null,
  originalMediaId: null,
  bakedPhotoUri: null,
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
  // Default: Private until they widen it. Close friends is one tap away.
  hometownPrivacy: 'none',
  currentTownPrivacy: 'none',
  favoritePlacePrivacy: 'close',
  visibility: [],
  birthdayTier: null,
  membershipInterests: [],
  helpInterests: [],
  pageAuthoring: null,
  branchQueue: [],
  branchIndex: 0,
  pendingDeepLink: null
};

export function useOnboarding(
  onDone: () => void,
  variant: FlowVariant = 'old'
) {
  const order: OnboardingStepKey[] =
    variant === 'old' ? OLD_ONBOARDING_ORDER : NEW_ONBOARDING_ORDER;
  const startStep: OnboardingStepKey =
    variant === 'old' ? 'confirm-profile' : 'name';
  const [step, setStep] = useState<OnboardingStepKey>(startStep);
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
  // Blocks double-taps on Continue while a required save is still running
  // (comic bake + PATCH /me). Stops stacked "Could not save" alerts.
  const savingRef = useRef(false);

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
        if (!cancelled && saved) {
          const rawStep = saved.step as string;
          const mappedStep = (RESUME_ALIASES[rawStep] ?? rawStep) as OnboardingStepKey;
          const savedDraft = { ...(saved.draft as Partial<Draft>) };
          if (Array.isArray(savedDraft.helpInterests)) {
            savedDraft.helpInterests = savedDraft.helpInterests.map(
              (id) => LEGACY_HELP_INTEREST[id] ?? id
            );
          }
          setDraft((d) => ({ ...d, ...savedDraft }));
          if (order.includes(mappedStep)) {
            setStep(mappedStep);
          }
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
  }, [order]);

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

  const index = order.indexOf(step);
  const patch = useCallback(
    (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next })),
    []
  );

  const historyRef = useRef<OnboardingStepKey[]>([]);

  /** True if linear advance is allowed to land on this screen. */
  const isReachable = useCallback(
    (key: OnboardingStepKey, d: Draft): boolean => {
      if (variant === 'old') return true;
      if (ROUTING_SET.has(key)) return false;
      const branch = STEP_BRANCH[key as NewOnboardingStepKey];
      if (branch && !d.helpInterests.includes(branch)) return false;
      return true;
    },
    [variant]
  );

  const jumpTo = useCallback(
    (nextStep: OnboardingStepKey, from = step) => {
      if (from !== nextStep) historyRef.current.push(from);
      trackFlowStep('onboarding', nextStep);
      setDir(1);
      setStep(nextStep);
      void saveOnboardingProgress(nextStep, draftRef.current as Record<string, unknown>);
    },
    [step]
  );

  /** Move to the next reachable screen (or finish). */
  const advance = useCallback(() => {
    const i = order.indexOf(step);
    for (let j = i + 1; j < order.length; j++) {
      const nextStep = order[j]!;
      if (!isReachable(nextStep, draftRef.current)) continue;
      jumpTo(nextStep);
      return;
    }
    // No more screens: New flow finishes. Old flow stays on Co-op until complete().
    if (variant === 'new') {
      void completeRef.current();
    }
  }, [order, step, isReachable, jumpTo, variant]);

  const goto = useCallback(
    (nextStep: OnboardingStepKey) => {
      jumpTo(nextStep);
    },
    [jumpTo]
  );

  // Filled after complete() exists so nextBranch can finish the run.
  const completeRef = useRef<() => Promise<void>>(async () => undefined);

  const nextBranch = useCallback(() => {
    const d = draftRef.current;
    const currentBranch = STEP_BRANCH[step as NewOnboardingStepKey];
    if (currentBranch && BRANCH_DEEP_LINK[currentBranch]) {
      const route = BRANCH_DEEP_LINK[currentBranch]!;
      draftRef.current = { ...d, pendingDeepLink: route };
      setDraft((prev) => ({ ...prev, pendingDeepLink: route }));
    }
    const nextIndex = (currentBranch ? d.branchIndex + 1 : d.branchIndex);
    const queue = d.branchQueue;
    if (nextIndex < queue.length) {
      const nextKey = BRANCH_START[queue[nextIndex]!];
      setDraft((prev) => ({ ...prev, branchIndex: nextIndex }));
      draftRef.current = { ...draftRef.current, branchIndex: nextIndex };
      if (nextKey) jumpTo(nextKey);
      else advance();
      return;
    }
    // Tours done: keep walking into the co-op story and the join screen.
    advance();
  }, [advance, jumpTo, step]);

  const finishOpen = useCallback((route: string) => {
    draftRef.current = { ...draftRef.current, pendingDeepLink: route };
    setDraft((prev) => ({ ...prev, pendingDeepLink: route }));
    void completeRef.current();
  }, []);

  /**
   * Leave this step: move the UI first, save in the background.
   *
   * IMPORTANT: Continue waits on the network for every step that writes
   * profile data (name, photo, birthday, places, song, privacy, …). Quiet
   * background saves used to drop answers when the API blipped.
   */
  const goNext = useCallback(async () => {
    if (savingRef.current) return;
    const leaving = step;
    const snapshot = draft;

    // Wait for the network on any step that writes profile data. Quiet
    // background saves used to drop places / song / privacy when the API
    // blipped, and people landed on Profile empty (TestFlight).
    const waitOn =
      leaving === 'confirm-profile' ||
      leaving === 'name' ||
      leaving === 'photo' ||
      leaving === 'birthday' ||
      leaving === 'privacy-birthday' ||
      leaving === 'right-now' ||
      leaving === 'obsession' ||
      leaving === 'places' ||
      leaving === 'privacy-control' ||
      leaving === 'friends-of-friends' ||
      leaving === 'notifications' ||
      leaving === 'coop-matters' ||
      leaving === 'product-picks' ||
      leaving === 'social-battery' ||
      leaving === 'color';

    if (waitOn) savingRef.current = true;

    const bakePhoto = async () => {
      let filteredMediaId = snapshot.filteredMediaId;
      let originalMediaId = snapshot.originalMediaId;
      let bakedPhotoUri = snapshot.bakedPhotoUri;

      if (
        snapshot.photoUri &&
        snapshot.photoFilter &&
        !filteredMediaId &&
        !isDemoMode()
      ) {
        try {
          const { bakeServerPhotoFilter } = await import('../lib/photo-filters');
          const baked = await bakeServerPhotoFilter(
            snapshot.photoUri,
            snapshot.photoFilter
          );
          filteredMediaId = baked.mediaId;
          originalMediaId = baked.originalMediaId;
          bakedPhotoUri = baked.url;
        } catch (err) {
          console.warn('[onboarding] late filter bake failed; saving plain', err);
        }
      }

      if (
        isDemoMode() &&
        snapshot.photoUri &&
        snapshot.photoFilter &&
        !bakedPhotoUri
      ) {
        // Web demo can paint looks in-canvas. Native demo has no canvas bake;
        // skip so Continue never hangs or crashes on a missing native painter.
        try {
          const { bakeClientPhotoFilter } = await import(
            '../lib/client-photo-filters'
          );
          const url = await bakeClientPhotoFilter(
            snapshot.photoUri,
            snapshot.photoFilter
          );
          if (url) bakedPhotoUri = url;
        } catch {
          // Plain photo is fine for demo.
        }
      }

      return { filteredMediaId, originalMediaId, bakedPhotoUri };
    };

    const runSave = async () => {
      switch (leaving) {
        case 'confirm-profile': {
          await saveName(`${snapshot.firstName} ${snapshot.lastName}`.trim());
          const baked = await bakePhoto();
          if (snapshot.photoUri || baked.filteredMediaId || baked.bakedPhotoUri) {
            await savePhoto({
              source: snapshot.photoSource,
              uri: baked.bakedPhotoUri ?? snapshot.photoUri ?? undefined,
              filteredMediaId: baked.filteredMediaId,
              originalMediaId: baked.originalMediaId,
              filter: snapshot.photoFilter,
              originalUri: snapshot.photoUri
            });
          } else if (!snapshot.photoEmoji) {
            throw new Error('Add a profile photo to continue.');
          }
          break;
        }
        case 'name':
          await saveName(`${snapshot.firstName} ${snapshot.lastName}`.trim());
          break;
        case 'photo': {
          // THIS SECTION DOES: save the picked face. Never crash the run if a
          // filter bake or upload fails; keep the plain photo and move on.
          const baked = await bakePhoto();
          if (!snapshot.photoUri && !baked.filteredMediaId && !baked.bakedPhotoUri) {
            throw new Error('Add a profile photo to continue.');
          }
          try {
            await savePhoto({
              source: snapshot.photoSource,
              uri: baked.bakedPhotoUri ?? snapshot.photoUri ?? undefined,
              filteredMediaId: baked.filteredMediaId,
              originalMediaId: baked.originalMediaId,
              filter: snapshot.photoFilter,
              originalUri: snapshot.photoUri
            });
          } catch (err) {
            // Demo / offline: still keep a local preview so the run continues.
            if (isDemoMode() && snapshot.photoUri) {
              console.warn('[onboarding] demo photo save failed; keeping local', err);
              try {
                await savePhoto({
                  source: snapshot.photoSource,
                  uri: snapshot.photoUri,
                  filter: snapshot.photoFilter,
                  originalUri: snapshot.photoUri
                });
              } catch (err2) {
                console.warn('[onboarding] demo plain photo save failed', err2);
              }
              break;
            }
            throw err;
          }
          break;
        }
        case 'birthday':
          if (snapshot.birthday) {
            await saveBirthday(snapshot.birthday, snapshot.birthdayTier ?? 'friend');
          }
          break;
        case 'privacy-birthday':
          if (snapshot.birthdayTier) {
            await saveBirthdayAudience(snapshot.birthday, snapshot.birthdayTier);
          }
          break;
        case 'coop-matters':
          await saveMembershipInterests(snapshot.membershipInterests);
          break;
        case 'product-picks': {
          const ordered = FEATURE_IDS.filter((id) =>
            snapshot.helpInterests.includes(id)
          );
          await saveHelpInterests(ordered);
          break;
        }
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
            favoritePlaceHit: snapshot.favoritePlaceHit,
            hometownTier: snapshot.hometownPrivacy,
            currentTownTier: snapshot.currentTownPrivacy,
            favoritePlaceTier: snapshot.favoritePlacePrivacy
          });
          break;
        case 'privacy-control':
          await saveVisibility(snapshot.visibility);
          break;
        default:
          break;
      }
    };

    if (waitOn) {
      try {
        await runSave();
      } catch (err) {
        console.warn(`Onboarding save failed on ${leaving}; staying put.`, err);
        const raw = err instanceof Error ? err.message : '';
        const friendly =
          /api 502|internal server error|gateway|not signed in/i.test(raw) || !raw
            ? 'Something went wrong saving. Check your connection and try Continue again.'
            : raw;
        try {
          Alert.alert('Could not save', friendly);
        } catch {
          // Alert unavailable (rare): still stay on this step.
        }
        return;
      } finally {
        savingRef.current = false;
      }
    }

    // THIS SECTION DOES: remember the first picked feature so Home can open it.
    if (leaving === 'product-picks') {
      const ordered = FEATURE_IDS.filter((id) => snapshot.helpInterests.includes(id));
      const first = ordered[0];
      const route = first ? BRANCH_DEEP_LINK[first] : null;
      if (route) {
        draftRef.current = { ...snapshot, helpInterests: ordered, pendingDeepLink: route };
        setDraft((prev) => ({ ...prev, helpInterests: ordered, pendingDeepLink: route }));
      } else {
        draftRef.current = { ...snapshot, helpInterests: ordered };
        setDraft((prev) => ({ ...prev, helpInterests: ordered }));
      }
    }

    if (waitOn) {
      try {
        advance();
      } catch (err) {
        console.warn(`Onboarding advance failed after ${leaving}`, err);
      }
      return;
    }

    try {
      advance();
    } catch (err) {
      console.warn(`Onboarding advance failed after ${leaving}`, err);
    }
    void runSave().catch((err) => {
      console.warn(`Onboarding save failed on "${leaving}"; continuing.`, err);
    });
  }, [step, draft, advance, goto]);

  const act = useCallback(
    (action: CtaAction) => {
      switch (action.kind) {
        case 'next':
          void goNext();
          return;
        case 'skip':
          advance();
          return;
        case 'save-next':
          void goNext();
          return;
        case 'goto':
          goto(action.step);
          return;
        case 'next-branch':
          nextBranch();
          return;
        case 'finish':
          void completeRef.current();
          return;
        case 'finish-open':
          finishOpen(action.route);
          return;
      }
    },
    [advance, finishOpen, goNext, goto, nextBranch]
  );

  /** Skip a step: move on without saving its slice. */
  const goSkip = useCallback(() => advance(), [advance]);

  /** Step back to fix an earlier answer (no-op on the first screen). */
  const goBack = useCallback(() => {
    const popped = historyRef.current.pop();
    if (popped) {
      setDir(-1);
      setStep(popped);
      void saveOnboardingProgress(popped, draftRef.current as Record<string, unknown>);
      return;
    }
    const prevIndex = index - 1;
    if (prevIndex >= 0) {
      let prevStep = order[prevIndex]!;
      for (let j = prevIndex; j >= 0; j--) {
        const candidate = order[j]!;
        if (isReachable(candidate, draftRef.current) || ROUTING_SET.has(candidate)) {
          prevStep = candidate;
          break;
        }
      }
      setDir(-1);
      setStep(prevStep);
      void saveOnboardingProgress(prevStep, draftRef.current as Record<string, unknown>);
    }
  }, [index, order, isReachable]);


  // Stable handle so Co-op re-renders do not rebuild `complete` and risk a
  // second finish pass. Always call the latest onDone the parent passed in.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  // Blocks a double Continue / Join from running the finish line twice.
  const completingRef = useRef(false);

  /** The finish line. New flow can call this from any last branch. Always leaves to Home. */
  const complete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    const d = draftRef.current;
    // THIS SECTION DOES: if they never picked a birthday group, default to Friends.
    if (!d.birthdayTier) {
      d.birthdayTier = 'friend';
      draftRef.current = { ...d, birthdayTier: 'friend' };
    }
    try {
      await flushOnboardingDraft(draftRef.current);
    } catch (err) {
      completingRef.current = false;
      const raw = err instanceof Error ? err.message : '';
      Alert.alert(
        'Could not finish saving',
        /api 502|internal server error|gateway/i.test(raw) || !raw
          ? 'Check your connection and tap Continue again so your answers land on your profile.'
          : raw
      );
      return;
    }
    try {
      if (draftRef.current.pendingDeepLink) {
        await setPendingDeepLink(draftRef.current.pendingDeepLink);
      }
    } catch {
      // Home still works if the deep link write fails.
    }
    try {
      await setOnboardingComplete();
    } catch (err) {
      console.warn('Onboarding complete save failed; continuing to Home.', err);
    }
    try {
      trackFlowCompleted('onboarding', Date.now() - startedAt);
    } catch {
      // Analytics must never block the finish.
    }
    void clearOnboardingProgress();
    clearDevPreview();
    onDoneRef.current();
  }, [startedAt]);

  useEffect(() => {
    completeRef.current = complete;
  }, [complete]);

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
          song: d.song,
          hometownTier: d.hometownPrivacy,
          currentTownTier: d.currentTownPrivacy,
          favoritePlaceTier: d.favoritePlacePrivacy
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

    // Write the server first. Only then mirror into the draft — otherwise a
    // failed AI follow-up (or network blip) showed "Could not save" while the
    // draft already looked updated (hometown edit bug).
    await savePrivacyRowValue(rowId, trimmed);

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
  }, []);

  // Progress numbers: where we are among the question screens (stat + welcome
  // don't count). formStep is 0 on a non-form screen.
  const formSteps = variant === 'old' ? OLD_FORM_STEPS : NEW_FORM_STEPS;
  const formTotal = formSteps.length;
  const formStep = formSteps.includes(step as never)
    ? formSteps.indexOf(step as never) + 1
    : 0;

  return useMemo(
    () => ({
      variant,
      step,
      index,
      draft,
      hydrated,
      patch,
      goNext,
      goSkip,
      goBack,
      goto,
      nextBranch,
      finishOpen,
      act,
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
      variant,
      step,
      index,
      draft,
      hydrated,
      patch,
      goNext,
      goSkip,
      goBack,
      goto,
      nextBranch,
      finishOpen,
      act,
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
