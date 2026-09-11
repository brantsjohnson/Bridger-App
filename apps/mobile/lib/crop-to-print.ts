// ============================================
// WHAT THIS FILE DOES (plain English):
// A collage page prints on 8.5x11 paper (a tall rectangle). The phone camera
// takes a wider/differently shaped photo, so this trims the photo down to the
// exact 8.5x11 shape (a centered crop) right after the shutter. That way the
// picture you framed is the picture that lands on the page and prints, with no
// surprise cropping later.
//
// It is written defensively: if the image tool is missing (e.g. an old build
// that has not shipped it yet) we simply return the original photo instead of
// crashing the camera.
// ============================================
import { Image } from 'react-native';
import { SCRAPBOOK_ASPECT_RATIO } from '@bridger/shared';

// THIS SECTION DOES: describe what we hand back (the trimmed photo + its size).
export type PrintCropResult = { uri: string; width?: number; height?: number };

// THIS SECTION DOES: ask the OS for a photo's pixel size when the caller does
// not already know it (camera-roll picks do not carry width/height).
function measure(uri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null)
    );
  });
}

// THIS SECTION DOES: work out the biggest centered rectangle inside the photo
// that has the print shape (width / height = 8.5 / 11), then trim to it. Works
// for live camera shots and camera-roll picks alike so every photo becomes the
// same 8.5x11 collage/story size on the way in.
export async function cropToPrintAspect(
  uri: string,
  width?: number,
  height?: number
): Promise<PrintCropResult> {
  // Fill in the pixel size if the caller did not pass it (e.g. roll picks).
  if (!width || !height || width <= 0 || height <= 0) {
    const size = await measure(uri);
    if (!size) return { uri, width, height };
    width = size.width;
    height = size.height;
  }

  try {
    // Load the image tool only when we actually need it (keeps startup light,
    // and a missing module falls through to the untrimmed photo below).
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');

    const targetAspect = SCRAPBOOK_ASPECT_RATIO; // 8.5 / 11 (portrait)
    const photoAspect = width / height;

    // THIS SECTION DOES: pick which side to trim so the leftover matches print.
    let cropW = width;
    let cropH = height;
    if (photoAspect > targetAspect) {
      // Photo is too wide: keep full height, trim the sides.
      cropW = Math.round(height * targetAspect);
      cropH = height;
    } else {
      // Photo is too tall: keep full width, trim top and bottom.
      cropW = width;
      cropH = Math.round(width / targetAspect);
    }
    const originX = Math.max(0, Math.round((width - cropW) / 2));
    const originY = Math.max(0, Math.round((height - cropH) / 2));

    // Nothing to do if it is already the right shape (avoid a needless pass).
    if (cropW >= width && cropH >= height) return { uri, width, height };

    const result = await manipulateAsync(
      uri,
      [{ crop: { originX, originY, width: cropW, height: cropH } }],
      { compress: 0.92, format: SaveFormat.JPEG }
    );
    return { uri: result.uri, width: result.width, height: result.height };
  } catch {
    // Any failure (tool missing, odd image) keeps the original so the camera
    // never breaks just because we could not trim the photo.
    return { uri, width, height };
  }
}
