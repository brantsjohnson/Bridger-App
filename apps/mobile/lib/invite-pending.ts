// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers, on this device, a friend's invite link that was opened before the
// person had an account (they tapped "add me" while signed out). We hold the
// raw invite (a bridger://invite/... link or a bare code) until they finish
// signing in, then redeem it so the two of them become friends. After that we
// forget it. Nothing here is personal — it is just the invite link text.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_KEY = 'bridger.friend.pending_invite';

// THIS SECTION DOES: hold the invite link until the person signs in.
export async function setPendingInvite(raw: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, raw);
  } catch {
    // Best effort only — a lost pending invite just means they scan again.
  }
}

// THIS SECTION DOES: read and clear the pending invite (used right after login).
export async function takePendingInvite(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (value) await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    return value;
  } catch {
    return null;
  }
}
