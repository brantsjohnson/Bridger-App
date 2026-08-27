// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads and saves co-op profile presentation: Theme (accent, background,
// font, light/dark) and Layout (order of movable modules). Never stores
// facts, CSS URLs, or tier visibility. Passing null restores the original
// accessible page. Code-tier CSS/HTML is not written from the client yet.
// ============================================
import type {
  Accent,
  MovableModule,
  ProfileBackgroundSpec,
  ProfileBackgroundToken,
  ProfileFont,
  ProfilePresentation
} from '@bridger/shared';
import {
  DEFAULT_PROFILE_LAYOUT,
  MOVABLE_MODULE_ORDER,
  backgroundTokenToSpec,
  normalizeProfilePresentation,
  resolveFontId,
  sanitizeLayoutOrder
} from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';

/** Re-export wire types so screens keep a short import path. */
export type ProfileBackground = ProfileBackgroundToken;
export type { ProfileBackgroundSpec, ProfilePresentation };

let demoPresentation: ProfilePresentation | null = null;
let demoAlwaysOriginal = false;

/** Default Theme + Layout when a member opens customize for the first time. */
export function defaultPresentation(): ProfilePresentation {
  return {
    accent: 'purple',
    background: 'default',
    backgroundSpec: backgroundTokenToSpec('default'),
    palette: 'purple',
    fontId: 'clean',
    font: 'clean',
    mode: 'light',
    layoutOrder: defaultLayoutOrder()
  };
}

export function defaultLayoutOrder(): MovableModule[] {
  return [
    ...(DEFAULT_PROFILE_LAYOUT.order.length
      ? DEFAULT_PROFILE_LAYOUT.order
      : MOVABLE_MODULE_ORDER)
  ];
}

/** Make sure demo / API payloads always have layout + fontId filled in. */
function hydrate(raw: ProfilePresentation | null): ProfilePresentation | null {
  if (!raw) return null;
  const normalized = normalizeProfilePresentation(raw);
  if (normalized.ok && normalized.value) return normalized.value;
  return {
    ...raw,
    fontId: resolveFontId(raw),
    font: resolveFontId(raw),
    layoutOrder: sanitizeLayoutOrder(raw.layoutOrder ?? defaultLayoutOrder()),
    backgroundSpec: raw.backgroundSpec ?? backgroundTokenToSpec(raw.background)
  };
}

export async function getProfilePresentation(): Promise<ProfilePresentation | null> {
  if (isDemoMode()) return hydrate(demoPresentation ? { ...demoPresentation } : null);
  const settings = await apiFetch<{
    profilePresentation?: ProfilePresentation | null;
  }>('/me/settings');
  return hydrate(settings.profilePresentation ?? null);
}

export async function saveProfilePresentation(
  presentation: ProfilePresentation | null
): Promise<ProfilePresentation | null> {
  // Fill backgroundSpec from the legacy token when the screen only set the chip.
  const payload =
    presentation == null
      ? null
      : {
          ...presentation,
          backgroundSpec:
            presentation.backgroundSpec ??
            backgroundTokenToSpec(presentation.background),
          fontId: resolveFontId(presentation),
          font: resolveFontId(presentation),
          layoutOrder: sanitizeLayoutOrder(
            presentation.layoutOrder ?? defaultLayoutOrder()
          )
        };

  if (isDemoMode()) {
    demoPresentation = payload ? { ...payload } : null;
    return getProfilePresentation();
  }

  const result = await apiFetch<{
    profilePresentation: ProfilePresentation | null;
  }>('/me/settings/presentation', {
    method: 'PATCH',
    body: JSON.stringify({ presentation: payload })
  });
  return hydrate(result.profilePresentation);
}

/** Viewer standing preference: always render others' profiles as original. */
export async function getAlwaysViewOriginal(): Promise<boolean> {
  if (isDemoMode()) return demoAlwaysOriginal;
  try {
    const s = await apiFetch<{ alwaysViewOriginal?: boolean }>('/me/settings');
    return Boolean(s.alwaysViewOriginal);
  } catch {
    return false;
  }
}

export async function setAlwaysViewOriginal(value: boolean): Promise<void> {
  if (isDemoMode()) {
    demoAlwaysOriginal = value;
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ alwaysViewOriginal: value })
  });
}

/** Helper for customize when picking a background chip. */
export function withBackgroundToken(
  current: ProfilePresentation,
  background: ProfileBackgroundToken
): ProfilePresentation {
  return {
    ...current,
    background,
    backgroundSpec: backgroundTokenToSpec(background)
  };
}

/** Helper for customize when picking a font chip. */
export function withFont(
  current: ProfilePresentation,
  fontId: ProfileFont
): ProfilePresentation {
  return { ...current, fontId, font: fontId };
}

/** Helper for customize when picking an accent chip. */
export function withAccent(
  current: ProfilePresentation,
  accent: Accent
): ProfilePresentation {
  return { ...current, accent, palette: accent };
}
