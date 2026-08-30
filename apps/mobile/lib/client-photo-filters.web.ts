// ============================================
// WHAT THIS FILE DOES (plain English):
// Paints Pop art, Comic, X-ray, and Sepia looks in the browser for demo
// onboarding (localhost:8090). Demo mode has no signed-in account, so it
// cannot call the server filter API. This uses an off-screen canvas with the
// same recipes as the NestJS ImageMagick pipeline so founders can preview
// every look locally.
//
// PRIVACY: everything stays on the device tab; no upload, no API call.
// ============================================
import type { ServerPhotoFilter } from './photo-filters';

const MAX_SIDE = 1000;

/** Bold posterized bands (matches server Color Levels 4). */
const COMIC_COLOR_LEVELS = 4;
/** Strong contours only; higher = lighter ink, fewer face lines. */
const COMIC_EDGE_THRESHOLD = 88;
/** No extra thicken pass — keeps outlines from going chunky. */
const COMIC_INK_DILATE_PASSES = 0;
/** Darken color under an ink pixel (1 = pure black line). */
const COMIC_INK_STRENGTH = 0.78;

/** Stretch gray values so shadows and highlights pop before the brown wash. */
function autoLevelGray(lum: Float32Array): void {
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < lum.length; i += 1) {
    if (lum[i]! < lo) lo = lum[i]!;
    if (lum[i]! > hi) hi = lum[i]!;
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < lum.length; i += 1) {
    lum[i] = Math.max(0, Math.min(255, ((lum[i]! - lo) / span) * 255));
  }
}

/**
 * Classic photographic sepia: one gray tone remapped to warm brown (R > G > B).
 * Matches the server recipe (grayscale + brown tint), not a cool RGB matrix.
 */
function applyVintageSepia(data: Uint8ClampedArray): void {
  const lum = new Float32Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    lum[j] = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
  }
  autoLevelGray(lum);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const g = lum[j]!;
    data[i] = Math.min(255, g * 0.85 + 42);
    data[i + 1] = Math.min(255, g * 0.6 + 30);
    data[i + 2] = Math.min(255, g * 0.35 + 16);
  }
}

function applyXRay(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]!;
    data[i + 1] = 255 - data[i + 1]!;
    data[i + 2] = 255 - data[i + 2]!;
  }
  const lum = new Float32Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    lum[j] = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
  }
  autoLevelGray(lum);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const g = lum[j]!;
    data[i] = Math.min(255, g * 0.55 + 10);
    data[i + 1] = Math.min(255, g * 0.95 + 15);
    data[i + 2] = Math.min(255, g * 1.05 + 35);
  }
}

/**
 * Single-tile pop art for demo web: punch saturation then posterize into flat
 * bands (matches the server pop_art recipe used for round avatars).
 */
function applyPopArt(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const avg = (r + g + b) / 3;
    data[i] = Math.max(0, Math.min(255, avg + (r - avg) * 1.8));
    data[i + 1] = Math.max(0, Math.min(255, avg + (g - avg) * 1.8));
    data[i + 2] = Math.max(0, Math.min(255, avg + (b - avg) * 1.8));
  }
  posterize(data, 5);
}

/** Posterize each channel to a small number of flat steps. */
function posterize(data: Uint8ClampedArray, levels: number): void {
  const step = 255 / (levels - 1);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const v = data[i + c]!;
      data[i + c] = Math.round(v / step) * step;
    }
  }
}

/** Box-blur a grayscale buffer so edge detection ignores skin texture noise. */
function blurGray(gray: Float32Array, w: number, h: number, passes: number): Float32Array {
  let src = gray;
  for (let pass = 0; pass < passes; pass += 1) {
    const out = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const i = y * w + x;
        let sum = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            sum += src[i + dy * w + dx]!;
          }
        }
        out[i] = sum / 9;
      }
    }
    src = out;
  }
  return src;
}

/** Simple edge map from grayscale neighbors (Comic ink lines). */
function edgeMask(gray: Float32Array, w: number, h: number, threshold: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1]! +
        gray[i - w + 1]! -
        2 * gray[i - 1]! +
        2 * gray[i + 1]! -
        gray[i + w - 1]! +
        gray[i + w + 1]!;
      const gy =
        -gray[i - w - 1]! -
        2 * gray[i - w]! -
        gray[i - w + 1]! +
        gray[i + w - 1]! +
        2 * gray[i + w]! +
        gray[i + w + 1]!;
      const mag = Math.sqrt(gx * gx + gy * gy);
      out[i] = mag > threshold ? 255 : 0;
    }
  }
  return out;
}

/** Thicken ink lines without picking up extra noise. */
function dilateEdges(edges: Uint8Array, w: number, h: number, passes: number): Uint8Array {
  let current = edges;
  for (let pass = 0; pass < passes; pass += 1) {
    const out = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const i = y * w + x;
        let peak = current[i]!;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            peak = Math.max(peak, current[i + dy * w + dx]!);
          }
        }
        out[i] = peak;
      }
    }
    current = out;
  }
  return current;
}

function applyComic(data: Uint8ClampedArray, w: number, h: number): void {
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; p < data.length; i += 1, p += 4) {
    gray[i] = 0.2126 * data[p]! + 0.7152 * data[p + 1]! + 0.0722 * data[p + 2]!;
  }
  for (let p = 0; p < data.length; p += 4) {
    data[p] = Math.min(255, data[p]! * 1.03);
    data[p + 1] = Math.min(255, data[p + 1]! * 1.5);
    data[p + 2] = Math.min(255, data[p + 2]! * 1.03);
  }
  posterize(data, COMIC_COLOR_LEVELS);
  const edgeGray = blurGray(gray, w, h, 2);
  const edges = dilateEdges(
    edgeMask(edgeGray, w, h, COMIC_EDGE_THRESHOLD),
    w,
    h,
    COMIC_INK_DILATE_PASSES
  );
  for (let i = 0, p = 0; p < data.length; i += 1, p += 4) {
    if (edges[i]! > 0) {
      data[p] = Math.round(data[p]! * COMIC_INK_STRENGTH);
      data[p + 1] = Math.round(data[p + 1]! * COMIC_INK_STRENGTH);
      data[p + 2] = Math.round(data[p + 2]! * COMIC_INK_STRENGTH);
    }
  }
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load photo'));
    img.src = uri;
  });
}

/**
 * Paint a filter in the browser and return a JPEG data URL for preview.
 * Used only in demo onboarding on web.
 */
export async function bakeClientPhotoFilter(
  uri: string,
  filter: ServerPhotoFilter
): Promise<string | null> {
  const img = await loadImage(uri);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  if (filter === 'sepia') {
    applyVintageSepia(data);
  } else if (filter === 'x_ray') {
    applyXRay(data);
  } else if (filter === 'pop_art') {
    applyPopArt(data);
  } else {
    applyComic(data, w, h);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
}
