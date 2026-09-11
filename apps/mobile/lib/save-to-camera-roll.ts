// ============================================
// WHAT THIS FILE DOES (plain English):
// Saves a photo (or a finished collage snapshot) into the phone's camera
// roll. Permission is asked at the tap, never at launch. If they say no, we
// fail softly and the caller shows a toast. We never read the rest of the
// library.
// ============================================
import type { RefObject } from 'react';
import { Platform } from 'react-native';
import { trackProduct } from '@bridger/shared';

/**
 * Write `uri` (a local file or a snapshot) into Photos.
 * Returns true when the OS confirmed the save.
 */
export async function saveToCameraRoll(uri: string): Promise<boolean> {
  if (!uri) return false;
  if (Platform.OS === 'web') {
    // Web has no camera roll. The caller can offer Share instead.
    return false;
  }
  try {
    // Native-only module. Loaded here so web never imports it at boot.
    const MediaLibrary = await import('expo-media-library');
    const perm = await MediaLibrary.requestPermissionsAsync(true);
    trackProduct('permission_result', {
      permission: 'photos',
      outcome: perm.granted ? 'granted' : perm.canAskAgain === false ? 'denied' : 'dismissed',
      context: 'collage_save_roll'
    });
    if (!perm.granted) return false;
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * Snapshot a page view at print size (8.5 x 11 at 300 dpi = 2550 x 3300)
 * and save that JPEG to the roll. Falls back to a smaller snapshot if the
 * device cannot render that large.
 */
export async function savePageViewToCameraRoll(
  viewRef: RefObject<unknown>
): Promise<boolean> {
  try {
    const { captureRef } = await import('react-native-view-shot');
    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.92,
      width: 2550,
      height: 3300,
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile'
    });
    return saveToCameraRoll(uri);
  } catch {
    return false;
  }
}
