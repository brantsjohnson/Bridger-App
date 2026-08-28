// ============================================
// WHAT THIS FILE DOES (plain English):
// Saves which individual notification kinds you want push for, and which
// circles (Close / Friends / Acquaintances) can nudge you. Acquaintances
// starts off. Onboarding's coarse chips expand into the matching kinds.
// Prefs gate push only — the in-app Alerts list still shows what happened.
// Spec: NOTIFICATIONS.md.
// ============================================
import type {
  NotificationCircleId,
  NotificationKind,
  NotificationPrefsState
} from '@bridger/shared';
import {
  defaultNotificationPrefs,
  isPushAllowedForKind as sharedIsPushAllowed,
  prefsFromOnboardingGroups
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';

/** Demo session copy of prefs — survives navigations until the app reloads. */
let sessionPrefs: NotificationPrefsState | null = null;

function ensurePrefs(): NotificationPrefsState {
  if (!sessionPrefs) sessionPrefs = defaultNotificationPrefs();
  return sessionPrefs;
}

/** Full prefs for Settings (kinds + circles). */
export async function getNotificationPrefs(): Promise<NotificationPrefsState> {
  if (isDemoMode()) {
    const p = ensurePrefs();
    return { kinds: { ...p.kinds }, circles: { ...p.circles } };
  }
  try {
    const data = await apiFetch<Partial<NotificationPrefsState>>('/me/notification-prefs');
    const base = defaultNotificationPrefs();
    return {
      kinds: { ...base.kinds, ...(data.kinds ?? {}) },
      circles: { ...base.circles, ...(data.circles ?? {}) }
    };
  } catch {
    return defaultNotificationPrefs();
  }
}

/** Flip one notification kind on or off (Settings toggle). */
export async function setNotificationKindPref(
  kind: NotificationKind,
  on: boolean
): Promise<NotificationPrefsState> {
  if (isDemoMode()) {
    const next = ensurePrefs();
    next.kinds[kind] = on;
    return { kinds: { ...next.kinds }, circles: { ...next.circles } };
  }
  await apiFetch('/me/notification-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ kinds: { [kind]: on } })
  });
  return getNotificationPrefs();
}

/** Flip whether Close / Friends / Acquaintances can nudge you. */
export async function setNotificationCirclePref(
  circle: NotificationCircleId,
  on: boolean
): Promise<NotificationPrefsState> {
  if (isDemoMode()) {
    const next = ensurePrefs();
    next.circles[circle] = on;
    return { kinds: { ...next.kinds }, circles: { ...next.circles } };
  }
  await apiFetch('/me/notification-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ circles: { [circle]: on } })
  });
  return getNotificationPrefs();
}

/**
 * Seed kinds from the onboarding multi-select (coarse group ids).
 * Returns the expanded prefs so live mode can PATCH them to the server.
 */
export function applyOnboardingNotificationPrefs(
  pickedIds: string[]
): NotificationPrefsState {
  const next = prefsFromOnboardingGroups(pickedIds);
  sessionPrefs = next;
  return { kinds: { ...next.kinds }, circles: { ...next.circles } };
}

/**
 * True when push for this kind is allowed.
 * Kind must be on; if the kind is circle-gated, the actor's circle must be on too.
 */
export function isPushAllowedForKind(
  kind: NotificationKind,
  prefs: NotificationPrefsState,
  actorCircle?: NotificationCircleId
): boolean {
  return sharedIsPushAllowed(kind, prefs, actorCircle);
}
