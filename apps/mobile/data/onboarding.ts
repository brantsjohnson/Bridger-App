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
 * capture-only). Demo just records the source; live uploads the picked file to
 * the private media bucket, then PATCH /me with the new avatar media id so it
 * shows on your profile behind the house filter.
 */
export async function savePhoto(input: {
  source: PhotoSource;
  uri?: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.photo = input.source;
    return;
  }
  // No file to upload (they picked a source but cancelled the picker): nothing
  // to save, and never crash the run over an optional photo.
  if (!input.uri) return;

  // Upload the bytes and create the owned `media` row, then point identity at it.
  const { uploadMedia } = await import('../lib/media-upload');
  const mediaId = await uploadMedia(
    input.uri,
    'photo',
    `avatar/${Date.now()}.jpg`
  );
  await apiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify({ avatarMediaId: mediaId })
  });
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
 * Invite a friend to Bridger. During demo week this asks for contacts, shares a
 * link, and records the send so access unlocks. PRIVACY: contacts stay on-device.
 */
export async function sendInvite(): Promise<void> {
  const { loadInviteContacts, sendInviteToContact, shareInviteForAccess } =
    await import('../lib/invite-from-contacts');
  const { contacts, permission } = await loadInviteContacts();
  if (contacts.length > 0) {
    await sendInviteToContact(contacts[0]!);
    return;
  }
  if (isDemoMode()) {
    demoDraftSaved.invited = true;
  }
  if (permission !== 'granted' || contacts.length === 0) {
    await shareInviteForAccess();
  }
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

/**
 * Connection style — how you want friends-of-friends matched to you (opaque
 * keys only: humor, values, personality, hobbies, communication). Own-matching
 * preference; never shown to others as free text.
 */
export async function saveConnectionStyle(styles: string[]): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.connectionStyle = [...styles];
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ connectionStyle: styles })
  });
}

/** 10A · Right now — current job + dream job. Two "essential" facts. */
export async function saveRightNow(input: {
  currentJob: string;
  dreamJob: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.rightNow = { ...input };
    return;
  }
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'work',
      attributes: [
        input.currentJob.trim()
          ? { key: 'current_job', value: { text: input.currentJob.trim() }, layer: 'essential', visibleToTier: 'friend' }
          : null,
        input.dreamJob.trim()
          ? { key: 'dream_job', value: { text: input.dreamJob.trim() }, layer: 'essential', visibleToTier: 'friend' }
          : null
      ].filter(Boolean)
    })
  });
}

/** 10B · Obsession — the song on repeat (typed fallback; connect flows use data/music). */
export async function saveObsessionSong(song: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.song = song.trim();
    return;
  }
  if (!song.trim()) return;
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'current_song',
      attributes: [
        { key: 'current_song', value: { text: song.trim() }, layer: 'essential', visibleToTier: 'friend' }
      ]
    })
  });
}

/** 10C · Social battery — nights out per week (0..7, 7 means 7+). Own-pacing only. */
export async function saveSocialBattery(nights: number): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.socialBattery = nights;
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ socialBattery: nights })
  });
}

/** 10D · Your color — a personal accent hex used to tint your own surfaces. */
export async function saveColor(hex: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.color = hex;
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ profileColor: hex })
  });
}

/** 10E · Your places — hometown, current town, favorite place visited. Towns only. */
export async function savePlaces(input: {
  hometown: string;
  currentTown: string;
  favoritePlace: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.places = { ...input };
    return;
  }
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'place',
      attributes: [
        input.hometown.trim()
          ? { key: 'hometown', value: { city: input.hometown.trim() }, layer: 'essential', visibleToTier: 'friend' }
          : null,
        input.currentTown.trim()
          ? { key: 'current_city', value: { city: input.currentTown.trim() }, layer: 'essential', visibleToTier: 'friend' }
          : null,
        input.favoritePlace.trim()
          ? { key: 'favorite_place', value: { city: input.favoritePlace.trim() }, layer: 'essential', visibleToTier: 'friend' }
          : null
      ].filter(Boolean)
    })
  });
}

/**
 * 10F · Recap — the highlight of your week (typed or a 20s voice memo).
 * Voice mode uploads the recorded clip to the private media bucket and stores
 * the resulting media id on the attribute; text mode stores the words. Demo
 * records only the mode + text (no upload).
 */
export async function saveRecap(input: {
  mode: 'voice' | 'text';
  text: string;
  recorded: boolean;
  recordedUri?: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.recap = {
      mode: input.mode,
      text: input.text,
      recorded: input.recorded
    };
    return;
  }

  // VOICE: upload the clip first, then save the attribute pointing at the audio.
  if (input.mode === 'voice' && input.recorded && input.recordedUri) {
    const { uploadMedia } = await import('../lib/media-upload');
    const mediaId = await uploadMedia(
      input.recordedUri,
      'audio',
      `recap/onboarding/${Date.now()}.m4a`
    );
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        replacePrefix: 'weekly_recap',
        attributes: [
          { key: 'weekly_recap', value: { mediaId }, layer: 'essential', visibleToTier: 'friend' }
        ]
      })
    });
    return;
  }

  // TEXT: just the words, no media.
  if (input.mode === 'text' && input.text.trim()) {
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        replacePrefix: 'weekly_recap',
        attributes: [
          { key: 'weekly_recap', value: { text: input.text.trim() }, layer: 'essential', visibleToTier: 'friend' }
        ]
      })
    });
  }
}

/**
 * Build the Privacy & Control review rows from the taste answers. Only the six
 * things the spec lists appear: birthday, job, dream job, favorite place, song,
 * weekly recap. Empty answers show "Not added" but still carry an audience.
 */
export function buildPrivacyRows(input: {
  birthday: string;
  currentJob: string;
  dreamJob: string;
  favoritePlace: string;
  song: string;
  recapText: string;
  recapRecorded: boolean;
}): VisibilityRow[] {
  const val = (s: string) => (s.trim() ? s.trim() : 'Not added');
  return [
    { id: 'birthday', label: 'Birthday', value: val(input.birthday), tier: 'friend' as Tier },
    { id: 'current_job', label: 'Job', value: val(input.currentJob), tier: 'friend' as Tier },
    { id: 'dream_job', label: 'Dream job', value: val(input.dreamJob), tier: 'friend' as Tier },
    { id: 'favorite_place', label: 'Place traveled', value: val(input.favoritePlace), tier: 'friend' as Tier },
    { id: 'current_song', label: 'Song', value: val(input.song), tier: 'friend' as Tier },
    {
      id: 'weekly_recap',
      label: 'Weekly recap',
      value: input.recapRecorded ? 'Voice memo' : val(input.recapText),
      tier: 'friend' as Tier
    }
  ];
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
