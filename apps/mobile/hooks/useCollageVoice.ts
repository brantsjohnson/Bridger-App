// ============================================
// WHAT THIS FILE DOES (plain English):
// Plays a voice note that lives on a collage page. One player is shared so
// tapping a new chip stops the last one. Words are never logged.
// ============================================
import { useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

export function useCollageVoice() {
  const player = useAudioPlayer(null);
  const lastUri = useRef<string | null>(null);

  const play = useCallback(
    (uri?: string) => {
      if (!uri) return;
      try {
        if (lastUri.current === uri) {
          if (player.playing) {
            player.pause();
            return;
          }
          void player.seekTo(0);
          player.play();
          return;
        }
        lastUri.current = uri;
        player.replace({ uri });
        player.play();
      } catch {
        // Player not ready on this platform yet.
      }
    },
    [player]
  );

  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {
      // already stopped
    }
  }, [player]);

  useEffect(
    () => () => {
      try {
        player.pause();
      } catch {
        // unmount
      }
    },
    [player]
  );

  return { play, stop };
}
