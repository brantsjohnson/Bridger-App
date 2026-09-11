// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens the phone's photo library so someone can add existing photos or short
// videos to a Collage page. It asks for permission the moment they tap
// (never at launch), lets them pick up to the number of photos they have left
// today, and hands back plain file paths tagged "camera_roll" so the page
// remembers where each picture came from.
//
// PRIVACY: this only ever touches the photos the person picks. We never read
// the whole library. The profile photo used to be the app's only upload
// exception; Collage pages are the second (approved 2026-09-08). Circle
// replies and stickers stay capture-only.
// ============================================
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trackProduct, type PendingMedia } from '@bridger/shared';

/** Same cap as live capture (STORIES / SCRAPBOOKS docs). */
const MAX_VIDEO_SECONDS = 20;

/**
 * Pick up to `limit` photos/videos. Returns [] when they cancelled or denied
 * permission (the caller degrades gracefully, never dead-ends). `allowVideo`
 * is false for free members (video posting is a co-op perk).
 */
export async function pickScrapbookMedia(opts: {
  limit: number;
  allowVideo: boolean;
}): Promise<PendingMedia[]> {
  if (opts.limit <= 0) return [];
  try {
    // ASK IN CONTEXT: the OS dialog appears now, on the tap, with our purpose string.
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    trackProduct('permission_result', {
      permission: 'photos',
      outcome: perm.granted ? 'granted' : perm.canAskAgain === false ? 'denied' : 'dismissed',
      context: 'scrapbook_roll'
    });
    if (!perm.granted && Platform.OS !== 'web') return [];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: opts.allowVideo ? ['images', 'videos'] : ['images'],
      allowsMultipleSelection: true,
      selectionLimit: opts.limit,
      orderedSelection: true,
      quality: 0.85,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      // No crop dialog: the page keeps the original and crops non-destructively later.
      allowsEditing: false
    });
    if (result.canceled || !result.assets?.length) return [];

    // THIS SECTION DOES: turn picker assets into page-ready media, dropping
    // over-long videos so the 20 second rule holds for imported clips too.
    const out: PendingMedia[] = [];
    for (const a of result.assets.slice(0, opts.limit)) {
      const isVideo = a.type === 'video';
      if (isVideo && (a.duration ?? 0) > MAX_VIDEO_SECONDS * 1000 + 500) continue;
      out.push({
        kind: isVideo ? 'video' : 'photo',
        uri: a.uri,
        source: 'camera_roll',
        durationMs: isVideo ? (a.duration ?? undefined) : undefined
      });
    }
    if (out.length) {
      // Confirmed outcome (files chosen), not the picker opening.
      trackProduct('media_imported', {
        count: out.length,
        kinds: out.every((m) => m.kind === 'photo')
          ? 'photo'
          : out.every((m) => m.kind === 'video')
            ? 'video'
            : 'mixed'
      });
    }
    return out;
  } catch {
    // Picker unavailable (rare web/permission edge): never crash the composer.
    return [];
  }
}
