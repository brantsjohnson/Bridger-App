// ============================================
// WHAT THIS FILE DOES (plain English):
// The in-memory "last picture of each tab" box. Hooks read this instantly
// so a tab does not start empty. Saving to the phone happens in the
// wrapper file (that one talks to AsyncStorage).
// ============================================

export type TabSnapKey = string;

export type TabSnapEnvelope = {
  savedAt: number;
  data: unknown;
};

export type TabSnapBag = Record<TabSnapKey, TabSnapEnvelope>;

/** Make an empty snapshot box (used by the live store and by tests). */
export function createTabSnapshotMemory() {
  const memory = new Map<TabSnapKey, TabSnapEnvelope>();

  // THIS SECTION DOES: read what we last showed on a tab (or nothing).
  function get<T>(key: TabSnapKey): T | undefined {
    const env = memory.get(key);
    return env ? (env.data as T) : undefined;
  }

  // THIS SECTION DOES: remember we have something for this tab.
  function has(key: TabSnapKey): boolean {
    return memory.has(key);
  }

  // THIS SECTION DOES: write the latest picture of a tab into memory.
  function set<T>(key: TabSnapKey, data: T, savedAt = Date.now()): void {
    memory.set(key, { savedAt, data });
  }

  // THIS SECTION DOES: wipe every tab picture (sign-out / account switch).
  function clear(): void {
    memory.clear();
  }

  // THIS SECTION DOES: dump memory into a plain object we can save on the phone.
  function serialize(): TabSnapBag {
    const bag: TabSnapBag = {};
    for (const [key, env] of memory) {
      bag[key] = env;
    }
    return bag;
  }

  // THIS SECTION DOES: fill memory from a saved bag (app reopen).
  function loadBag(bag: TabSnapBag): void {
    memory.clear();
    for (const [key, env] of Object.entries(bag)) {
      if (!env || typeof env !== 'object') continue;
      if (typeof env.savedAt !== 'number') continue;
      memory.set(key, { savedAt: env.savedAt, data: env.data });
    }
  }

  return { get, has, set, clear, serialize, loadBag };
}
