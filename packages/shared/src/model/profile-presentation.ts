// ============================================
// WHAT THIS FILE DOES (plain English):
// The wire shape for co-op profile customize (Theme + Layout). This is the
// presentation skin only: accent, background, font, light/dark, and the order
// of movable modules. It never stores facts, tier visibility, or runnable code.
// Old saves that only had accent + background still load. Code-tier CSS/HTML
// lives in separate nullable DB columns and stays admin-gated OFF for now.
// ============================================
import type { Accent } from './person';
import {
  MOVABLE_MODULE_ORDER,
  type MovableModule,
  type ProfileFont
} from './profile-theme';

/** Legacy background tokens already shipped in customize MVP. */
export const PROFILE_BACKGROUND_TOKENS = [
  'default',
  'eggshell',
  'ink',
  'grid'
] as const;
export type ProfileBackgroundToken = (typeof PROFILE_BACKGROUND_TOKENS)[number];

/** Safe gradient ids (no remote urls). */
export const PROFILE_GRADIENT_TOKENS = [
  'soft_dawn',
  'cool_dusk',
  'mint_haze'
] as const;
export type ProfileGradientToken = (typeof PROFILE_GRADIENT_TOKENS)[number];

export const PROFILE_ACCENT_TOKENS: Accent[] = [
  'purple',
  'coral',
  'teal',
  'amber',
  'pink',
  'blue',
  'green'
];

export const PROFILE_FONT_IDS: ProfileFont[] = [
  'clean',
  'serif',
  'pixel',
  'mono',
  'round'
];

/**
 * Expanded background: solid color token/hex, allowlisted gradient, or a
 * Bridger-hosted image (assetId). Never an off-platform URL.
 */
export type ProfileBackgroundSpec = {
  kind: 'color' | 'gradient' | 'image';
  /** Token id, safe hex, or gradient id from the allowlist. */
  value: string;
  /** Bridger media id when kind is image. */
  assetId?: string;
};

/**
 * What we store in user_settings.profile_presentation.
 * `accent` + `background` stay forever so older clients keep working.
 */
export type ProfilePresentation = {
  accent: Accent;
  /** Legacy token (always written for backcompat). */
  background: ProfileBackgroundToken;
  /** Preferred expanded background when present. */
  backgroundSpec?: ProfileBackgroundSpec;
  /** Accent alias / future custom hex; defaults to accent. */
  palette?: string;
  mode?: 'light' | 'dark';
  /** Allowlisted display font (PROFILE-CUSTOMIZATION.md fontId). */
  fontId?: ProfileFont;
  /** @deprecated Prefer fontId. Older clients wrote `font`. */
  font?: ProfileFont;
  /** Movable modules only. Header + tabs stay anchored off this list. */
  layoutOrder?: MovableModule[];
};

/** Code tier is admin-gated OFF. Columns exist; no WebView ships yet. */
export const PROFILE_CODE_TIER_ENABLED = false;

/** Map a legacy background chip to the expanded background shape. */
export function backgroundTokenToSpec(
  token: ProfileBackgroundToken
): ProfileBackgroundSpec {
  switch (token) {
    case 'eggshell':
      return { kind: 'color', value: '#FAF8F2' };
    case 'ink':
      return { kind: 'color', value: '#0E0E0E' };
    case 'grid':
      return { kind: 'gradient', value: 'mint_haze' };
    case 'default':
    default:
      return { kind: 'color', value: 'default' };
  }
}

/** Resolve which font id to use (fontId wins over legacy font). */
export function resolveFontId(
  presentation: Pick<ProfilePresentation, 'fontId' | 'font'> | null | undefined
): ProfileFont {
  return presentation?.fontId ?? presentation?.font ?? 'clean';
}

/** Fill missing modules and drop unknown keys so layout stays complete. */
export function sanitizeLayoutOrder(
  order: unknown
): MovableModule[] {
  const known = new Set<string>(MOVABLE_MODULE_ORDER);
  const seen = new Set<MovableModule>();
  const out: MovableModule[] = [];

  if (Array.isArray(order)) {
    for (const item of order) {
      if (typeof item !== 'string' || !known.has(item)) continue;
      const key = item as MovableModule;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }

  for (const key of MOVABLE_MODULE_ORDER) {
    if (!seen.has(key)) out.push(key);
  }
  return out;
}

function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (PROFILE_ACCENT_TOKENS as string[]).includes(value);
}

