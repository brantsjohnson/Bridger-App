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
import { supabase } from '../lib/supabase';
import { applyOnboardingNotificationPrefs } from './notification-prefs';

/** Device-local flag: this account already finished onboarding. */
export const ONBOARDING_COMPLETE_KEY = 'bridger.onboardingComplete';

/** Device-local copy of the "where were you?" onboarding resume point. */
export const ONBOARDING_PROGRESS_KEY = 'bridger.onboardingProgress';

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
// this the instant Co-op (the last step) sets it, so it never bounces the person
// back to onboarding while the (async) storage read is still in flight.
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
 * Has this person finished onboarding? Returns false until Co-op finishes.
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

/** Mark onboarding done — Co-op (the last step) calls this. */
export async function setOnboardingComplete(): Promise<void> {
  // THIS SECTION DOES: flip the local "done" flag first so Co-op can leave
  // even when the API is down. The router gate reads this cache immediately.
  completeCache = true;
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');

  if (isDemoMode()) return;

  // Best-effort server mirror in the background. Do not await: a hung network
  // must not leave someone stuck on the last onboarding step.
  void apiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify({ onboardingComplete: true })
  }).catch((err) => {
    console.warn('Could not save onboardingComplete to the server; local flag is set.', err);
  });
}

/** QA helper: clear the flag so the run can be previewed again. */
export async function resetOnboarding(): Promise<void> {
  completeCache = false;
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  // Also drop any saved resume point so the preview starts clean.
  await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
}

// ============================================
// ONBOARDING RESUME POINT (plain English):
// As a person moves through onboarding we remember two things: which screen
// they are on (`step`) and the answers they have typed so far (`draft`). We keep
// a copy on the device (instant, works offline, survives a force-quit) AND, for
// signed-in people, a copy in Supabase (survives a reinstall or a new phone).
// On relaunch the run reads this and drops them right back where they were, so a
// crash never sends anyone back to the very first screen. It is wiped the moment
// onboarding finishes.
//
// NOTE: each real answer is ALSO saved to its normal home as they advance (see
// the save* functions above); this is only the resume copy.
// ============================================

/** The shape the onboarding run reads back to resume: a screen + its answers. */
export type LoadedOnboardingProgress = {
  step: string;
  draft: Record<string, unknown>;
} | null;

/** Who is signed in right now (null in demo / before login). */
async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Save the resume point to the DEVICE only (fast path). Called on every small
 * change so a crash mid-typing still keeps what they entered. Best-effort: a
 * failed write never blocks the run.
 */
export async function persistOnboardingProgressLocal(
  step: string,
  draft: Record<string, unknown>
): Promise<void> {
  // Demo / preview stays ephemeral: every preview starts the run from the top.
  if (isDemoMode()) return;
  try {
    const userId = await currentUserId();
    await AsyncStorage.setItem(
      ONBOARDING_PROGRESS_KEY,
      JSON.stringify({ userId, step, draft, savedAt: Date.now() })
    );
  } catch {
    // Local save is best-effort; never strand the person over it.
  }
}

/**
 * Save the resume point to BOTH the device and Supabase. Called as the person
 * advances (or steps back), which is the natural moment to record progress. The
 * server write is fire-and-forget so a slow network never blocks the button.
 */
export async function saveOnboardingProgress(
  step: string,
  draft: Record<string, unknown>
): Promise<void> {
  await persistOnboardingProgressLocal(step, draft);
  if (isDemoMode()) return;
  void apiFetch('/me/onboarding-progress', {
    method: 'PATCH',
    body: JSON.stringify({ step, draft })
  }).catch((err) => {
    console.warn(
      'Could not save onboarding progress to the server; device copy is set.',
      err
    );
  });
}

/**
 * Read the resume point on relaunch. Prefer the device copy (fast, offline,
 * survives force-quit); fall back to the Supabase copy (survives reinstall).
 * Returns null when there is nothing to resume, so the run starts at screen one.
 */
