// ============================================
// WHAT THIS FILE DOES (plain English):
// When you invite or write a note about someone who is not on Bridger yet,
// we save a private card keyed to their phone number (E.164). Only you can
// see that card. When they later sign up with the same number, the server
// merges it into their real profile.
//
// PRIVACY: we never upload the whole address book. One row is created only
// when you explicitly pick that contact.
// ============================================
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

/** Create or update your private card for this phone. Returns null in demo. */
export async function upsertPendingPerson(input: {
  phone: string;
  displayName?: string | null;
}): Promise<PendingPerson | null> {
  const phoneE164 = toE164(input.phone);
  if (!phoneE164) return null;
  if (isDemoMode()) {
    return {
      id: `demo-pending-${phoneE164}`,
      phoneE164,
      displayName: input.displayName ?? null,
      mergedUserId: null
    };
  }
  return apiFetch<PendingPerson>('/me/pending-people', {
    method: 'POST',
    body: JSON.stringify({
      phoneE164,
      displayName: input.displayName ?? null
    })
  });
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
