// ============================================
// WHAT THIS FILE DOES (plain English):
// One "forget this session" button. Sign-out and leaving demo call this
// so last-seen tabs and the people phone book do not leak to the next
// person who uses this phone.
// ============================================
import { clearPeopleCache } from './people-cache';
import { clearTabSnapshots } from './tab-snapshots';

/** PRIVACY: wipe on-device tab pictures and the in-memory people book. */
export async function clearSessionCaches(): Promise<void> {
  clearPeopleCache();
  await clearTabSnapshots();
}
