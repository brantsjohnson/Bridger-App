// ============================================
// WHAT THIS FILE DOES (plain English):
// The app's phone line to the server for the "What J name are you..." quiz:
// save my result, get my share link, read a shared result page, and (after
// signup) connect me to the friend who invited me. In demo mode everything is
// local, so these quietly do nothing. Network hiccups never crash the quiz.
// ============================================
import type {
  JnameLeaderboard,
  JnameResolveReferralInput,
  JnameResultInput,
  JnameSharedView,
  JnameShareResponse
} from '@bridger/shared';
import { apiFetch } from './api';
import { isDemoMode } from './demo';

// THIS SECTION DOES: save (or overwrite on retake) my result on the server.
export async function saveJnameResult(input: JnameResultInput): Promise<void> {
  if (isDemoMode()) return;
  try {
    await apiFetch('/jname/result', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  } catch {
    // Non-fatal: the on-screen result still shows.
  }
}

// THIS SECTION DOES: load the "your version of X" board (friends by J-name).
export async function fetchJnameLeaderboard(): Promise<JnameLeaderboard | null> {
  if (isDemoMode()) return null;
  try {
    return await apiFetch<JnameLeaderboard>('/jname/leaderboard');
  } catch {
    return null;
  }
}

// THIS SECTION DOES: fetch my one stable share link (null if not available yet).
export async function getJnameShareLink(): Promise<JnameShareResponse | null> {
  if (isDemoMode()) return null;
  try {
    return await apiFetch<JnameShareResponse>('/jname/share', {
      method: 'POST'
    });
  } catch {
    return null;
  }
}

// THIS SECTION DOES: read the free, no-account web view of a shared result.
export async function fetchJnameSharedView(
  token: string,
  anonRef?: string
): Promise<JnameSharedView | null> {
  try {
    const q = anonRef ? `?a=${encodeURIComponent(anonRef)}` : '';
    return await apiFetch<JnameSharedView>(
      `/jname/shared/${encodeURIComponent(token)}${q}`
    );
  } catch {
    return null;
  }
}

// THIS SECTION DOES: after signup, tell the server which friend invited me.
export async function resolveJnameReferral(
  input: JnameResolveReferralInput
): Promise<boolean> {
  if (isDemoMode()) return false;
  try {
    const res = await apiFetch<{ resolved: boolean }>(
      '/jname/referrals/resolve',
      { method: 'POST', body: JSON.stringify(input) }
    );
    return Boolean(res?.resolved);
  } catch {
    return false;
  }
}
