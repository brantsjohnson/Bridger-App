// ============================================
// WHAT THIS FILE DOES (plain English):
// Figures out which zoom chips (.5x, 1x, 2x, 4x) this phone can actually
// offer. On iOS we read the camera's lenses (ultra-wide, wide, telephoto)
// and map them to those labels. Android uses those same chips when the
// camera reports real lenses. When lenses are missing we use digital 1x / 2x.
// We never invent a .5x or 4x chip the hardware cannot do.
// ============================================

export type ZoomFactorLabel = '0.5' | '1' | '2' | '4';

export type ZoomPreset = {
  /** What the chip shows (.5, 1, 2, 4). */
  label: ZoomFactorLabel;
  /** expo-camera zoom prop, 0 = none, 1 = max. Used when we stay on one lens. */
  zoom: number;
  /** iOS selectedLens string when this chip switches to a physical lens. */
  lens?: string;
};

/** Match Apple's localized lens names without caring about language quirks. */
function classifyLens(name: string): ZoomFactorLabel | null {
  const n = name.toLowerCase();
  // Apple sometimes hands us the AVCaptureDeviceType id, not a pretty label.
  if (
    /ultra[\s_-]?wide|ultrawide|builtinultrawide|超広角|ultra\s*grand/.test(n)
  ) {
    return '0.5';
  }
  if (/telephoto|builtinttelephoto|builtintelephoto|t[eé]l[eé]|tele\b|望遠/.test(n)) {
    // Some phones expose a longer tele as "5x" / "4x" in the name.
    if (/\b([45])\s*x\b/.test(n) || /5x|4x|五倍|四倍/.test(n)) return '4';
    return '2';
  }
  if (
    /wide|grand\s*angle|広角|wide[\s_-]?angle|builtinwideangle|builtinwide/.test(n)
  ) {
    return '1';
  }
  return null;
}

/**
 * Build the chip list from iOS lens names. Only includes factors the device
 * reported. Always prefers a real lens over digital zoom when both exist.
 */
export function presetsFromIosLenses(lenses: string[]): ZoomPreset[] {
  const byLabel = new Map<ZoomFactorLabel, ZoomPreset>();

  for (const lens of lenses) {
    const label = classifyLens(lens);
    if (!label) continue;
    // First match wins per factor (device order is fine).
    if (!byLabel.has(label)) {
      byLabel.set(label, { label, zoom: 0, lens });
    }
  }

  // If we only got a wide lens, still offer a digital 2x on that lens.
  if (byLabel.has('1') && !byLabel.has('2') && !byLabel.has('4')) {
    byLabel.set('2', { label: '2', zoom: 0.35, lens: byLabel.get('1')!.lens });
  }

  // Front camera / single lens: at least 1x.
  if (byLabel.size === 0 && lenses.length > 0) {
    byLabel.set('1', { label: '1', zoom: 0, lens: lenses[0] });
    byLabel.set('2', { label: '2', zoom: 0.35, lens: lenses[0] });
  }

  return orderPresets(byLabel);
}

/**
 * Android / web / unknown: digital zoom only. No .5x or 4x without a lens API.
 */
export function presetsDigitalFallback(): ZoomPreset[] {
  return [
    { label: '1', zoom: 0 },
    { label: '2', zoom: 0.35 }
  ];
}

function orderPresets(byLabel: Map<ZoomFactorLabel, ZoomPreset>): ZoomPreset[] {
  const order: ZoomFactorLabel[] = ['0.5', '1', '2', '4'];
  return order.flatMap((label) => {
    const p = byLabel.get(label);
    return p ? [p] : [];
  });
}

/** Chip text: .5 · 1 · 2 · 4 (Apple-style, no trailing "x" on the digit). */
export function formatZoomChip(label: ZoomFactorLabel): string {
  return label === '0.5' ? '.5' : label;
}