export async function loadOnboardingProgress(): Promise<LoadedOnboardingProgress> {
  // Demo / preview never resumes: it always starts the run from the top.
  if (isDemoMode()) return null;

  // 1) Device copy first.
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        userId?: string | null;
        step?: string;
        draft?: Record<string, unknown>;
      };
      const uid = await currentUserId();
      // Only trust the device copy if it belongs to the signed-in account.
      const sameAccount = !uid || !parsed.userId || parsed.userId === uid;
      if (sameAccount && parsed.step && parsed.draft) {
        return { step: parsed.step, draft: parsed.draft };
      }
    }
  } catch {
    // Corrupt/absent device copy: fall through to the server.
  }

  // 2) Server copy (reinstall / new device).
  try {
    const me = await apiFetch<{
      onboardingStep?: string | null;
      onboardingDraft?: Record<string, unknown> | null;
    }>('/me');
    if (me?.onboardingStep && me.onboardingDraft) {
      return { step: me.onboardingStep, draft: me.onboardingDraft };
    }
  } catch {
    // Offline / API down: nothing to resume from; start fresh.
  }
  return null;
}

/** Wipe the resume point (device + server) when onboarding is finished. */
export async function clearOnboardingProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
  } catch {
    // ignore: the complete flag already gates entry to the app.
  }
  if (isDemoMode()) return;
  void apiFetch('/me/onboarding-progress', {
    method: 'PATCH',
    body: JSON.stringify({ step: null, draft: null })
  }).catch(() => {
    // Best-effort: the device copy is already gone and complete=true gates entry.
  });
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
 *
 * When a look was baked (Pop art / Comic / X-ray / Sepia), `filteredMediaId` is
 * the avatar face and `originalMediaId` + `filter` are kept so Edit can switch
 * looks later without a re-upload.
 */
export async function savePhoto(input: {
  source?: PhotoSource | null;
  uri?: string;
  /**
   * A photo the server already rendered (the Comic look) and saved for us. When
   * present we just point the avatar at it, skipping the upload of the plain photo.
   */
  filteredMediaId?: string | null;
  /** Unfiltered source media id (for re-baking a different look later). */
  originalMediaId?: string | null;
  /** Which look is baked into filteredMediaId. */
  filter?: 'pop_art' | 'comic' | 'x_ray' | 'sepia' | null;
  /**
   * Demo only: the plain local photo URI when `uri` is already a baked preview.
   * Lets Edit switch looks without losing the source.
   */
  originalUri?: string | null;
}): Promise<void> {
  if (isDemoMode()) {
    try {
      demoDraftSaved.photo = input.source ?? 'library';
      // Keep the picked (or baked preview) path on the profile header so About Me
      // + banner show the look they chose, not a stock demo face.
      if (input.uri) {
        const { setMyProfileHeader } = await import('./profile');
        await setMyProfileHeader({
          avatarUrl: input.uri,
          avatarFilter: input.filter ?? null,
          avatarOriginalUrl: input.originalUri ?? input.uri
        });
      }
    } catch (err) {
      // Demo must never crash the onboarding run over a header write.
      console.warn('[savePhoto] demo header update failed', err);
    }
    return;
  }

  // A server look is already stored: point identity at the filtered copy and
  // remember the original + look key for later Edit switches.
  if (input.filteredMediaId) {
    try {
      await apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          avatarMediaId: input.filteredMediaId,
          ...(input.originalMediaId
            ? { avatarOriginalMediaId: input.originalMediaId }
            : {}),
          ...(input.filter ? { avatarFilter: input.filter } : {})
        })
      });
    } catch (err) {
      // Filter columns may be missing on an older DB: still save the face plain.
      console.warn('[savePhoto] filtered identity patch failed; plain fallback', err);
      await apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatarMediaId: input.filteredMediaId })
      });
    }
    // THIS SECTION DOES: refresh the in-memory face so Home header updates now.
    try {
      const { loadPeople } = await import('../lib/people-cache');
      await loadPeople({ force: true });
    } catch {
      // Cache refresh is best-effort; the DB write already succeeded.
    }
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
  try {
    await apiFetch('/me', {
      method: 'PATCH',
      body: JSON.stringify({
        avatarMediaId: mediaId,
        avatarOriginalMediaId: mediaId,
        // Keep the look they picked even when the server bake did not finish.
        avatarFilter: input.filter ?? null
      })
    });
  } catch (err) {
    // Older servers without filter columns: save just the avatar media id.
    console.warn('[savePhoto] plain identity patch with filter null failed', err);
    await apiFetch('/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarMediaId: mediaId })
    });
  }
  try {
    const { loadPeople } = await import('../lib/people-cache');
    await loadPeople({ force: true });
  } catch {
    // Cache refresh is best-effort; the DB write already succeeded.
  }
}

