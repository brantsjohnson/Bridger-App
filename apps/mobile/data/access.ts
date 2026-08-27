// ============================================
// WHAT THIS FILE DOES (plain English):
// Reads whether demo week is on and whether this person may use the app or
// send invite links. Demo mode can fake demo week with EXPO_PUBLIC_DEMO_WEEK=1.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InviteAccessStatus } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';

const DEMO_ACCESS_KEY = 'bridger.demoAccess';

type DemoAccessCache = {
  demoInviteSent: boolean;
  canInvite: boolean;
  friendCount: number;
};

let demoCache: DemoAccessCache = {
  demoInviteSent: false,
  canInvite: true,
  friendCount: 0
};

function envDemoWeekActive(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO_WEEK === '1') return true;
  return false;
}

function buildDemoStatus(): InviteAccessStatus {
  const demoWeekActive = envDemoWeekActive();
  const accessGranted =
    !demoWeekActive || demoCache.friendCount > 0 || demoCache.demoInviteSent;
  return {
    demoWeekActive,
    canInvite: demoWeekActive ? demoCache.canInvite : true,
    friendCount: demoCache.friendCount,
    accessGranted,
    demoInviteSent: demoCache.demoInviteSent
  };
}

/** Hydrate demo access flags from device storage (demo mode only). */
export async function hydrateDemoAccess(): Promise<void> {
  if (!isDemoMode()) return;
  const raw = await AsyncStorage.getItem(DEMO_ACCESS_KEY);
  if (!raw) return;
  try {
    demoCache = { ...demoCache, ...(JSON.parse(raw) as DemoAccessCache) };
  } catch {
    /* ignore corrupt cache */
  }
}

async function persistDemoAccess(): Promise<void> {
  await AsyncStorage.setItem(DEMO_ACCESS_KEY, JSON.stringify(demoCache));
}

/** Current invite-access snapshot for the signed-in user. */
export async function getInviteAccess(): Promise<InviteAccessStatus> {
  if (isDemoMode()) {
    return buildDemoStatus();
  }
  return apiFetch<InviteAccessStatus>('/me/access');
}

/** Record that an invite was sent (unlocks demo-week access for seed users). */
export async function markDemoInviteSent(): Promise<InviteAccessStatus> {
  if (isDemoMode()) {
    demoCache.demoInviteSent = true;
    await persistDemoAccess();
    return buildDemoStatus();
  }
  return apiFetch<InviteAccessStatus>('/me/access/demo-invite-sent', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

/** Demo: user joined via invite and cannot invite others during demo week. */
export async function markDemoJoinedViaInvite(): Promise<void> {
  if (!isDemoMode()) return;
  demoCache.canInvite = false;
  demoCache.friendCount = Math.max(1, demoCache.friendCount);
  await persistDemoAccess();
}

/** Demo: bump friend count after a successful redeem. */
export async function bumpDemoFriendCount(): Promise<void> {
  if (!isDemoMode()) return;
  demoCache.friendCount += 1;
  await persistDemoAccess();
}

/** Quick check: is demo week forced via local env (QA only)? */
export function isDemoWeekEnvForced(): boolean {
  return process.env.EXPO_PUBLIC_DEMO_WEEK === '1';
}
