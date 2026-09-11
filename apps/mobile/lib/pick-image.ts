// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared way to pick a photo: take one with the camera or choose one from
// the library. Permission is asked at the tap (never at launch). Profile
// photos crop square. Inside Joke photos (co-op) keep a wider crop. The
// caller uploads. We only ever touch the one picture they picked.
// ============================================
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Where the picked photo came from — used for analytics + the "retake" label. */
export type PhotoSource = 'camera' | 'library';

/** What a successful pick returns: the file path (native) or blob url (web). */
export type PickedPhoto = { uri: string };

// Square crop keeps every avatar consistent behind the house filter.
const PROFILE_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.72,
  mediaTypes: ['images']
};

// Wider crop so a joke photo can sit across the sticky note.
const ATTACHED_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
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
  return pickPhoto(source, PROFILE_OPTIONS);
}

/** One photo for an Inside Joke (co-op). Same permission rules as profile. */
export async function pickAttachedPhoto(
  source: PhotoSource
): Promise<PickedPhoto | null> {
  return pickPhoto(source, ATTACHED_OPTIONS);
}

async function pickPhoto(
  source: PhotoSource,
  options: ImagePicker.ImagePickerOptions
): Promise<PickedPhoto | null> {
  try {
    // CAMERA (native only): ask for the camera the moment they tap "Take one".
    if (source === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return null;
      const result = await ImagePicker.launchCameraAsync(options);
      if (result.canceled || !result.assets?.[0]) return null;
      return { uri: result.assets[0].uri };
    }

    // LIBRARY (and web camera fallback): open the photo chooser.
    // requestMediaLibraryPermissionsAsync is a no-op that resolves granted on
    // web, so this same path works everywhere.
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') return null;
    const webOptions =
      Platform.OS === 'web'
        ? { ...options, allowsEditing: false }
        : options;
    const result = await ImagePicker.launchImageLibraryAsync(webOptions);
    if (result.canceled || !result.assets?.[0]) return null;
    return { uri: result.assets[0].uri };
  } catch {
    // Picker unavailable (rare web/permission edge): never crash the run.
    return null;
  }
}
