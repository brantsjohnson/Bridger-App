// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared way to get a profile picture: either take one with the camera or
// choose one from your photo library. It asks for the right permission at the
// moment you tap (never at launch), crops it to a square, and hands back the
// local file path so the caller can upload it.
//
// PRIVACY: this only ever touches the single photo you pick. We never read your
// whole library, and nothing is uploaded from here — the caller decides that.
// This is the ONE upload exception in the app (stories stay capture-only).
// ============================================
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Where the picked photo came from — used for analytics + the "retake" label. */
export type PhotoSource = 'camera' | 'library';

/** What a successful pick returns: the file path (native) or blob url (web). */
export type PickedPhoto = { uri: string };

// Square crop keeps every avatar consistent behind the house filter.
const OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
  mediaTypes: ['images']
};

/**
 * Ask for permission (in context) and open either the camera or the library.
 * Returns the picked photo's uri, or null if the person cancelled or denied
 * permission (the caller degrades gracefully, never dead-ends).
 *
 * WEB NOTE: browsers can't reliably open a live camera through the picker, so on
 * web both paths use the file chooser (a phone browser still lets you choose
 * "Take Photo" from there). Permission prompts are native-only; on web the OS
 * dialog is the browser's own file/permission UI.
 */
export async function pickProfilePhoto(
  source: PhotoSource
): Promise<PickedPhoto | null> {
  try {
    // CAMERA (native only): ask for the camera the moment they tap "Take one".
    if (source === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return null;
      const result = await ImagePicker.launchCameraAsync(OPTIONS);
      if (result.canceled || !result.assets?.[0]) return null;
      return { uri: result.assets[0].uri };
    }

    // LIBRARY (and web camera fallback): open the photo chooser.
    // requestMediaLibraryPermissionsAsync is a no-op that resolves granted on
    // web, so this same path works everywhere.
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync(OPTIONS);
    if (result.canceled || !result.assets?.[0]) return null;
    return { uri: result.assets[0].uri };
  } catch {
    // Picker unavailable (rare web/permission edge): never crash the run.
    return null;
  }
}
