// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers how fast you like to listen to the weekly recap. When you slide the
// speed up (say to 2×), we save that number on the phone so it stays your
// default for every person in the listen, and it is still there next time you
// open the recap, even next week. (Stored with AsyncStorage on the device.)
//
// PRIVACY: this is a single number on your own phone. It never goes to a server
// and is never part of analytics.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// THIS SECTION DOES: the one place we keep the saved speed under.
const KEY = 'bridger.recap.speed';

// THIS SECTION DOES: the allowed range — normal speed up to two-and-a-half times.
export const RECAP_SPEED_MIN = 1;
export const RECAP_SPEED_MAX = 2.5;
/** The speed we start everyone at before they ever change it. */
export const RECAP_SPEED_DEFAULT = 1;

// THIS SECTION DOES: keep any speed inside the allowed range and rounded to a
// clean one-decimal step (1.0, 1.1 … 2.5) so the label never shows 1.7333.
export function clampRecapSpeed(value: number): number {
  if (!Number.isFinite(value)) return RECAP_SPEED_DEFAULT;
  const stepped = Math.round(value * 10) / 10;
  return Math.min(RECAP_SPEED_MAX, Math.max(RECAP_SPEED_MIN, stepped));
}

// THIS SECTION DOES: turn a speed into the little label on the pill (1×, 1.5×).
export function formatRecapSpeed(value: number): string {
  const v = clampRecapSpeed(value);
  // Drop a trailing .0 so 1.0 reads as "1×", but keep 1.5 as "1.5×".
  const text = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return `${text}×`;
}

// THIS SECTION DOES: read the speed you saved last time (or the default).
export async function loadRecapSpeed(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw == null) return RECAP_SPEED_DEFAULT;
    const parsed = Number(raw);
    return clampRecapSpeed(parsed);
  } catch {
    return RECAP_SPEED_DEFAULT;
  }
}

// THIS SECTION DOES: save the speed you just chose so it sticks next time.
export async function saveRecapSpeed(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(clampRecapSpeed(value)));
  } catch {
    // A storage failure must not stop playback from changing speed right now.
  }
}
