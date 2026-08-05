// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the post-sign-up Onboarding run needs: the one-off "have they
// finished?" gate, and the save calls for each step (notifications, name,
// photo, the 10 basics, meet, visibility, co-op). Demo mode keeps a device
// flag + in-memory answers so you can preview on localhost. Live mode will
// call the profiles / attributes APIs — same function names either way.
//
// PRIVACY (load-bearing):
// - Name is the only required field; everything else is skippable.
// - The meet step takes a CITY only, never a street address.
// - Each basics answer becomes an attribute with its own visibility (set in
//   the review step). The de-identified AI summary is built server-side from
//   words only and is never shown to the user (see ONBOARDING.md / DATA.md).
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tier } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { apiFetch } from '../lib/api';
import { applyOnboardingNotificationPrefs } from './notification-prefs';

/** Device-local flag: this account already finished onboarding. */
export const ONBOARDING_COMPLETE_KEY = 'bridger.onboardingComplete';

export type MeetScope = 'near' | 'anywhere';
export type PhotoSource = 'camera' | 'library';

/** One reviewed answer + who can see it (defaults to all friends). */
export type VisibilityRow = {
  id: string;
  label: string;
  value: string;
  tier: Tier;
};

// --- DEMO STATE: keeps the run's answers for the session so saves feel real ---
let demoDraftSaved: Record<string, unknown> = {};

// A synchronous mirror of the "finished onboarding?" flag. The router gate reads
// this the instant welcome-in sets it, so it never bounces the person back to
// onboarding while the (async) storage read is still in flight.
let completeCache = false;

/** Read the last-known onboarding status without waiting on storage. */
export function isOnboardingCompleteCached(): boolean {
  return completeCache;
}

/**
 * Has this person finished onboarding? Returns false until welcome-in runs.
 * Demo mode reads the device flag. Live mode asks the server (so the answer
 * survives a reinstall) and mirrors it into the device cache as a fast path.
 */
export async function getOnboardingComplete(): Promise<boolean> {
  if (!isDemoMode()) {
    try {
      const me = await apiFetch<{ onboardingComplete?: boolean }>('/me');
      completeCache = me?.onboardingComplete === true;
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, completeCache ? '1' : '0');
      return completeCache;
    } catch {
      // Offline / API down: fall back to the last-known device flag below.
    }
  }
  const v = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  completeCache = v === '1';
  return completeCache;
}

/** Mark onboarding done — only welcome-in calls this. */
export async function setOnboardingComplete(): Promise<void> {
  if (!isDemoMode()) {
    await apiFetch('/me', {
      method: 'PATCH',
      body: JSON.stringify({ onboardingComplete: true })
    });
  }
  // Always mirror into the device cache so the router gate reads it instantly.
  completeCache = true;
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
}

/** QA helper: clear the flag so the run can be previewed again. */
export async function resetOnboarding(): Promise<void> {
  completeCache = false;
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

/** 2 · Which nudges they want (multi-select). Writes notification prefs. */
export async function saveNotifications(prefIds: string[]): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.notifications = [...prefIds];
    // Mirror into the Settings prefs store so Profile → Notifications matches.
    applyOnboardingNotificationPrefs(prefIds);
    return;
  }
  // Expand coarse chips into per-kind prefs on device so Settings matches.
  applyOnboardingNotificationPrefs(prefIds);
  await apiFetch('/me/notification-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ prefIds })
  });
}

/** 3 · Name — the one required field. */
export async function saveName(name: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.name = name.trim();
    return;
  }
  await apiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify({ name: name.trim() })
  });
}

/**
 * 4 · Profile photo — the one place an upload is allowed (stories stay
 * capture-only). Demo just records the source; live uploads through the media
 * store and applies the house filter.
 */
export async function savePhoto(input: { source: PhotoSource }): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.photo = input.source;
    return;
  }
  // FOLLOW-UP (needs a Supabase Storage bucket + signed upload, like recap
  // audio): upload the file, create a `media` row, then PATCH /me with the new
  // avatar media id. The /me PATCH route is ready; only the upload path is left.
}

/**
 * Birthday — its own attribute. PRIVACY: visibility is chosen in the review
 * step; the value is never logged as analytics content.
 */
export async function saveBirthday(value: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.birthday = value;
    return;
  }
  // One "essential" fact under the fixed 'birthday' key. replacePrefix clears
  // any old birthday first so re-answering never leaves two rows.
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'birthday',
      attributes: [
        { key: 'birthday', value: { date: value }, layer: 'essential', visibleToTier: 'friend' }
      ]
    })
  });
}

/**
 * Invite a friend to Bridger. Bridger only works once you have a friend on it,
 * so onboarding nudges one invite up front.
 * PRIVACY: contacts are never uploaded in bulk; this is a single, explicit share.
 */
export async function sendInvite(): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.invited = true;
    return;
  }
  // TODO: open the OS share sheet with a personal invite link
}

/** 6 · Meet new people — city only, never an address. */
export async function saveMeet(input: {
  scope: MeetScope;
  city?: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.meet = { scope: input.scope, city: input.city ?? '' };
    return;
  }
  // City is coarse only (never a street address). 'near' maps to the DB's
  // 'nearby' meet scope.
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({
      meetScope: input.scope === 'near' ? 'nearby' : 'anywhere',
      homeCity: input.city ?? ''
    })
  });
}

/** 7 · Per-answer visibility. Defaults to all friends; teaches tiers by use. */
export async function saveVisibility(rows: VisibilityRow[]): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.visibility = rows.map((r) => ({ id: r.id, tier: r.tier }));
    return;
  }
  // FOLLOW-UP: PATCH /me/attributes/:id { visibleToTier } for each row. Wiring
  // this needs the basics step to first return the saved attribute ids so each
  // review row knows which DB fact it controls; today the row id is the answer
  // id, not the attribute id. The PATCH route itself is ready.
}

/** 8 · Co-op pitch outcome. "Use free" is first-class; never a paywall. */
export async function joinCoop(
  join: boolean,
  method: 'apple' | 'google' | 'card' | 'soft' = 'soft'
): Promise<void> {
  if (join) {
    // Product event coop_joined fires inside data/coop.joinCoop.
    const { joinCoop: joinLive } = await import('./coop');
    if (isDemoMode()) demoDraftSaved.coop = true;
    await joinLive(method);
    return;
  }
  // Use free: keep free plan, do not emit coop_left (they never joined).
  if (isDemoMode()) {
    demoDraftSaved.coop = false;
    return;
  }
  await apiFetch('/coop/membership', {
    method: 'POST',
    body: JSON.stringify({ join: false })
  });
}