function isBackgroundToken(value: unknown): value is ProfileBackgroundToken {
  return (
    typeof value === 'string' &&
    (PROFILE_BACKGROUND_TOKENS as readonly string[]).includes(value)
  );
}

function isFont(value: unknown): value is ProfileFont {
  return typeof value === 'string' && (PROFILE_FONT_IDS as string[]).includes(value);
}

function isSafeHex(value: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value);
}

/**
 * Validate and normalize a presentation payload from the client.
 * Returns null when the caller asked to clear (view original).
 * Throws-friendly: returns { ok:false, error } for bad shapes.
 */
export function normalizeProfilePresentation(
  raw: unknown
):
  | { ok: true; value: ProfilePresentation | null }
  | { ok: false; error: string } {
  if (raw === null || raw === undefined) {
    return { ok: true, value: null };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Presentation must be an object or null' };
  }

  const body = raw as Record<string, unknown>;
  const accent = body.accent ?? 'purple';
  const background = body.background ?? 'default';
  if (!isAccent(accent) || !isBackgroundToken(background)) {
    return { ok: false, error: 'Choose an approved profile style' };
  }

  let backgroundSpec: ProfileBackgroundSpec | undefined;
  if (body.backgroundSpec != null) {
    if (typeof body.backgroundSpec !== 'object' || Array.isArray(body.backgroundSpec)) {
      return { ok: false, error: 'Background details look wrong' };
    }
    const spec = body.backgroundSpec as Record<string, unknown>;
    const kind = spec.kind;
    const value = spec.value;
    if (kind !== 'color' && kind !== 'gradient' && kind !== 'image') {
      return { ok: false, error: 'Background kind is not allowed' };
    }
    if (typeof value !== 'string' || !value.trim()) {
      return { ok: false, error: 'Background value is required' };
    }
    if (kind === 'color') {
      const okColor =
        isBackgroundToken(value) ||
        value === 'default' ||
        isSafeHex(value);
      if (!okColor) {
        return { ok: false, error: 'Color background must be a token or hex' };
      }
    }
    if (kind === 'gradient') {
      if (!(PROFILE_GRADIENT_TOKENS as readonly string[]).includes(value)) {
        return { ok: false, error: 'Gradient is not on the allowlist' };
      }
    }
    if (kind === 'image') {
      // SECURITY: Bridger-hosted media id only (uuid). No remote URLs.
      const assetId = spec.assetId;
      if (typeof assetId !== 'string' || !/^[0-9a-f-]{36}$/i.test(assetId)) {
        return { ok: false, error: 'Image backgrounds need a Bridger asset id' };
      }
      backgroundSpec = { kind, value: value.trim(), assetId };
    } else {
      backgroundSpec = { kind, value: value.trim() };
    }
  } else {
    backgroundSpec = backgroundTokenToSpec(background);
  }

  const mode = body.mode;
  if (mode != null && mode !== 'light' && mode !== 'dark') {
    return { ok: false, error: 'Mode must be light or dark' };
  }

  const fontIdRaw = body.fontId ?? body.font;
  if (fontIdRaw != null && !isFont(fontIdRaw)) {
    return { ok: false, error: 'Font is not on the allowlist' };
  }

  const palette =
    typeof body.palette === 'string' && body.palette.trim()
      ? body.palette.trim().slice(0, 32)
      : accent;

  const layoutOrder = sanitizeLayoutOrder(body.layoutOrder);
  const fontId = isFont(fontIdRaw) ? fontIdRaw : 'clean';

  const value: ProfilePresentation = {
    accent,
    background,
    backgroundSpec,
    palette,
    mode: mode === 'dark' ? 'dark' : 'light',
    fontId,
    // Keep legacy key so older readers still see a font.
    font: fontId,
    layoutOrder
  };

  return { ok: true, value };
}
