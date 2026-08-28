// ============================================
// WHAT THIS FILE DOES (plain English):
// The Google and Apple "Continue with…" flows. They open the real Google/Apple
// login (in a secure browser sheet on phones, or the browser on web), then hand
// the result back to Supabase so we get a Bridger session.
//
// On iOS, Apple uses the native Sign in with Apple sheet (required by Apple and
// nicer for the user). Everywhere else, Apple and Google use the same OAuth
// browser flow.
//
// SECURITY: tokens never leave the device except to Supabase Auth. The redirect
// URL must be allow-listed in the Supabase dashboard (bridger://**).
// ============================================
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from './supabase';

// --- Needed on web so the OAuth popup can finish and close cleanly ---
WebBrowser.maybeCompleteAuthSession();

/** Where Google/Apple should send the user after they approve. Uses our app scheme. */
export const authRedirectTo = makeRedirectUri({
  scheme: 'bridger',
  path: 'auth/callback'
});

/** Turn the redirect URL (with tokens in it) into a real Supabase session. */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    return { error: errorCode };
  }

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) {
    return { error: null };
  }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token
  });
  return { error: error?.message ?? null };
}

/** Shared browser OAuth path used by Google (all platforms) and Apple (web/Android). */
async function signInWithOAuthProvider(provider: Provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authRedirectTo,
      skipBrowserRedirect: true
    }
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Could not start sign-in. Try again.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectTo);
  if (result.type !== 'success') {
    // User closed the sheet — not an error to shout about.
    return { error: null, cancelled: true as const };
  }
  return createSessionFromUrl(result.url);
}

export async function signInWithGoogle() {
  return signInWithOAuthProvider('google');
}

/**
 * Read the name + photo that Google (or Apple) handed us at sign-in.
 *
 * WHAT THIS DOES (plain English): after someone continues with Google, their
 * Google account already knows their name and profile picture. This grabs those
 * from the signed-in session so onboarding can pre-fill the "Confirm your
 * details" screen instead of making them retype everything.
 *
 * The name can arrive as separate given/family names or as one full name, and
 * the photo can be under `avatar_url` (Google) or `picture` (some providers),
 * so we check each spot and fall back gracefully when a field is missing.
 */
export async function getOAuthProfilePrefill(): Promise<{
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}> {
  const { data } = await supabase.auth.getUser();
  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;

  const str = (key: string) =>
    typeof meta[key] === 'string' ? (meta[key] as string).trim() : '';

  // Prefer the split names Google usually provides; otherwise split the full name.
  let firstName = str('given_name');
  let lastName = str('family_name');
  const fullName = str('full_name') || str('name');
  if (!firstName && !lastName && fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ');
  }

  const avatarUrl = str('avatar_url') || str('picture') || null;
  return { firstName, lastName, avatarUrl };
}

/**
 * Apple: native sheet on iOS, OAuth browser elsewhere.
 * Native path uses a one-time nonce so the token can't be replayed.
 */
export async function signInWithApple() {
  if (Platform.OS === 'ios') {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return { error: 'Sign in with Apple is not available on this device.' };
    }

    // --- SECURITY: random nonce, hashed before Apple sees it ---
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ],
        nonce: hashedNonce
      });

      if (!credential.identityToken) {
        return { error: 'Apple did not return a sign-in token.' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce
      });
      return { error: error?.message ?? null };
    } catch (e: unknown) {
      // Apple throws when the user cancels — treat that as a quiet cancel.
      const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        return { error: null, cancelled: true as const };
      }
      return { error: e instanceof Error ? e.message : 'Apple sign-in failed.' };
    }
  }

  return signInWithOAuthProvider('apple');
}
