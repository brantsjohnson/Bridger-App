// ============================================
// WHAT THIS FILE DOES (plain English):
// The app's phone line to the server for the "What J name are you..." quiz:
// save my result, load my saved result, get my share link, read a shared
// result page, load the friend board (with compatibility), and (after signup)
// connect me to the friend who invited me. In demo mode mutating calls quietly
// do nothing. Network hiccups never crash the quiz.
// ============================================
import type {
  JnameLeaderboard,
  JnameMyResult,
  JnameResolveReferralInput,
  JnameResolveReferralResult,
  JnameResultInput,
  JnameSharedView,
  JnameShareResponse
} from '@bridger/shared';
import { apiFetch } from './api';
import { isDemoMode } from './demo';

// THIS SECTION DOES: save my first result on the server. Fun retakes stay local.
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

// THIS SECTION DOES: load my saved result so Home and re-open show completed.
export async function fetchJnameMyResult(): Promise<JnameMyResult | null> {
  if (isDemoMode()) return null;
  try {
    return await apiFetch<JnameMyResult | null>('/jname/result');
  } catch {
    return null;
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
  if (isDemoMode()) {
    return { token: 'demo', url: 'https://bridger.app/q/demo' };
  }
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
  if (isDemoMode()) {
    return { jName: 'Jake', percent: 86, sharerFirstName: 'You' };
  }
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
): Promise<JnameResolveReferralResult> {
  if (isDemoMode()) return { resolved: false };
  try {
    return await apiFetch<JnameResolveReferralResult>(
      '/jname/referrals/resolve',
      { method: 'POST', body: JSON.stringify(input) }
    );
  } catch {
    return { resolved: false };
  }
}
