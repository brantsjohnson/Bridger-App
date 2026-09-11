// ============================================
// WHAT THIS FILE DOES (plain English):
// Lifts the subject out of a photo using the phone's own tools when we can
// (Vision on iOS, the Galaxy / ML Kit path when the native module is linked).
// If that is missing (web, Expo Go, older iOS), we do not invent a janky
// lasso. The editor then uses a clean shape clip instead (circle, heart…).
// ============================================
import { Platform } from 'react-native';

export type CutoutResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'unavailable' | 'no_subject' | 'failed' };

type NativeCutout = {
  liftSubject: (uri: string) => Promise<string>;
};

function nativeModule(): NativeCutout | null {
  try {
    // Optional: the module is only there after a native rebuild.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (name: string) => NativeCutout | null;
    };
    return requireOptionalNativeModule('SubjectCutout');
  } catch {
    return null;
  }
}

/** True when this build can ask the OS to lift a subject. */
export function canLiftSubject(): boolean {
  if (Platform.OS === 'web') return false;
  return !!nativeModule();
}

/**
 * Ask the phone to cut the subject out. Returns a PNG with a clear
 * background, or `{ ok: false }` so the editor can fall back to a shape.
 */
export async function liftSubject(uri: string): Promise<CutoutResult> {
  const native = nativeModule();
  if (!native?.liftSubject) return { ok: false, reason: 'unavailable' };
  try {
    const out = await native.liftSubject(uri);
    if (!out) return { ok: false, reason: 'no_subject' };
    return { ok: true, uri: out };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
