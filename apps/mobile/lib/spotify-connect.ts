// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens Spotify's "allow Bridger to see your music" screen in a secure browser
// sheet, then comes back to the app when Nest finishes storing the tokens.
// This is account linking — it does NOT sign you into Bridger with Spotify.
// ============================================
import * as WebBrowser from 'expo-web-browser';
import { beginSpotifyConnect } from '../data/music';

WebBrowser.maybeCompleteAuthSession();

const RETURN_PREFIX = 'bridger://music/spotify/connected';

/**
 * Run the Spotify connect flow. Resolves with ok=true when Nest stored tokens.
 */
export async function connectSpotifyAccount(): Promise<{
  ok: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  const { url } = await beginSpotifyConnect();

  // Demo mode returns a deep link directly (no browser).
  if (url.startsWith('bridger://')) {
    return parseReturn(url);
  }

  const result = await WebBrowser.openAuthSessionAsync(url, RETURN_PREFIX);
  if (result.type !== 'success' || !result.url) {
    return { ok: false, cancelled: true };
  }
  return parseReturn(result.url);
}

function parseReturn(url: string): { ok: boolean; error?: string } {
  try {
    const u = new URL(url.replace(/^bridger:\/\//, 'https://bridger.app/'));
    const ok = u.searchParams.get('ok') === '1';
    const error = u.searchParams.get('error') ?? undefined;
    return ok ? { ok: true } : { ok: false, error: error ?? 'connect_failed' };
  } catch {
    return { ok: false, error: 'bad_return' };
  }
}
