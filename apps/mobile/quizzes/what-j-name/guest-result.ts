// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers a first J-name result taken before the person had an account.
// Saved on this phone only, tied to the friend's share link, so signup can
// upload the result and add that friend. Never sent to analytics as content.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_KEY = 'bridger.quiz.jname.guest.v1';

export type JnameGuestResult = {
  jName: string;
  percent: number;
  topNames: string[];
  shareToken?: string;
  sharerFirstName?: string;
  sharerJName?: string;
  sharerPercent?: number;
  savedAt: number;
};

// THIS SECTION DOES: load a guest take saved on this phone.
export async function loadJnameGuestResult(): Promise<JnameGuestResult | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JnameGuestResult;
    if (!parsed?.jName || typeof parsed.percent !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

// THIS SECTION DOES: remember a no-account finish until they sign up.
export async function saveJnameGuestResult(
  result: Omit<JnameGuestResult, 'savedAt'>
): Promise<void> {
  try {
    const payload: JnameGuestResult = { ...result, savedAt: Date.now() };
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(payload));
  } catch {
    // Storage full: the on-screen result still shows this session.
  }
}

export async function clearJnameGuestResult(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_KEY);
  } catch {
    // ignore
  }
}