/**
 * Birthday — About Me row + legacy essential key for privacy review.
 * PRIVACY: visibility is chosen in the review step (Old) or the birthday group
 * picker (New). The value is never logged as analytics content.
 */
export async function saveBirthday(
  value: string,
  visibleToTier: Tier = 'friend'
): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.birthday = value;
    demoDraftSaved.birthdayTier = visibleToTier;
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) return;
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
            tier: visibleToTier
          },
          layer: 'profile',
          visibleToTier
        }
      ]
    })
  });
}

/** PRIVACY: write who can see the birthday (Close / Friends / Acquaintances). */
export async function saveBirthdayAudience(
  birthday: string,
  tier: Tier
): Promise<void> {
  if (!birthday.trim()) {
    if (isDemoMode()) demoDraftSaved.birthdayTier = tier;
    return;
  }
  await saveBirthday(birthday, tier);
}

/** Opaque membership-interest keys from New onboarding Co-op 6. */
export async function saveMembershipInterests(ids: string[]): Promise<void> {
  const clean = ids.filter((s) => typeof s === 'string' && s.trim()).slice(0, 20);
  if (isDemoMode()) {
    demoDraftSaved.membershipInterests = clean;
    trackProduct('membership_interests_selected', { count: clean.length });
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ membershipInterests: clean })
  });
  trackProduct('membership_interests_selected', { count: clean.length });
}

/** Opaque "what would help" keys from New onboarding Product 2. */
export async function saveHelpInterests(ids: string[]): Promise<void> {
  const clean = ids.filter((s) => typeof s === 'string' && s.trim()).slice(0, 20);
  if (isDemoMode()) {
    demoDraftSaved.helpInterests = clean;
    trackProduct('help_interests_selected', { count: clean.length });
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ helpInterests: clean })
  });
  trackProduct('help_interests_selected', { count: clean.length });
}

/** How they like collage pages made (auto / manual / assist). */
export async function savePageAuthoring(
  pref: 'auto' | 'manual' | 'assist' | null
): Promise<void> {
  if (isDemoMode()) {
    demoDraftSaved.pageAuthoring = pref;
    return;
  }
  await apiFetch('/me/settings', {
    method: 'PATCH',
    body: JSON.stringify({ pageAuthoring: pref })
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
 * Connection style — what kind of friend you could use right now (opaque
 * keys only: workout, go_out, creative, industry, travel, nearby, gets_me).
 * Own-matching preference; never shown to others as free text.
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
 * place (when picked from search) pins Places traveled as FAV without
 * re-geocoding. PRIVACY: towns / place names only, never a street address.
 */
export async function savePlaces(input: {
  hometown: string;
  currentTown: string;
  favoritePlace: string;
  favoritePlaceHit?: {
    label: string;
    lat: number;
    lng: number;
    countryCode: string;
  } | null;
  /** Private = none, Close friends only = close (default Private for towns). */
  hometownTier?: Tier;
  currentTownTier?: Tier;
  favoritePlaceTier?: Tier;
}): Promise<void> {
  const hometownTier = input.hometownTier ?? 'none';
  const currentTownTier = input.currentTownTier ?? 'none';
  const favoritePlaceTier = input.favoritePlaceTier ?? 'close';

  if (isDemoMode()) {
    demoDraftSaved.places = {
      hometown: input.hometown,
      currentTown: input.currentTown,
      favoritePlace: input.favoritePlace,
      favoritePlaceHit: input.favoritePlaceHit ?? null
    };
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
              tier: hometownTier
            },
            layer: 'profile',
            visibleToTier: hometownTier
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
              tier: currentTownTier
            },
            layer: 'profile',
            visibleToTier: currentTownTier
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

  // THIS SECTION DOES: pin the favorite trip on the map as FAV when we already
  // have a search pick (no second geocode). Text-only fallback if they somehow
  // have a label with no hit.
  const hit = input.favoritePlaceHit;
  if (
    hit &&
    Number.isFinite(hit.lat) &&
    Number.isFinite(hit.lng) &&
    hit.countryCode.length === 2
  ) {
    const place = {
      id: `pl-onb-${Date.now()}`,
      label: hit.label || input.favoritePlace.trim() || 'Favorite place',
      note: 'Favorite place',
      lat: hit.lat,
      lng: hit.lng,
      countryCode: hit.countryCode.toUpperCase(),
      emoji: '⭐',
      year: String(new Date().getFullYear()),
      tier: favoritePlaceTier,
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

  const fav = input.favoritePlace.trim();
  if (!fav) return;

  // No hit: keep a text About row so the answer is not lost.
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
            tier: favoritePlaceTier
          },
          layer: 'profile',
          visibleToTier: favoritePlaceTier
        }
      ]
    })
  });
}

