// ============================================
// WHAT THIS FILE DOES (plain English):
// Asks the server to turn a picked photo into a stylized "look" that the phone
// cannot make on its own (Comic, X-ray, and Sepia). It first uploads
// the normal photo to your private storage, then asks the API to render the look
// and hand back the finished picture's id plus a short-lived preview link.
//
// SPEED: the original upload is cached per photo URI, so switching Comic →
// Sepia → Comic does not re-upload the same file three times.
//
// PRIVACY: this only runs for signed-in people (it uses your session token). The
// photo goes to your own private storage folder and is never sent to any AI model.
// ============================================
import { apiFetch } from './api';
import { uploadMedia } from './media-upload';

/** Looks that are rendered on the server (all four profile-photo looks). */
export type ServerPhotoFilter = 'pop_art' | 'comic' | 'x_ray' | 'sepia';

/** What the phone gets back: the finished picture's id and a link to show it. */
export type BakedPhoto = {
  mediaId: string;
  url: string;
};

/**
 * In-flight / finished uploads of the plain photo, keyed by local URI.
 * Sharing one Promise means two filter taps at once only upload once.
 */
const originalUploadByUri = new Map<string, Promise<string>>();

/** Upload the plain photo once per URI (reused across Comic / X-ray / Sepia). */
function uploadOriginalOnce(uri: string): Promise<string> {
  const existing = originalUploadByUri.get(uri);
  if (existing) return existing;
  // Stable path per URI so a retry upserts instead of stacking duplicates.
  const path = `avatar/original-${simpleHash(uri)}.jpg`;
  const promise = uploadMedia(uri, 'photo', path).catch((err) => {
    // Drop the failed entry so a later tap can retry.
    originalUploadByUri.delete(uri);
    throw err;
  });
  originalUploadByUri.set(uri, promise);
  return promise;
}

/** Tiny stable hash so the same photo URI maps to the same storage path. */
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/**
 * Upload the original photo (once), then ask the server to render the chosen look.
 * Returns the new (filtered) picture's media id and a preview link.
 */
export async function bakeServerPhotoFilter(
  uri: string,
  filter: ServerPhotoFilter
): Promise<BakedPhoto> {
  // THIS SECTION DOES: put the normal photo in storage so the server can read it
  // (skipped when we already uploaded this URI earlier in the run).
  const originalMediaId = await uploadOriginalOnce(uri);

  // THIS SECTION DOES: ask the API to repaint it and give back the finished picture.
  return apiFetch<BakedPhoto>('/photo-filters/apply', {
    method: 'POST',
    body: JSON.stringify({ mediaId: originalMediaId, filter })
  });
}
