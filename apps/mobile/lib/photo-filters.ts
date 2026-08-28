// ============================================
// WHAT THIS FILE DOES (plain English):
// Asks the server to turn a picked photo into a stylized "look" that the phone
// cannot make on its own (Comic, X-ray, and Sepia). It first uploads
// the normal photo to your private storage, then asks the API to render the look
// and hand back the finished picture's id plus a short-lived preview link.
//
// PRIVACY: this only runs for signed-in people (it uses your session token). The
// photo goes to your own private storage folder and is never sent to any AI model.
// ============================================
import { apiFetch } from './api';
import { uploadMedia } from './media-upload';

/** Looks that are rendered on the server (on-device looks like Pop art are not here). */
export type ServerPhotoFilter = 'comic' | 'x_ray' | 'sepia';

/** What the phone gets back: the finished picture's id and a link to show it. */
export type BakedPhoto = {
  mediaId: string;
  url: string;
};

/**
 * Upload the original photo, then ask the server to render the chosen look.
 * Returns the new (filtered) picture's media id and a preview link.
 */
export async function bakeServerPhotoFilter(
  uri: string,
  filter: ServerPhotoFilter
): Promise<BakedPhoto> {
  // THIS SECTION DOES: put the normal photo in storage so the server can read it.
  const originalMediaId = await uploadMedia(
    uri,
    'photo',
    `avatar/original-${Date.now()}.jpg`
  );

  // THIS SECTION DOES: ask the API to repaint it and give back the finished picture.
  return apiFetch<BakedPhoto>('/photo-filters/apply', {
    method: 'POST',
    body: JSON.stringify({ mediaId: originalMediaId, filter })
  });
}
