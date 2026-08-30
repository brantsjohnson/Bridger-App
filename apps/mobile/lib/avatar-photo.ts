// ============================================
// WHAT THIS FILE DOES (plain English):
// One place to pick a face photo for any person. Prefer their real signed
// profile photo URL; in demo, fall back to a dropped-in fixture pic. Avatars
// that pass personId also get this via registerAvatarPhotoResolver — use this
// helper when you also want an explicit `photo` prop (or for AvatarStack).
// ============================================
import type { ImageSourcePropType } from 'react-native';
import { getProfilePhoto } from '../data/fixtures/demo-media';
import { isDemoMode } from './demo';
import { getCachedPerson } from './people-cache';

/**
 * Photo for a person id. Live signed URL wins; demo fixtures are the backup.
 * Returns undefined when we only have the emoji circle.
 */
export function avatarPhotoFor(
  personId: string,
  avatarUrl?: string | null
): ImageSourcePropType | undefined {
  const live =
    avatarUrl?.trim() || getCachedPerson(personId)?.avatarUrl?.trim() || '';
  if (live) return { uri: live };
  // Demo-only fixtures — never paint a stranger's dropped-in face in live mode.
  if (isDemoMode()) return getProfilePhoto(personId);
  return undefined;
}
