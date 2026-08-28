// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers whether you already closed the one-time "what Announcements are"
// card on Home. Stored on the device so it stays gone after you tap or hit X,
// and never comes back on the next visit.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device flag: you already dismissed the Home announcements intro card. */
const KEY = 'bridger.home.announcementsIntroDismissed';

// THIS SECTION DOES: ask the phone if the intro card was already closed.
export async function hasDismissedAnnouncementsIntro(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

// THIS SECTION DOES: mark the intro card closed so Home never shows it again.
export async function markAnnouncementsIntroDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Storage failure must not block dismissing the card in this session.
  }
}
