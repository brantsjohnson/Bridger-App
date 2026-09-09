// ============================================
// WHAT THIS FILE DOES (plain English):
// One switch for "demo mode": fake data + skip the sign-in wall so you can
// walk the real screens. Localhost can force it on with EXPO_PUBLIC_DEMO_MODE.
// Preview / internal builds can unlock it by long-pressing the Bridger logo
// on Sign in and entering the demo password (EXPO_PUBLIC_DEMO_UNLOCK).
// Production Store builds leave unlock off.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device flag: person chose demo from the Sign in logo long-press. */
const RUNTIME_DEMO_KEY = 'bridger.demo.runtime_enabled';

/** Password required after a long-press on the Sign in logo (not real security). */
export const DEMO_UNLOCK_PASSWORD = 'demomode';

/**
 * Second demo password: types you straight into a FRESH onboarding run (no
 * account, no sign-in) with a made-up name + emoji avatar already filled in, so
 * you can preview the onboarding flow "as if I set it up manually."
 */
export const DEMO_ONBOARD_PASSWORD = 'onboard';

/**
 * Third demo password: types you into the OLD 19-step onboarding so you can
 * still preview / screenshot the previous flow.
 */
export const DEMO_ONBOARD_OLD_PASSWORD = 'onboardold';

/** Which onboarding script a demo run should walk. */
export type OnboardingFlowVariant = 'new' | 'old';

const ONBOARDING_VARIANT_KEY = 'bridger.onboarding.flowVariant';

let flowVariant: OnboardingFlowVariant = 'old';

/** Remember New vs Old for this demo session (and on the device). */
export async function setOnboardingFlowVariant(
  variant: OnboardingFlowVariant
): Promise<void> {
  flowVariant = variant;
  try {
    await AsyncStorage.setItem(ONBOARDING_VARIANT_KEY, variant);
  } catch {
    // Best-effort: in-memory still works for this session.
  }
}

/**
 * Real TestFlight / store accounts always walk Old onboarding.
 * New (story) onboarding only runs in demo after password "onboard".
 */
export function getOnboardingFlowVariant(): OnboardingFlowVariant {
  if (!isDemoMode()) return 'old';
  return flowVariant;
}

/** Load the last demo onboarding variant from the device. */
export async function hydrateOnboardingFlowVariant(): Promise<OnboardingFlowVariant> {
  if (!isDemoMode()) {
    flowVariant = 'old';
    return flowVariant;
  }
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_VARIANT_KEY);
    if (raw === 'old' || raw === 'new') flowVariant = raw;
  } catch {
    // Keep the in-memory default.
  }
  return flowVariant;
}

/** Returns true when the typed password matches the demo unlock secret. */
export function verifyDemoUnlockPassword(input: string): boolean {
  return input.trim() === DEMO_UNLOCK_PASSWORD;
}

/** Returns true when the typed password matches the New onboarding-demo secret. */
export function verifyOnboardDemoPassword(input: string): boolean {
  return input.trim().toLowerCase() === DEMO_ONBOARD_PASSWORD;
}

/** Returns true when the typed password matches the Old onboarding-demo secret. */
export function verifyOnboardOldDemoPassword(input: string): boolean {
  return input.trim().toLowerCase() === DEMO_ONBOARD_OLD_PASSWORD;
}

// --- DEMO ONBOARDING SEED ---------------------------------------------------
// A tiny made-up identity (first + last name and an emoji "photo") that
// pre-fills the first onboarding screen so the demo feels like a real, already
// set-up person. Kept in memory only (the onboarding screen mounts right after
// we set it), and cleared once the run reads it.

/** The shape of the pre-filled demo person. */
export type DemoOnboardSeed = {
  firstName: string;
  lastName: string;
  emoji: string;
};

/** A few friendly stand-in identities to pick from at random. */
const DEMO_IDENTITIES: DemoOnboardSeed[] = [
  { firstName: 'Jordan', lastName: 'Avery', emoji: '🦊' },
  { firstName: 'Sam', lastName: 'Rivera', emoji: '🐼' },
  { firstName: 'Riley', lastName: 'Quinn', emoji: '🦉' },
  { firstName: 'Casey', lastName: 'Morgan', emoji: '🐙' },
  { firstName: 'Devon', lastName: 'Blake', emoji: '🦁' },
  { firstName: 'Harper', lastName: 'Reid', emoji: '🐸' }
];

let onboardSeed: DemoOnboardSeed | null = null;

/** Make a fresh random demo identity (so each run feels a little different). */
export function makeDemoOnboardSeed(): DemoOnboardSeed {
  const pick = DEMO_IDENTITIES[Math.floor(Math.random() * DEMO_IDENTITIES.length)];
  return { ...pick };
}

