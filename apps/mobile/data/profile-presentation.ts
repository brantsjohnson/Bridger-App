// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads and saves co-op profile presentation: accent, background, font, mode,
// and optional layout order of movable modules. Never stores facts, CSS URLs,
// or tier visibility. Passing null restores the original accessible page.
// ============================================
import type { Accent, MovableModule, ProfileFont } from '@bridger/shared';
import { DEFAULT_PROFILE_LAYOUT, MOVABLE_MODULE_ORDER } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';

export type ProfileBackground = 'default' | 'eggshell' | 'ink' | 'grid';

export type ProfilePresentation = {
  accent: Accent;
  background: ProfileBackground;
  font?: ProfileFont;
  mode?: 'light' | 'dark';
  /** Order of movable modules (header + tabs stay anchored). */
  layoutOrder?: MovableModule[];
};

let demoPresentation: ProfilePresentation | null = null;
let demoAlwaysOriginal = false;

export async function getProfilePresentation(): Promise<ProfilePresentation | null> {
  if (isDemoMode()) return demoPresentation ? { ...demoPresentation } : null;
  const settings = await apiFetch<{
    profilePresentation?: ProfilePresentation | null;
  }>('/me/settings');
  return settings.profilePresentation ?? null;
}

export async function saveProfilePresentation(
  presentation: ProfilePresentation | null
): Promise<ProfilePresentation | null> {
  if (isDemoMode()) {
    demoPresentation = presentation ? { ...presentation } : null;
    return getProfilePresentation();
  }

  const result = await apiFetch<{
    profilePresentation: ProfilePresentation | null;
  }>('/me/settings/presentation', {
    method: 'PATCH',
    body: JSON.stringify({ presentation })
  });
  return result.profilePresentation;
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

export function defaultLayoutOrder(): MovableModule[] {
  return [...(DEFAULT_PROFILE_LAYOUT.order.length ? DEFAULT_PROFILE_LAYOUT.order : MOVABLE_MODULE_ORDER)];
}
