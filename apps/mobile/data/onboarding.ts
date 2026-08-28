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
import { trackProduct } from '@bridger/shared';
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

/** Read only the saved device flag while authentication is still loading. */
export async function hydrateOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  completeCache = v === '1';
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
  return hydrateOnboardingComplete();
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
  const prefs = applyOnboardingNotificationPrefs(prefIds);
  await apiFetch('/me/notification-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ kinds: prefs.kinds, circles: prefs.circles })
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
  /**
   * A photo the server already rendered (the Comic look) and saved for us. When
   * present we just point the avatar at it, skipping the upload of the plain photo.
   */
  filteredMediaId?: string | null;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.photo = input.source;
    return;
  }

  // A server look (Comic) is already stored: point identity straight at it.
  if (input.filteredMediaId) {
    await apiFetch('/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarMediaId: input.filteredMediaId })
    });
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
 * Birthday — About Me row + legacy essential key for privacy review.
 * PRIVACY: visibility is chosen in the review step; the value is never logged
 * as analytics content.
 */
export async function saveBirthday(value: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.birthday = value;
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) return;
  // Canonical About Me field the profile card reads (kind=about).
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'about:about-birthday',
      attributes: [
        {
          key: 'about:about-birthday',
          value: {
            id: 'about-birthday',
            key: 'Birthday',
            value: trimmed,
            tier: 'friend'
          },
          layer: 'profile',
          visibleToTier: 'friend'
        }
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
  // Match privacy-review row ids (attribute keys) to saved rows, then PATCH
  // each one's visibleToTier. Empty "Not added" rows are skipped.
  type AttrRow = { id: string; key: string; value?: { favorite?: boolean } };
  const attrs = await apiFetch<AttrRow[]>('/me/attributes');
  const byKey = new Map(attrs.map((a) => [a.key, a.id]));
  // Favorite map pin may live under place:* with favorite:true (no fixed key).
  const favPlace = attrs.find(
    (a) => a.key.startsWith('place:') && a.value?.favorite === true
  );
  await Promise.all(
    rows.map(async (r) => {
      let attrId = byKey.get(r.id);
      if (
        !attrId &&
        r.id === 'about:about-favorite-place' &&
        favPlace
      ) {
        attrId = favPlace.id;
      }
      if (!attrId) return;
      await apiFetch(`/me/attributes/${encodeURIComponent(attrId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ visibleToTier: r.tier })
      });
    })
  );
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

/** 10A · Right now — current job + dream job as About Me rows. */
export async function saveRightNow(input: {
  currentJob: string;
  dreamJob: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.rightNow = { ...input };
    return;
  }
  const attrs: Array<{
    key: string;
    value: { id: string; key: string; value: string; tier: Tier };
    layer: string;
    visibleToTier: Tier;
  }> = [];
  if (input.currentJob.trim()) {
    attrs.push({
      key: 'about:about-job',
      value: {
        id: 'about-job',
        key: 'Work',
        value: input.currentJob.trim(),
        tier: 'friend'
      },
      layer: 'profile',
      visibleToTier: 'friend'
    });
  }
  if (input.dreamJob.trim()) {
    attrs.push({
      key: 'about:about-dream-job',
      value: {
        id: 'about-dream-job',
        key: 'Dream job',
        value: input.dreamJob.trim(),
        tier: 'friend'
      },
      layer: 'profile',
      visibleToTier: 'friend'
    });
  }
  // Write each About key with its own replacePrefix so we don't wipe siblings.
  for (const a of attrs) {
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        replacePrefix: a.key,
        attributes: [a]
      })
    });
  }
}

/**
 * 10B · Obsession — typed song becomes the canonical currently_song.
 * Connected Spotify/Apple picks override this via music_picks + listening overlay.
 */
export async function saveObsessionSong(song: string): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.song = song.trim();
    return;
  }
  if (!song.trim()) return;
  const { title, artist } = parseSongText(song.trim());
  await apiFetch('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify({ song: { title, artist } })
  });
}

/** Split "Title - Artist" / "Title by Artist" / bare title into song parts. */
function parseSongText(raw: string): { title: string; artist: string } {
  const byMatch = raw.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { title: byMatch[1]!.trim(), artist: byMatch[2]!.trim() };
  }
  const dash = raw.split(/\s+[–—-]\s+/);
  if (dash.length >= 2) {
    return {
      title: dash[0]!.trim(),
      artist: dash.slice(1).join(' - ').trim()
    };
  }
  const midDot = raw.split(/\s+[·•]\s+/);
  if (midDot.length >= 2) {
    return {
      title: midDot[0]!.trim(),
      artist: midDot.slice(1).join(' · ').trim()
    };
  }
  return { title: raw, artist: '' };
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

/**
 * 10E · Your places — hometown + current town become About Me rows; favorite
 * place is geocoded onto the travel map with a FAV star when possible.
 * PRIVACY: towns / place names only, never a street address.
 */
export async function savePlaces(input: {
  hometown: string;
  currentTown: string;
  favoritePlace: string;
}): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.places = { ...input };
    return;
  }

  // THIS SECTION DOES: write Hometown / Lives in as About Me fields.
  if (input.hometown.trim()) {
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        replacePrefix: 'about:about-from',
        attributes: [
          {
            key: 'about:about-from',
            value: {
              id: 'about-from',
              key: 'Hometown',
              value: input.hometown.trim(),
              tier: 'acquaintance'
            },
            layer: 'profile',
            visibleToTier: 'acquaintance'
          }
        ]
      })
    });
  }
  if (input.currentTown.trim()) {
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        replacePrefix: 'about:about-town',
        attributes: [
          {
            key: 'about:about-town',
            value: {
              id: 'about-town',
              key: 'Lives in',
              value: input.currentTown.trim(),
              tier: 'acquaintance'
            },
            layer: 'profile',
            visibleToTier: 'acquaintance'
          }
        ]
      })
    });
    // Header city pin uses home_city on settings.
    await apiFetch('/me/settings', {
      method: 'PATCH',
      body: JSON.stringify({ homeCity: input.currentTown.trim() })
    });
  }

  // THIS SECTION DOES: geocode the favorite trip and pin it on the map as FAV.
  const fav = input.favoritePlace.trim();
  if (!fav) return;

  const { searchPlaces } = await import('../lib/geocode');
  const hits = await searchPlaces(fav);
  const hit = hits[0];
  if (
    hit &&
    Number.isFinite(hit.lat) &&
    Number.isFinite(hit.lng) &&
    hit.countryCode.length === 2
  ) {
    const place = {
      id: `pl-onb-${Date.now()}`,
      label: hit.label || fav,
      note: 'Favorite place',
      lat: hit.lat,
      lng: hit.lng,
      countryCode: hit.countryCode,
      emoji: '⭐',
      year: String(new Date().getFullYear()),
      tier: 'friend' as Tier,
      tags: ['visited' as const],
      favorite: true
    };
    await apiFetch('/me/attributes', {
      method: 'POST',
      body: JSON.stringify({
        attributes: [
          {
            key: `place:${place.id}`,
            value: place,
            layer: 'profile',
            visibleToTier: place.tier
          }
        ]
      })
    });
    trackProduct('place_favorited', {});
    return;
  }

  // Geocode failed: keep a text About row so the answer is not lost.
  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: 'about:about-favorite-place',
      attributes: [
        {
          key: 'about:about-favorite-place',
          value: {
            id: 'about-favorite-place',
            key: 'Favorite place',
            value: fav,
            tier: 'friend'
          },
          layer: 'profile',
          visibleToTier: 'friend'
        }
      ]
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
 * weekly recap. Row ids match the attribute keys saved above so visibility
 * PATCH can find them.
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
    {
      id: 'about:about-birthday',
      label: 'Birthday',
      value: val(input.birthday),
      tier: 'friend' as Tier
    },
    {
      id: 'about:about-job',
      label: 'Job',
      value: val(input.currentJob),
      tier: 'friend' as Tier
    },
    {
      id: 'about:about-dream-job',
      label: 'Dream job',
      value: val(input.dreamJob),
      tier: 'friend' as Tier
    },
    {
      id: 'about:about-favorite-place',
      label: 'Place traveled',
      value: val(input.favoritePlace),
      tier: 'friend' as Tier
    },
    {
      id: 'currently_song',
      label: 'Song',
      value: val(input.song),
      tier: 'friend' as Tier
    },
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
