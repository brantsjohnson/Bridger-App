// ============================================
// WHAT THIS FILE DOES (plain English):
// The brain of the onboarding run. It holds every draft answer, moves through
// the screens, and saves as you leave. New accounts walk the New story flow
// (profile, then education, then optional feature tours). Demo can still run
// the Old 19-step flow. Finishing marks onboarding complete and lands on Home.
//
// New flow: first name → last name → photo → birthday → why → privacy
// (birthday example) → groups → co-op story → optional membership / invite
// routing → "what would help" → only the tours they picked → Home.
// Co-op is optional. There is no paywall.
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
  savePageAuthoring,
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
  BRANCH_ORDER,
  BRANCH_START,
  NEW_ONBOARDING_ORDER,
  ROUTING_ONLY_STEPS,
  STEP_BRANCH,
  type CtaAction,
  type NewOnboardingStepKey
} from '../components/onboarding/onboarding-new-copy';

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
  'first-name',
  'last-name',
  'photo',
  'birthday'
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
    variant === 'old' ? 'confirm-profile' : 'first-name';
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
          order.includes(saved.step as OnboardingStepKey)
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
      if (branch && !d.branchQueue.includes(branch)) return false;
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
      else void completeRef.current();
      return;
    }
    void completeRef.current();
  }, [jumpTo, step]);

  const finishOpen = useCallback((route: string) => {
    draftRef.current = { ...draftRef.current, pendingDeepLink: route };
    setDraft((prev) => ({ ...prev, pendingDeepLink: route }));
    void completeRef.current();
  }, []);

  /**
   * Leave this step: move the UI first, save in the background.
   *
   * IMPORTANT: Continue should feel instant. We wait on the network for
   * confirm-profile (Old) and the four New profile fields. Every other step
   * advances immediately and finishes its save quietly.
   */
  const goNext = useCallback(async () => {
    const leaving = step;
    const snapshot = draft;

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
          // Native demo may not paint looks; plain photo is fine.
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
        case 'first-name':
          if (snapshot.firstName.trim()) {
            await saveName(snapshot.firstName.trim());
          }
          break;
        case 'last-name':
          await saveName(`${snapshot.firstName} ${snapshot.lastName}`.trim());
          break;
        case 'photo': {
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
          }
          break;
        }
        case 'birthday':
          if (snapshot.birthday) {
            await saveBirthday(snapshot.birthday, snapshot.birthdayTier ?? 'friend');
          }
          break;
        case 'privacy-3':
          if (snapshot.birthdayTier) {
            await saveBirthdayAudience(snapshot.birthday, snapshot.birthdayTier);
          }
          break;
        case 'coop-6':
          await saveMembershipInterests(snapshot.membershipInterests);
          break;
        case 'product-2':
          await saveHelpInterests(snapshot.helpInterests);
          break;
        case 'memories-4':
          if (snapshot.pageAuthoring) await savePageAuthoring(snapshot.pageAuthoring);
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
        default:
          break;
      }
    };

    const waitOn =
      leaving === 'confirm-profile' ||
      leaving === 'first-name' ||
      leaving === 'last-name' ||
      leaving === 'photo' ||
      leaving === 'birthday';

    if (waitOn) {
      try {
        await runSave();
      } catch (err) {
        console.warn(`Onboarding save failed on ${leaving}; staying put.`, err);
        Alert.alert(
          'Could not save your profile',
          err instanceof Error
            ? err.message
            : 'Check your connection and try Continue again.'
        );
        return;
      }
    }

    // THIS SECTION DOES: after Co-op 6, pick a routing screen (or skip to product).
    if (leaving === 'coop-6') {
      const ids = snapshot.membershipInterests;
      if (ids.includes('custom_groups')) {
        if (!waitOn) void runSave().catch(() => undefined);
        goto('route-custom-groups');
        return;
      }
      if (ids.includes('vote')) {
        if (!waitOn) void runSave().catch(() => undefined);
        goto('route-vote');
        return;
      }
      if (ids.includes('no_ads')) {
        if (!waitOn) void runSave().catch(() => undefined);
        goto('route-no-ads');
        return;
      }
    }

    // THIS SECTION DOES: after Product 2, walk only the tours they picked.
    if (leaving === 'product-2') {
      const queue = BRANCH_ORDER.filter((id) => snapshot.helpInterests.includes(id));
      setDraft((prev) => ({ ...prev, branchQueue: queue, branchIndex: 0 }));
      draftRef.current = { ...snapshot, branchQueue: queue, branchIndex: 0 };
      if (!waitOn) void runSave().catch(() => undefined);
      if (queue.length === 0) {
        void completeRef.current();
        return;
      }
      const first = BRANCH_START[queue[0]!];
      if (first) goto(first);
      else void completeRef.current();
      return;
    }

    if (waitOn) {
      advance();
      return;
    }

    advance();
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
          if (step === 'memories-4' && draft.pageAuthoring) {
            void savePageAuthoring(draft.pageAuthoring);
          }
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
    [advance, finishOpen, goNext, goto, nextBranch, step, draft.pageAuthoring]
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
      console.warn('Onboarding flush failed; continuing to Home.', err);
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
