// ============================================
// WHAT THIS FILE DOES (plain English):
// The stickers you can send as a reply to someone's update. Two kinds:
//   1. The built-in emoji strip everyone has.
//   2. Stickers you made yourself out of a photo you took.
// Screens never touch storage directly — they call these functions, so the
// same screen works against demo data now and the real API later.
//
// PRIVACY: a sticker you made is YOURS. It stays on your device in demo mode,
// and the analytics we send only record THAT you made one, never the picture.
// MEDIA: sticker photos are camera-capture only, the same rule as updates.
// The one upload exception in the app is your profile photo (DATA.md).
// ============================================
import { isDemoMode } from '../lib/demo';

/** A sticker you made yourself: a photo, shown cropped to a circle. */
export type CustomSticker = {
  id: string;
  /** local file uri of the captured photo */
  uri: string;
  createdAt: number;
};

/**
 * The built-in strip. Ordered by how people actually react — the warm ones
 * first, so the common reply is the shortest reach.
 */
export const EMOJI_STICKERS = [
  '❤️', '😂', '🔥', '🥹', '👏', '😮', '🙌', '💯',
  '🫶', '😭', '🤣', '✨', '👀', '🎉', '😅', '🥲',
  '💜', '🤝', '🌱', '☕️', '🐕', '🏔️', '📚', '🎧'
] as const;

// Demo-mode store: lives for the session only. The real one will be per-user
// storage behind the API.
let customStickers: CustomSticker[] = [];

export async function listCustomStickers(): Promise<CustomSticker[]> {
  if (isDemoMode()) return customStickers.map((s) => ({ ...s }));
  // TODO: GET /me/stickers
  return [];
}

/** Save a sticker the person just made. Returns the saved sticker. */
export async function addCustomSticker(uri: string): Promise<CustomSticker> {
  const sticker: CustomSticker = {
    id: `st-${Date.now()}`,
    uri,
    createdAt: Date.now()
  };
  if (isDemoMode()) {
    customStickers = [sticker, ...customStickers];
    return sticker;
  }
  // TODO: POST /me/stickers (upload the cropped image, return the stored one)
  return sticker;
}

export async function removeCustomSticker(id: string): Promise<void> {
  if (isDemoMode()) {
    customStickers = customStickers.filter((s) => s.id !== id);
    return;
  }
  // TODO: DELETE /me/stickers/:id
}
