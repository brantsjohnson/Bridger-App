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
  NOTIFICATION_CIRCLE_OPTIONS,
  NOTIFICATION_KIND_PREFS
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';

/** Demo session copy of prefs — survives navigations until the app reloads. */
let sessionPrefs: NotificationPrefsState | null = null;

/** Defaults before onboarding writes anything. */
function defaultPrefs(): NotificationPrefsState {
  const kinds = {} as Record<NotificationKind, boolean>;
  for (const p of NOTIFICATION_KIND_PREFS) {
    kinds[p.kind] = p.defaultOn;
  }
  const circles = {} as Record<NotificationCircleId, boolean>;
  for (const c of NOTIFICATION_CIRCLE_OPTIONS) {
    circles[c.id] = c.defaultOn;
  }
  return { kinds, circles };
}

function ensurePrefs(): NotificationPrefsState {
  if (!sessionPrefs) sessionPrefs = defaultPrefs();
  return sessionPrefs;
}

/** Full prefs for Settings (kinds + circles). */
export async function getNotificationPrefs(): Promise<NotificationPrefsState> {
  if (isDemoMode()) {
    const p = ensurePrefs();
    return { kinds: { ...p.kinds }, circles: { ...p.circles } };
  }
  // TODO: GET /me/notification-prefs → { kinds, circles }
  try {
    const data = await apiFetch<Partial<NotificationPrefsState>>('/me/notification-prefs');
    const base = defaultPrefs();
    return {
      kinds: { ...base.kinds, ...(data.kinds ?? {}) },
      circles: { ...base.circles, ...(data.circles ?? {}) }
    };
  } catch {
    return defaultPrefs();
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
  // TODO: PATCH /me/notification-prefs { kinds: { [kind]: on } }
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
  // TODO: PATCH /me/notification-prefs { circles: { [circle]: on } }
  await apiFetch('/me/notification-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ circles: { [circle]: on } })
  });
  return getNotificationPrefs();
}

/**
 * Seed kinds from the onboarding multi-select (coarse group ids).
 * Onboarding chips expand to every kind tagged with that group.
 * Circles keep defaults (Acquaintances off).
 */
export function applyOnboardingNotificationPrefs(pickedIds: string[]): void {
  const next = defaultPrefs();
  for (const p of NOTIFICATION_KIND_PREFS) {
    if (p.onboardingGroup) {
      next.kinds[p.kind] = pickedIds.includes(p.onboardingGroup);
    }
  }
  sessionPrefs = next;
}

/**
 * True when push for this kind is allowed.
 * Kind must be on; if the kind is circle-gated, the actor's circle must be on too.
 * Pass `actorCircle` when you know the sender's tier; omit for system notes.
 */
export function isPushAllowedForKind(
  kind: NotificationKind,
  prefs: NotificationPrefsState,
  actorCircle?: NotificationCircleId
): boolean {
  if (prefs.kinds[kind] === false) return false;
  const meta = NOTIFICATION_KIND_PREFS.find((p) => p.kind === kind);
  if (!meta?.circleGated) return true;
  if (!actorCircle) return true;
  return prefs.circles[actorCircle] !== false;
}
