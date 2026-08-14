// ============================================
// WHAT THIS FILE DOES (plain English):
// One switch for "demo mode": fake data + skip the sign-in wall so you can
// walk the real screens. Localhost can force it on with EXPO_PUBLIC_DEMO_MODE.
// Preview / internal builds can unlock it by long-pressing the Bridger logo
// on Sign in (EXPO_PUBLIC_DEMO_UNLOCK). Production Store builds leave unlock off.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device flag: person chose demo from the Sign in logo long-press. */
const RUNTIME_DEMO_KEY = 'bridger.demo.runtime_enabled';

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

/** Turn demo on after the person confirms the long-press dialog. */
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
