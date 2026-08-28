// ============================================
// WHAT THIS FILE DOES (plain English):
// On iOS/Android, demo mode cannot paint Comic / X-ray / Sepia in the browser
// (there is no browser canvas here). This stub says "not available" so the
// onboarding screen falls back to the plain photo outside of web demo.
// ============================================
import type { ServerPhotoFilter } from './photo-filters';

/** Demo-only client bake is web-only; native demo shows the plain photo. */
export async function bakeClientPhotoFilter(
  _uri: string,
  _filter: ServerPhotoFilter
): Promise<string | null> {
  return null;
}
