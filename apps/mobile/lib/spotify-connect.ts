// ============================================
// WHAT THIS FILE DOES (plain English):
// Opens Spotify's "allow Bridger to see your music" screen in a secure browser
// sheet, then comes back to the app when Nest finishes storing the tokens.
// This is account linking — it does NOT sign you into Bridger with Spotify.
//
// If the system Safari sheet fails (common TestFlight "can't connect to Safari"
// error), we fall back to a plain in-app browser so they can still Agree.
// After that fallback, we poll Nest for "is Spotify linked?" because the
// browser path does not hand us the return URL the way the auth sheet does.
// ============================================
import { Alert, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { beginSpotifyConnect, fetchMusicStatus } from '../data/music';

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
  let url: string;
  try {
    ({ url } = await beginSpotifyConnect());
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not start Spotify connect.';
    Alert.alert(
      'Could not link Spotify',
      `${msg} You can type your song below instead.`
    );
    return { ok: false, error: 'begin_failed' };
  }

  // Demo mode returns a deep link directly (no browser).
  if (url.startsWith('bridger://')) {
    return parseReturn(url);
  }

  // THIS SECTION DOES: refuse to open Safari when Nest still handed us a
  // laptop-only redirect (127.0.0.1). That page can never load on a phone.
  if (authorizeUsesLoopbackRedirect(url)) {
    Alert.alert(
      'Spotify is not ready',
      'Connect Spotify needs the public API address set up. You can type your song below instead.'
    );
    return { ok: false, error: 'loopback_redirect' };
  }

  // THIS SECTION DOES: try the secure auth sheet first, then a plain browser
  // if iOS refuses Safari (TestFlight "can't connect to Safari" errors).
  try {
    const result = await WebBrowser.openAuthSessionAsync(url, RETURN_PREFIX, {
      // Prefer ephemeral so a stuck Safari session does not block Agree.
      preferEphemeralSession: Platform.OS === 'ios',
      showInRecents: true
    });
    if (result.type === 'success' && result.url) {
      return parseReturn(result.url);
    }
    if (result.type === 'cancel' || result.type === 'dismiss') {
      // Auth sheet closed: still check Nest in case Agree already wrote tokens.
      if (await confirmSpotifyLinked({ afterCloseAttempts: 4 })) {
        return { ok: true };
      }
      return { ok: false, cancelled: true };
    }
  } catch (err) {
    console.warn('[spotify-connect] openAuthSessionAsync failed; trying browser', err);
  }

  // THIS SECTION DOES: plain in-app browser when the Safari auth sheet cannot
  // open. Nest still redirects to bridger:// after Agree, so we listen + poll
  // the whole time the browser is open (not a fixed short timeout).
  try {
    const watch = startSpotifyLinkWatch();
    try {
      await WebBrowser.openBrowserAsync(url, {
        enableDefaultShareMenuItem: false,
        showInRecents: true
      });
    } finally {
      watch.stop();
    }
    if (watch.linked() || (await confirmSpotifyLinked({ afterCloseAttempts: 6 }))) {
      return { ok: true };
    }
    return { ok: false, cancelled: true };
  } catch (err) {
    console.warn('[spotify-connect] openBrowserAsync failed; Linking fallback', err);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        const watch = startSpotifyLinkWatch();
        try {
          await Linking.openURL(url);
          // External Safari: give Agree time to land, then confirm.
          await sleep(1500);
        } finally {
          watch.stop();
        }
        if (watch.linked() || (await confirmSpotifyLinked({ afterCloseAttempts: 8 }))) {
          return { ok: true };
        }
        return { ok: false, cancelled: true };
      }
    } catch {
      // fall through to alert
    }
    Alert.alert(
      'Could not open Spotify',
      'Your phone could not open the Spotify allow screen. Type your song below instead, or try again from Settings.'
    );
    return { ok: false, error: 'safari_unavailable' };
  }
}

/**
 * Poll Nest (+ deep link) while the browser is open. Call stop() when it closes.
 */
function startSpotifyLinkWatch(): {
  stop: () => void;
  linked: () => boolean;
} {
  let deepOk = false;
  let statusOk = false;
  let stopped = false;

  const sub = Linking.addEventListener('url', (e) => {
    if (e.url.includes('music/spotify/connected') && e.url.includes('ok=1')) {
      deepOk = true;
    }
  });

  const tick = async () => {
    while (!stopped) {
      if (deepOk || statusOk) return;
      try {
        const s = await fetchMusicStatus();
        if (s.spotify) {
          statusOk = true;
          return;
        }
      } catch {
        // keep polling
      }
      await sleep(500);
    }
  };
  void tick();

  return {
    stop: () => {
      stopped = true;
      sub.remove();
    },
    linked: () => deepOk || statusOk
  };
}

/** A few status checks after the browser closes (deep link can land late). */
async function confirmSpotifyLinked(opts: {
  afterCloseAttempts: number;
}): Promise<boolean> {
  for (let i = 0; i < opts.afterCloseAttempts; i++) {
    try {
      const s = await fetchMusicStatus();
      if (s.spotify) return true;
    } catch {
      // keep trying
    }
    await sleep(400);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when Spotify's authorize URL would send Agree back to this laptop. */
function authorizeUsesLoopbackRedirect(authorizeUrl: string): boolean {
  try {
    const u = new URL(authorizeUrl);
    const redirect = u.searchParams.get('redirect_uri');
    if (!redirect) return false;
    const host = new URL(redirect).hostname.toLowerCase();
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  } catch {
    return false;
  }
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