/**
 * Privacy & Control "Edit" — write one row's new text back to Supabase right
 * away (About Me / song), so Continue is not the only save. Never logs the
 * typed value. Empty clears the local draft display to "Not added" and replaces
 * the attribute prefix with nothing when the API allows an empty list.
 */
export async function savePrivacyRowValue(
  rowId: string,
  value: string
): Promise<void> {
  const trimmed = value.trim();

  if (isDemoMode()) {
    if (rowId === 'about:about-birthday') demoDraftSaved.birthday = trimmed;
    if (rowId === 'about:about-from') {
      const places = (demoDraftSaved.places as Record<string, unknown>) ?? {};
      demoDraftSaved.places = { ...places, hometown: trimmed };
    }
    if (rowId === 'about:about-town') {
      const places = (demoDraftSaved.places as Record<string, unknown>) ?? {};
      demoDraftSaved.places = { ...places, currentTown: trimmed };
    }
    if (rowId === 'about:about-job') {
      const rn = (demoDraftSaved.rightNow as Record<string, unknown>) ?? {};
      demoDraftSaved.rightNow = { ...rn, currentJob: trimmed };
    }
    if (rowId === 'about:about-dream-job') {
      const rn = (demoDraftSaved.rightNow as Record<string, unknown>) ?? {};
      demoDraftSaved.rightNow = { ...rn, dreamJob: trimmed };
    }
    if (rowId === 'about:about-favorite-place') {
      const places = (demoDraftSaved.places as Record<string, unknown>) ?? {};
      demoDraftSaved.places = {
        ...places,
        favoritePlace: trimmed,
        favoritePlaceHit: null
      };
    }
    if (rowId === 'currently_song') demoDraftSaved.song = trimmed;
    return;
  }

  if (rowId === 'currently_song') {
    if (!trimmed) {
      await apiFetch('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ song: { title: '', artist: '' } })
      });
      return;
    }
    await saveObsessionSong(trimmed);
    return;
  }

  if (rowId === 'about:about-birthday') {
    await saveBirthday(trimmed);
    return;
  }

  // About Me text fields: always replacePrefix so a new edit overwrites the old.
  const aboutMeta: Record<
    string,
    { valueId: string; keyLabel: string; defaultTier: Tier }
  > = {
    'about:about-from': {
      valueId: 'about-from',
      keyLabel: 'Hometown',
      defaultTier: 'acquaintance'
    },
    'about:about-town': {
      valueId: 'about-town',
      keyLabel: 'Lives in',
      defaultTier: 'acquaintance'
    },
    'about:about-job': {
      valueId: 'about-job',
      keyLabel: 'Work',
      defaultTier: 'friend'
    },
    'about:about-dream-job': {
      valueId: 'about-dream-job',
      keyLabel: 'Dream job',
      defaultTier: 'friend'
    },
    'about:about-favorite-place': {
      valueId: 'about-favorite-place',
      keyLabel: 'Favorite place',
      defaultTier: 'friend'
    }
  };
  const meta = aboutMeta[rowId];
  if (!meta) return;

  await apiFetch('/me/attributes', {
    method: 'POST',
    body: JSON.stringify({
      replacePrefix: rowId,
      attributes: trimmed
        ? [
            {
              key: rowId,
              value: {
                id: meta.valueId,
                key: meta.keyLabel,
                value: trimmed,
                tier: meta.defaultTier
              },
              layer: 'profile',
              visibleToTier: meta.defaultTier
            }
          ]
        : []
    })
  });

  // Lives-in also drives the header city pin.
  if (rowId === 'about:about-town' && trimmed) {
    await apiFetch('/me/settings', {
      method: 'PATCH',
      body: JSON.stringify({ homeCity: trimmed })
    });
  }
}

