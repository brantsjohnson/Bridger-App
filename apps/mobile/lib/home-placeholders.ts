// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers which Home "Example" placeholders you already tapped. Empty
// sections (This week, Notifications) show a seeded demo Example until you
// open that area; after that the section stays hidden until real content
// arrives. Stored on the device so it survives app restarts.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Home sections that can show a one-time Example card when empty. */
export type HomePlaceholderSection = 'event' | 'alerts';

/** Device key prefix: one flag per section. */
const KEY_PREFIX = 'bridger.home.placeholder.';

function keyFor(section: HomePlaceholderSection): string {
  return `${KEY_PREFIX}${section}`;
}

// THIS SECTION DOES: ask the phone if this Example was already tapped away.
export async function hasDismissedPlaceholder(
  section: HomePlaceholderSection
): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(keyFor(section));
    return v === '1';
  } catch {
    return false;
  }
}

// THIS SECTION DOES: mark the Example dismissed so Home hides that section
// until real content exists.
export async function markPlaceholderDismissed(
  section: HomePlaceholderSection
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(section), '1');
  } catch {
    // Storage failure must not block navigating away from the Example.
  }
}

// THIS SECTION DOES: load every section's dismissed flag in one pass for Home.
export async function loadPlaceholderDismissals(): Promise<
  Record<HomePlaceholderSection, boolean>
> {
  const sections: HomePlaceholderSection[] = ['event', 'alerts'];
  const entries = await Promise.all(
    sections.map(async (s) => [s, await hasDismissedPlaceholder(s)] as const)
  );
  return {
    event: entries.find(([s]) => s === 'event')?.[1] ?? false,
    alerts: entries.find(([s]) => s === 'alerts')?.[1] ?? false
  };
}
