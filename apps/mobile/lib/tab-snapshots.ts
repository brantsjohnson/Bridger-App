// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers the last thing each tab showed (Home widgets, Friends roster,
// Events, Discover, Profile). Tapping a tab paints that saved picture
// right away. New items still refresh in the background. Signing out
// erases it. Edits (Home layout, Profile order) are saved here too so
// your arrangement is waiting the next time you open the tab.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createTabSnapshotMemory,
  type TabSnapBag,
  type TabSnapKey
} from './tab-snapshots.math';

const STORAGE_PREFIX = 'bridger.tabSnap.';

const store = createTabSnapshotMemory();

/** Whose snapshots these are (user id, or "demo"). */
let ownerKey = '';

/** True after we finished reading this owner's bag from the phone. */
let readyOwner = '';

/** After the first paint, later remounts should not replay fade-ins. */
let entersSettled = false;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function storageKey(owner = ownerKey): string {
  return `${STORAGE_PREFIX}${owner || 'anon'}`;
}

// THIS SECTION DOES: write the bag to the phone a moment after the last change
// so we do not hit storage on every tiny update.
function schedulePersist(): void {
  if (!ownerKey) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const key = storageKey();
    const bag = store.serialize();
    void AsyncStorage.setItem(key, JSON.stringify(bag)).catch(() => {
      // Best-effort: memory still has the last picture for this session.
    });
  }, 250);
}

/** Read the last picture of a tab. Instant (no waiting). */
export function getTabSnapshot<T>(key: TabSnapKey): T | undefined {
  return store.get<T>(key);
}

/** True when we already showed this tab at least once. */
export function hasTabSnapshot(key: TabSnapKey): boolean {
  return store.has(key);
}

/** Save the latest picture of a tab (memory + phone). */
export function setTabSnapshot<T>(key: TabSnapKey, data: T): void {
  store.set(key, data);
  schedulePersist();
}

/** True after the first tab paint, so remounts skip the "arrive" motion. */
export function areTabEntersSettled(): boolean {
  return entersSettled;
}

/** Call once after the tab shell is up so later remounts stay still. */
export function markTabEntersSettled(): void {
  entersSettled = true;
}

/**
 * Skip fade/peel when we already showed this tab, or the first paint
 * already finished. First-ever visit with no snapshot still animates.
 */
export function skipTabEnterAnimation(key?: TabSnapKey): boolean {
  if (entersSettled) return true;
  return key ? store.has(key) : false;
}

/** True when this owner's bag is already in memory. */
export function isTabSnapshotsReady(owner: string): boolean {
  return readyOwner === owner;
}

/**
 * Load this person's last tab pictures from the phone. Call before the
 * tab screens mount so they can paint from memory on the first frame.
 */
export async function hydrateTabSnapshots(owner: string): Promise<void> {
  if (!owner) return;
  if (readyOwner === owner) return;

  ownerKey = owner;
  entersSettled = false;
  store.clear();

  try {
    const raw = await AsyncStorage.getItem(storageKey(owner));
    if (raw) {
      const parsed = JSON.parse(raw) as TabSnapBag;
      if (parsed && typeof parsed === 'object') {
        store.loadBag(parsed);
      }
    }
  } catch {
    // Corrupt bag: start empty and let the live refresh fill it.
  }

  readyOwner = owner;
}

/** Wipe tab pictures (sign-out, leave demo, switch accounts). */
export async function clearTabSnapshots(): Promise<void> {
  const previousOwner = ownerKey;
  store.clear();
  ownerKey = '';
  readyOwner = '';
  entersSettled = false;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (!previousOwner) return;
  try {
    await AsyncStorage.removeItem(storageKey(previousOwner));
  } catch {
    // Memory is already empty.
  }
}
