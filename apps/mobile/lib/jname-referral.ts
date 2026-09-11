// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers, on this device, that someone opened a friend's shared J-name link
// before they had an account. Two small things live here:
//   1) an opaque "anon ref" (a random id, never your name) so the server can
//      recognize this device when you come back and sign up,
//   2) a "pending" share token we hold until you finish creating an account,
//      then hand to the server so it can connect you to the friend who invited
//      you. After that we forget it.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANON_REF_KEY = 'bridger.jname.anon_ref';
const PENDING_TOKEN_KEY = 'bridger.jname.pending_token';
const SHOW_DUO_KEY = 'bridger.jname.show_duo_token';

// THIS SECTION DOES: make a throwaway, non-identifying id for this device.
function randomAnonRef(): string {
  return `a_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// THIS SECTION DOES: get (or create once) this device's opaque anon ref.
export async function getAnonRef(): Promise<string> {
  try {
    let value = await AsyncStorage.getItem(ANON_REF_KEY);
    if (!value) {
      value = randomAnonRef();
      await AsyncStorage.setItem(ANON_REF_KEY, value);
    }
    return value;
  } catch {
    return randomAnonRef();
  }
}

// THIS SECTION DOES: hold the share token until the person finishes signing up.
export async function setPendingReferral(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_TOKEN_KEY, token);
  } catch {
    // Best effort only.
  }
}

// THIS SECTION DOES: peek at the pending token without forgetting it.
export async function peekPendingReferral(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PENDING_TOKEN_KEY);
  } catch {
    return null;
  }
}

// THIS SECTION DOES: read and clear the pending token (used right after signup).
export async function takePendingReferral(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
    if (value) await AsyncStorage.removeItem(PENDING_TOKEN_KEY);
    return value;
  } catch {
    return null;
  }
}

// THIS SECTION DOES: remember that we should open the quiz result (duo) after
// they finish making an account / onboarding.
export async function setShowDuoToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOW_DUO_KEY, token);
  } catch {
    // Best effort only.
  }
}

export async function takeShowDuoToken(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(SHOW_DUO_KEY);
    if (value) await AsyncStorage.removeItem(SHOW_DUO_KEY);
    return value;
  } catch {
    return null;
  }
}
