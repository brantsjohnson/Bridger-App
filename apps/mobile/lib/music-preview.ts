// ============================================
// WHAT THIS FILE DOES (plain English):
// One shared ~30s Spotify preview player for the whole app. Only one preview
// plays at a time so two profile tiles never talk over each other.
// Uses expo-audio (same stack as Recap). Respects stop-on-unmount callers.
// ============================================
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

let player: AudioPlayer | null = null;
let currentUrl: string | null = null;
const listeners = new Set<(playingUrl: string | null) => void>();

function notify(url: string | null) {
  for (const fn of listeners) fn(url);
}

export function subscribeMusicPreview(fn: (playingUrl: string | null) => void) {
  listeners.add(fn);
  fn(currentUrl);
  return () => {
    listeners.delete(fn);
  };
}

export function getPlayingPreviewUrl(): string | null {
  return currentUrl;
}

/** Play or pause this preview URL. Returns whether it is now playing. */
export async function toggleMusicPreview(url: string): Promise<boolean> {
  if (!url) return false;

  if (currentUrl === url && player) {
    if (player.playing) {
      player.pause();
      currentUrl = null;
      notify(null);
      return false;
    }
    player.play();
    currentUrl = url;
    notify(url);
    return true;
  }

  stopMusicPreview();
  player = createAudioPlayer({ uri: url });
  currentUrl = url;
  player.play();
  notify(url);
  return true;
}

export function stopMusicPreview() {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // player already torn down
    }
    player = null;
  }
  currentUrl = null;
  notify(null);
}
