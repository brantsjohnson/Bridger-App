// ============================================
// WHAT THIS FILE DOES (plain English):
// When you pick a contact or write notes about someone who is not on Bridger
// yet, we save a private card keyed to their phone number (E.164). Only you
// can see that card. When they later sign up with the same number, the server
// merges it into their real profile and keeps your notes.
//
// PRIVACY: we never upload the whole address book. One row is created only
// when you explicitly pick that contact.
// ============================================
import { trackProduct } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { toE164 } from '../lib/phone';

/** One private "this person is not on Bridger yet" card. */
export type PendingPerson = {
  id: string;
  phoneE164: string;
  displayName: string | null;
  mergedUserId: string | null;
};

/** Demo-only list so Connect contacts still works without the API. */
let demoPending: PendingPerson[] = [];

function demoIdFor(phoneE164: string): string {
  return `demo-pending-${phoneE164}`;
}

/** Cards you still own (not merged yet). */
export async function listPendingPeople(): Promise<PendingPerson[]> {
  if (isDemoMode()) {
    return demoPending.filter((p) => !p.mergedUserId);
  }
  return apiFetch<PendingPerson[]>('/me/pending-people');
}

/** One card you made. Used to open the profile you created. */
export async function getPendingPerson(id: string): Promise<PendingPerson | null> {
  if (isDemoMode()) {
    return demoPending.find((p) => p.id === id) ?? null;
  }
  try {
    return await apiFetch<PendingPerson>(
      `/me/pending-people/${encodeURIComponent(id)}`
    );
  } catch {
    return null;
  }
}

/** Create or update your private card for this phone. Returns null if the number is unusable. */
export async function upsertPendingPerson(input: {
  phone: string;
  displayName?: string | null;
  /** Set false when another confirmed event already covers this write. */
  track?: boolean;
}): Promise<PendingPerson | null> {
  const phoneE164 = toE164(input.phone);
  if (!phoneE164) return null;
  const displayName = input.displayName?.trim() || null;
  const track = input.track !== false;

  if (isDemoMode()) {
    const existing = demoPending.find(
      (p) => p.phoneE164 === phoneE164 && !p.mergedUserId
    );
    if (existing) {
      existing.displayName = displayName;
      if (track) trackProduct('pending_person_saved', { already_had: true });
      return existing;
    }
    const created: PendingPerson = {
      id: demoIdFor(phoneE164),
      phoneE164,
      displayName,
      mergedUserId: null
    };
    demoPending = [created, ...demoPending];
    if (track) trackProduct('pending_person_saved', { already_had: false });
    return created;
  }

  const saved = await apiFetch<PendingPerson>('/me/pending-people', {
    method: 'POST',
    body: JSON.stringify({
      phoneE164,
      displayName
    })
  });
  if (track) trackProduct('pending_person_saved', {});
  return saved;
}

/**
 * After phone sign-in, ask the server to merge any pending cards that match
 * this account's number. Idempotent. Never sends the number from the client
 * (the server reads it from Auth).
 */
export async function mergePendingPeopleForMe(): Promise<{ merged: number }> {
  if (isDemoMode()) return { merged: 0 };
  try {
    return await apiFetch<{ merged: number }>('/me/pending-people/merge', {
      method: 'POST',
      body: JSON.stringify({})
    });
  } catch {
    return { merged: 0 };
  }
}
