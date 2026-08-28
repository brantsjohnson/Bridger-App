// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers the last few screens someone visited, and when they hit the 404
// ("System says it's fine...") it posts that path trail to the API so the admin page
// can show how they got there. PRIVACY: route paths only — no names or content.
// ============================================
import {
  openSurface,
  trackProduct,
  type NotFoundReason
} from '@bridger/shared';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiFetch } from './api';
import { isDemoMode } from './demo';

const MAX_TRAIL = 20;

/** Recent pathnames, oldest → newest. In-memory for this app session. */
const trail: string[] = [];

/** Drop query strings and keep a stable path string. */
export function sanitizePath(raw: string): string {
  const noQuery = raw.split('?')[0] ?? raw;
  const trimmed = noQuery.replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Call from the root layout whenever the route changes. */
export function recordRoutePath(pathname: string): void {
  const path = sanitizePath(pathname);
  if (!path || path === '/+not-found') return;
  const last = trail[trail.length - 1];
  if (last === path) return;
  trail.push(path);
  if (trail.length > MAX_TRAIL) trail.shift();
}

export function getRouteTrail(): string[] {
  return [...trail];
}

/**
 * Record that someone saw the 404 / error dialog. Sends the trail to the API
 * for the admin console, and emits screen_not_found when analytics is on.
 */
export async function reportNotFoundHit(opts: {
  missingPath: string;
  reason?: NotFoundReason;
}): Promise<void> {
  const missingPath = sanitizePath(opts.missingPath);
  const reason: NotFoundReason = opts.reason ?? 'unmatched_route';
  const pathTrail = getRouteTrail();
  const platform = Platform.OS;
  const appVersion =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    undefined;

  openSurface('not_found');
  trackProduct('screen_not_found', {
    surface: 'not_found',
    missing_path: missingPath,
    path_trail: pathTrail.join(' > '),
    reason,
    platform,
    app_version: appVersion
  });

  // Ops trail for admin — always try (not PostHog). Fail quietly in demo / offline.
  if (isDemoMode() && !process.env.EXPO_PUBLIC_API_URL) {
    return;
  }
  try {
    await apiFetch('/telemetry/not-found', {
      method: 'POST',
      body: JSON.stringify({
        missingPath,
        pathTrail,
        reason,
        platform,
        appVersion
      })
    });
  } catch {
    // Never block the 404 UI on a reporting failure.
  }
}