/**
 * ARCHIVED from onboarding (2026-08-28). Kept so we can re-enable the step.
 * Friend Pod "Add your recap" is the live weekly voice capture.
 *
 * Was: 10F · Recap — the highlight of your week (typed or a 20s voice memo).
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
 * Build the Privacy & Control review rows from the taste answers. Birthday,
 * hometown, lives in, job, dream job, favorite place, and song. (Onboarding no
 * longer collects a weekly recap clip; Friend Pod still does later.) Row ids
 * match the attribute keys saved above so visibility PATCH can find them.
 */
export function buildPrivacyRows(input: {
  birthday: string;
  hometown?: string;
  currentTown?: string;
  currentJob: string;
  dreamJob: string;
  favoritePlace: string;
  song: string;
  hometownTier?: Tier;
  currentTownTier?: Tier;
  favoritePlaceTier?: Tier;
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
      id: 'about:about-from',
      label: 'Hometown',
      value: val(input.hometown ?? ''),
      tier: (input.hometownTier ?? 'none') as Tier
    },
    {
      id: 'about:about-town',
      label: 'Lives in',
      value: val(input.currentTown ?? ''),
      tier: (input.currentTownTier ?? 'none') as Tier
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
      tier: (input.favoritePlaceTier ?? 'close') as Tier
    },
    {
      id: 'currently_song',
      label: 'Song',
      value: val(input.song),
      tier: 'friend' as Tier
    }
  ];
}

/**
 * Final safety net at the end of onboarding: re-save every draft field that
 * still has a value. Covers the case where an earlier step's save failed
 * quietly (network blip) but the person kept going. Best-effort: one failure
 * must never block finishing.
 */
