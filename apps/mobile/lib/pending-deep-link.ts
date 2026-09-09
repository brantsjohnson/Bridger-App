// ============================================
// WHAT THIS FILE DOES (plain English):
// After New onboarding finishes, we can stash one in-app route (like Events
// or Discover) and open it the first time Home loads. The note is wiped as
// soon as it is used so it never fires twice.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device key for the one-shot "open this after onboarding" route. */
export const PENDING_DEEP_LINK_KEY = 'bridger.pendingDeepLink';

/** Remember a route to open once Home appears. Never stores names or phones. */
export async function setPendingDeepLink(route: string | null): Promise<void> {
  try {
    if (!route) {
      await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
      return;
    }
    await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, route);
  } catch {
    // Best-effort: Home still works if this write fails.
  }
}

/**
 * Read and clear the stored route. Returns null when there is nothing to open.
 */
export async function consumePendingDeepLink(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
    return raw;
  } catch {
    return null;
  }
}
