// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers whether you closed the one-time "Coming up is empty" teach card on
// Home. Stored on the device so it stays gone after you hit X, and the Coming
// up section hides until a real birthday / date / check-in appears.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device flag: you already dismissed the empty Coming up announcement. */
const KEY = 'bridger.home.comingUpEmptyDismissed';

// THIS SECTION DOES: ask the phone if the empty teach card was already closed.
export async function hasDismissedComingUpEmpty(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

// THIS SECTION DOES: mark the empty teach card closed so Home hides it.
export async function markComingUpEmptyDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Storage failure must not block dismissing the card in this session.
  }
}
