// ============================================
// WHAT THIS FILE DOES (plain English):
// Signed photo links change their token every time we ask the server, even
// when the picture is the same. If we swap the link, the face "reloads" and
// looks like it is loading again. This keeps the link we already showed
// whenever the file path is still the same.
// ============================================

/** The stable part of a photo link (everything before ?token=...). */
export function mediaUrlKey(url: string): string {
  const q = url.indexOf('?');
  return q >= 0 ? url.slice(0, q) : url;
}

/**
 * Keep the already-drawn photo URL when the new one is the same file
 * with a fresh token. Use the new URL when the picture actually changed
 * or we did not have one yet.
 */
export function keepLoadedMediaUrl(
  previous: string | null | undefined,
  next: string | null | undefined
): string | null {
  if (!next) return next ?? null;
  if (!previous) return next;
  if (mediaUrlKey(previous) === mediaUrlKey(next)) return previous;
  return next;
}