export async function flushOnboardingDraft(draft: {
  firstName: string;
  lastName: string;
  photoSource: PhotoSource | null;
  photoUri: string | null;
  filteredMediaId: string | null;
  originalMediaId: string | null;
  bakedPhotoUri: string | null;
  photoFilter: 'pop_art' | 'comic' | 'x_ray' | 'sepia';
  birthday: string;
  connectStyles: string[];
  notifPrefs: string[];
  currentJob: string;
  dreamJob: string;
  song: string;
  nights: number | null;
  color: string | null;
  hometown: string;
  currentTown: string;
  favoritePlace: string;
  favoritePlaceHit: {
    label: string;
    lat: number;
    lng: number;
    countryCode: string;
  } | null;
  hometownPrivacy?: Tier;
  currentTownPrivacy?: Tier;
  favoritePlacePrivacy?: Tier;
  visibility: VisibilityRow[];
  birthdayTier?: Tier | null;
  membershipInterests?: string[];
  helpInterests?: string[];
  pageAuthoring?: 'auto' | 'manual' | 'assist' | null;
}): Promise<void> {
  if (isDemoMode()) return;

  // Collect hard failures so finish can stop instead of marking complete with
  // an empty profile (TestFlight: "I already typed that" on Add details).
  const critical: string[] = [];

  const name = `${draft.firstName} ${draft.lastName}`.trim();
  if (name) {
    try {
      await saveName(name);
    } catch (err) {
      console.warn('flushOnboardingDraft: name failed', err);
      critical.push('name');
    }
  }

  if (draft.photoUri || draft.filteredMediaId || draft.bakedPhotoUri) {
    try {
      await savePhoto({
        source: draft.photoSource,
        uri: draft.bakedPhotoUri ?? draft.photoUri ?? undefined,
        filteredMediaId: draft.filteredMediaId,
        originalMediaId: draft.originalMediaId,
        filter: draft.photoFilter,
        originalUri: draft.photoUri
      });
    } catch (err) {
      console.warn('flushOnboardingDraft: photo failed', err);
      critical.push('photo');
    }
  }

  if (draft.birthday.trim()) {
    try {
      await saveBirthday(draft.birthday, draft.birthdayTier ?? 'friend');
    } catch (err) {
      console.warn('flushOnboardingDraft: birthday failed', err);
      critical.push('birthday');
    }
  }

  if (draft.connectStyles.length) {
    try {
      await saveConnectionStyle(draft.connectStyles);
    } catch (err) {
      console.warn('flushOnboardingDraft: connectionStyle failed', err);
    }
  }

  if (draft.notifPrefs.length) {
    try {
      await saveNotifications(draft.notifPrefs);
    } catch (err) {
      console.warn('flushOnboardingDraft: notifications failed', err);
    }
  }

  if (draft.currentJob.trim() || draft.dreamJob.trim()) {
    try {
      await saveRightNow({
        currentJob: draft.currentJob,
        dreamJob: draft.dreamJob
      });
    } catch (err) {
      console.warn('flushOnboardingDraft: rightNow failed', err);
      critical.push('work');
    }
  }

  if (draft.song.trim()) {
    try {
      await saveObsessionSong(draft.song);
    } catch (err) {
      console.warn('flushOnboardingDraft: song failed', err);
      critical.push('song');
    }
  }

  if (draft.nights != null) {
    try {
      await saveSocialBattery(draft.nights);
    } catch (err) {
      console.warn('flushOnboardingDraft: socialBattery failed', err);
    }
  }

  if (draft.color) {
    try {
      await saveColor(draft.color);
    } catch (err) {
      console.warn('flushOnboardingDraft: color failed', err);
    }
  }

  if (
    draft.hometown.trim() ||
    draft.currentTown.trim() ||
    draft.favoritePlace.trim() ||
    draft.favoritePlaceHit
  ) {
    try {
      await savePlaces({
        hometown: draft.hometown,
        currentTown: draft.currentTown,
        favoritePlace: draft.favoritePlace,
        favoritePlaceHit: draft.favoritePlaceHit,
        hometownTier: draft.hometownPrivacy,
        currentTownTier: draft.currentTownPrivacy,
        favoritePlaceTier: draft.favoritePlacePrivacy
      });
    } catch (err) {
      console.warn('flushOnboardingDraft: places failed', err);
      critical.push('places');
    }
  }

  if (draft.visibility.length) {
    try {
      await saveVisibility(draft.visibility);
    } catch (err) {
      console.warn('flushOnboardingDraft: visibility failed', err);
      critical.push('privacy');
    }
  }

  if (draft.membershipInterests?.length) {
    try {
      await saveMembershipInterests(draft.membershipInterests);
    } catch (err) {
      console.warn('flushOnboardingDraft: membershipInterests failed', err);
    }
  }

  if (draft.helpInterests?.length) {
    try {
      await saveHelpInterests(draft.helpInterests);
    } catch (err) {
      console.warn('flushOnboardingDraft: helpInterests failed', err);
    }
  }

  if (draft.pageAuthoring) {
    try {
      await savePageAuthoring(draft.pageAuthoring);
    } catch (err) {
      console.warn('flushOnboardingDraft: pageAuthoring failed', err);
    }
  }

  if (critical.length) {
    throw new Error(
      `Could not save ${critical.join(', ')}. Check your connection and try again.`
    );
  }
}

/** 8 · Co-op pitch outcome. "Use free" is first-class; never a paywall. */
export async function joinCoop(
  join: boolean,
  method: 'apple' | 'google' | 'card' | 'soft' = 'soft',
  plan: 'monthly' | 'yearly' = 'monthly'
): Promise<void> {
  if (join) {
    // Product event coop_joined fires inside data/coop.joinCoop.
    const { joinCoop: joinLive } = await import('./coop');
    if (isDemoMode()) demoDraftSaved.coop = true;
    await joinLive(method, plan);
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
