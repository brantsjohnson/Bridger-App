// ============================================
// WHAT THIS FILE DOES (plain English):
// The "share my result" toolkit. It can (1) turn the result card View into a
// PNG image, (2) save that PNG to your phone's photos so you can post it to a
// story, (3) open the system share sheet with the image (Instagram, Snapchat,
// Messages, etc. show up there), and (4) share a link to your result.
//
// PRIVACY: this only ever touches the picture you just made and a link. It does
// NOT read your existing photos, contacts, or anything else. Saving to photos
// asks permission the moment you tap, and if you say no the app keeps working.
//
// Native modules (view-shot, sharing, media-library) are loaded only when you
// tap a share button, so the quiz screen itself still opens on web / Expo Go
// even if those packages aren't ready yet.
// ============================================

import { Platform, Share, type View } from 'react-native';

// THIS SECTION DOES: turn a share token into the URL a friend actually opens.
// On Expo web we use this browser's origin so you can copy localhost and
// verify the guest take in another window. On the phone we use the server URL.
export function visibleShareUrl(token: string, serverUrl?: string): string {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.origin
  ) {
    return `${window.location.origin}/q/${token}`;
  }
  if (serverUrl) return serverUrl;
  return `https://bridger.app/q/${token}`;
}

// THIS SECTION DOES: copy the invite URL so you can paste it to a friend
// (or into a logged-out browser) without hunting through the share sheet.
export async function copyShareUrl(url: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const clip = (
        globalThis as {
          navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } };
        }
      ).navigator?.clipboard;
      if (!clip?.writeText) return false;
      await clip.writeText(url);
      return true;
    } catch {
      return false;
    }
  }
  // Native: no clipboard package in this build. The URL on screen is selectable
  // so they can long-press Copy. Share link still opens the OS share sheet.
  return false;
}

// THIS SECTION DOES: snapshot the result card View into a PNG file and hand
// back a file URI (or a data URL on web).
export async function captureCard(
  ref: React.RefObject<View | null>
): Promise<string | null> {
  if (!ref.current) return null;
  try {
    const { captureRef } = await import('react-native-view-shot');
    return await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile'
    });
  } catch {
    return null;
  }
}

// THIS SECTION DOES: save the PNG to the camera roll. Returns true on success.
export async function saveImageToPhotos(uri: string): Promise<boolean> {
  // Web can't write to a photo library; trigger a normal download instead.
  if (Platform.OS === 'web') {
    try {
      const a = document.createElement('a');
      a.href = uri;
      a.download = 'my-j-name.png';
      a.click();
      return true;
    } catch {
      return false;
    }
  }

  try {
    const MediaLibrary = await import('expo-media-library');
    // Ask only for "add to library" so we never request read access to photos.
    const perm = await MediaLibrary.requestPermissionsAsync(true);
    if (!perm.granted) {
      // Open Settings when they previously denied, so Download PNG can work.
      if (perm.canAskAgain === false) {
        const { Linking } = await import('react-native');
        await Linking.openSettings().catch(() => undefined);
      }
      return false;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
}

// THIS SECTION DOES: open the share sheet with the image so it can go to a
// story or a chat. Falls back to the basic share if the sheet isn't available.
export async function shareImage(uri: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return shareLink(uri, 'My J-name result');
  }
  try {
    const Sharing = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your J-name'
      });
      return true;
    }
  } catch {
    // fall through to the basic share below
  }
  try {
    await Share.share({ url: uri });
    return true;
  } catch {
    return false;
  }
}

// THIS SECTION DOES: share just the link (so a friend can take it too).
export async function shareLink(url: string, message?: string): Promise<boolean> {
  try {
    await Share.share({ message: message ? `${message} ${url}` : url, url });
    return true;
  } catch {
    return false;
  }
}
