// ============================================
// WHAT THIS FILE DOES (plain English):
// The countdown behind the splash-screen CTA on Events and Discover. The
// button "charges up" for 15 seconds TOTAL before it can be tapped. The clock
// only runs while the person is actually looking at the splash: leave after
// 5 seconds and the next visit resumes with 10 seconds left (saved on the
// device). Once it hits zero it stays done forever.
// ============================================
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use Expo Router's re-export (not @react-navigation/native directly). That
// package is not a top-level app dependency, so Metro cannot resolve it.
import { useIsFocused } from 'expo-router';

/** How long the CTA charges before it can be tapped (15 seconds total). */
export const GATE_CTA_TOTAL_MS = 15000;

/** Save at most once a second so we do not hammer device storage. */
const PERSIST_EVERY_MS = 1000;
/** Update the bar often enough to look smooth. */
const TICK_MS = 100;

export function useGateProgress(storageKey: string, totalMs: number = GATE_CTA_TOTAL_MS): {
  /** True once the saved remaining time has been read from the device. */
  ready: boolean;
  /** 0 → 1 how full the loading bar should be. */
  progress: number;
  /** True when the 15 cumulative seconds are used up and the CTA is tappable. */
  done: boolean;
} {
  // THIS SECTION DOES: only count time while this tab is the one on screen
  // (tab screens stay mounted in the background, so mount alone is not enough).
  const focused = useIsFocused();

  // THIS SECTION DOES: remember how many milliseconds are still left.
  // null = still reading the saved value from the device.
  const [remaining, setRemaining] = useState<number | null>(null);
  const remainingRef = useRef<number | null>(null);
  remainingRef.current = remaining;

  // THIS SECTION DOES: load the saved countdown once (first visit = full 15s).
  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (cancelled) return;
      const parsed = raw == null ? totalMs : Number.parseInt(raw, 10);
      const safe = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), totalMs) : totalMs;
      setRemaining(safe);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, totalMs]);

  // THIS SECTION DOES: tick the countdown while the splash is on screen, and
  // save the remaining time every second AND when the person leaves, so the
  // clock picks up where it stopped next visit.
  useEffect(() => {
    if (!focused) return;
    if (remainingRef.current == null || remainingRef.current <= 0) return;

    const startedAt = Date.now();
    const startRemaining = remainingRef.current;
    let lastPersist = 0;

    const id = setInterval(() => {
      const left = Math.max(0, startRemaining - (Date.now() - startedAt));
      setRemaining(left);
      const now = Date.now();
      if (left === 0 || now - lastPersist >= PERSIST_EVERY_MS) {
        lastPersist = now;
        void AsyncStorage.setItem(storageKey, String(left));
      }
      if (left === 0) clearInterval(id);
    }, TICK_MS);

    return () => {
      clearInterval(id);
      // Save the exact leftover on the way out (tab switch, close, unmount).
      const left = Math.max(0, startRemaining - (Date.now() - startedAt));
      void AsyncStorage.setItem(storageKey, String(left));
    };
    // Restart the ticking whenever the person comes back to this screen.
    // remaining==null → not loaded yet; effect re-runs once it loads.
  }, [focused, storageKey, remaining == null]);

  const ready = remaining != null;
  const done = ready && remaining <= 0;
  const progress = ready ? 1 - Math.min(Math.max(remaining / totalMs, 0), 1) : 0;

  return { ready, progress, done };
}