/** Stash the identity that the next onboarding run should pre-fill with. */
export function setDemoOnboardSeed(seed: DemoOnboardSeed | null): void {
  onboardSeed = seed;
}

/** Read the pending demo identity (or null if the run started normally). */
export function getDemoOnboardSeed(): DemoOnboardSeed | null {
  return onboardSeed;
}

// THIS SECTION DOES: remember whether demo was turned on this session / device.
let runtimeDemo = false;
let hydrated = false;

/**
 * True when this build is allowed to enter demo via long-press (or __DEV__).
 * Production App Store builds set EXPO_PUBLIC_DEMO_UNLOCK=0 in eas.json.
 */
export function isDemoUnlockAllowed(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO_MODE === '1') return true;
  if (process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === '1') return true;
  if (process.env.EXPO_PUBLIC_DEMO_UNLOCK === '1') return true;
  // Local Metro / Expo Go: allow the gesture so founders can try it without env.
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  return false;
}

/**
 * True when fake fixtures + skip-auth should run.
 * Either a compile-time env force, or a runtime flag after long-press unlock.
 */
export function isDemoMode(): boolean {
  if (
    process.env.EXPO_PUBLIC_DEMO_MODE === '1' ||
    process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === '1'
  ) {
    return true;
  }
  return runtimeDemo;
}

/** True once we finished reading the persisted demo flag at boot. */
export function isDemoHydrated(): boolean {
  return hydrated;
}

/**
 * SECURITY: load the device demo flag before the auth gate decides where to go.
 * Call once at app start; safe to call again (no-ops after first hydrate).
 */
export async function hydrateDemoMode(): Promise<boolean> {
  if (hydrated) return runtimeDemo;
  try {
    // Only honor a saved flag when this build is allowed to unlock demo.
    if (isDemoUnlockAllowed()) {
      const raw = await AsyncStorage.getItem(RUNTIME_DEMO_KEY);
      runtimeDemo = raw === '1';
    } else {
      runtimeDemo = false;
    }
  } catch {
    runtimeDemo = false;
  }
  hydrated = true;
  return runtimeDemo;
}

/** Turn demo on after the person enters the correct unlock password. */
export async function enableDemoMode(): Promise<void> {
  if (!isDemoUnlockAllowed()) {
    throw new Error('Demo unlock is not allowed in this build');
  }
  runtimeDemo = true;
  hydrated = true;
  await AsyncStorage.setItem(RUNTIME_DEMO_KEY, '1');
}

/** Leave demo and go back to real sign-in on next navigation. */
export async function disableDemoMode(): Promise<void> {
  runtimeDemo = false;
  hydrated = true;
  await AsyncStorage.removeItem(RUNTIME_DEMO_KEY);
}

// --- DEV PREVIEW (localhost / internal builds only) -------------------------
// Lets you jump from Home straight into the CRT intro or a fresh onboarding
// run without fighting the auth gate. The router reads getDevPreview() and
// stops bouncing you back to Home while you are in that preview.

export type DevPreviewTarget = 'crt' | 'onboarding';

let devPreview: DevPreviewTarget | null = null;

/** Tell the router we are intentionally previewing CRT or onboarding. */
export function armDevPreview(target: DevPreviewTarget): void {
  devPreview = target;
}

/** Clear the preview flag (call when the preview run finishes). */
export function clearDevPreview(): void {
  devPreview = null;
}

/** What preview is active, if any. */
export function getDevPreview(): DevPreviewTarget | null {
  return devPreview;
}

/** Prep flags so the CRT intro can play again, then navigate to /welcome. */
export async function prepCrtIntroPreview(): Promise<void> {
  const { WELCOME_SEEN_KEY } = await import('../content/welcome');
  armDevPreview('crt');
  await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
}

/** Prep demo + fresh onboarding with a random prefilled name + emoji avatar. */
export async function prepOnboardingPreview(): Promise<void> {
  const { resetOnboarding } = await import('../data/onboarding');
  armDevPreview('onboarding');
  await enableDemoMode();
  await resetOnboarding();
  await setOnboardingFlowVariant('new');
  setDemoOnboardSeed(makeDemoOnboardSeed());
}

/** Prep demo + the OLD 19-step onboarding for reference. */
export async function prepOldOnboardingPreview(): Promise<void> {
  const { resetOnboarding } = await import('../data/onboarding');
  armDevPreview('onboarding');
  await enableDemoMode();
  await resetOnboarding();
  await setOnboardingFlowVariant('old');
  setDemoOnboardSeed(makeDemoOnboardSeed());
}
