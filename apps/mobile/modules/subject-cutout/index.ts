// ============================================
// WHAT THIS FILE DOES (plain English):
// Optional native hook: ask the phone to lift a person or object out of a
// photo. JavaScript talks to this only when a native rebuild included the
// module. The editor falls back to shapes if it is missing.
// ============================================
import { requireOptionalNativeModule } from 'expo-modules-core';

type Native = { liftSubject: (uri: string) => Promise<string> };

export function getSubjectCutoutNative(): Native | null {
  return requireOptionalNativeModule<Native>('SubjectCutout');
}
