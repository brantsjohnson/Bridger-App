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
 * Demo mode reads the same device flag so localhost previews it once.
 */
export async function getOnboardingComplete(): Promise<boolean> {
  // TODO (live): read profiles.onboardingComplete from /me
  const v = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  completeCache = v === '1';
  return completeCache;
}

/** Mark onboarding done — only welcome-in calls this. */
export async function setOnboardingComplete(): Promise<void> {
  // TODO (live): PATCH /me { onboardingComplete: true }
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
    return;
  }
  // TODO: PATCH /me/notification-prefs
}

/** 3 · Name — the one required field. */
export async function saveName(name: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.name = name.trim();
    return;
  }
  // TODO: PATCH /me { name }
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
  // TODO: upload to media store (signed URL) + PATCH /me { avatar }
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
  // TODO: POST /me/attributes { key: 'birthday', value }
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
  // TODO: PATCH /discovery/settings { scope, city } (city coarse only)
}

/** 7 · Per-answer visibility. Defaults to all friends; teaches tiers by use. */
export async function saveVisibility(rows: VisibilityRow[]): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.visibility = rows.map((r) => ({ id: r.id, tier: r.tier }));
    return;
  }
  // TODO: PATCH /me/attributes visibility per row
}

/** 8 · Co-op pitch outcome. "Use free" is first-class — never a paywall. */
export async function joinCoop(join: boolean): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.coop = join;
    return;
  }
  // TODO: POST /coop/membership (or record "not now")
}
