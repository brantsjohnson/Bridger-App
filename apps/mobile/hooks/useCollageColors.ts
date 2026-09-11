// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers the custom colors you mix in the collage editor (both for text and
// for the page background), so they show up as quick-tap swatches next time.
// The list lives only on this phone (AsyncStorage), newest first, capped so it
// never grows forever. Nothing here talks to a server or to AI.
// ============================================
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One shared bucket of mixed colors for the whole collage tool.
const KEY = 'bridger.collage.customColors.v1';
const MAX = 16;

export function useCollageColors() {
  const [recents, setRecents] = useState<string[]>([]);
  const recentsRef = useRef<string[]>([]);
  recentsRef.current = recents;

  // THIS SECTION DOES: load the saved colors once when the tool opens.
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (!alive || !raw) return;
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) setRecents(list.filter((c) => typeof c === 'string').slice(0, MAX));
      } catch {
        // A corrupt list is not worth a crash; just start empty.
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // THIS SECTION DOES: add a freshly mixed color to the front, no duplicates.
  const remember = useCallback((hex: string) => {
    const clean = (hex ?? '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(clean)) return;
    const next = [clean, ...recentsRef.current.filter((c) => c.toUpperCase() !== clean)].slice(0, MAX);
    setRecents(next);
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  return { recents, remember };
}
