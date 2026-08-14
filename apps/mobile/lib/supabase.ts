// ============================================
// WHAT THIS FILE DOES (plain English):
// Creates the app's single connection to Supabase (our backend). The app talks
// to Supabase with the PUBLISHABLE key, which is safe to ship because the
// database's row-level security is what actually protects data.
//
// It also remembers you're logged in between app launches: the login session is
// saved on the device (AsyncStorage) and the token is refreshed automatically so
// you don't get kicked out. On phones we start/stop that auto-refresh with the
// app's foreground/background state, which is the pattern Supabase recommends.
//
// SECURITY: never throw at import time. A missing key used to crash TestFlight
// before any screen painted. We warn and use placeholders so Sign in / demo
// unlock can still open; real auth fails with a clear message until EAS env
// has the public URL + publishable key.
// ============================================
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@bridger/shared';

// --- Read the public settings the app is allowed to see (EXPO_PUBLIC_*) ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

/** True when this build was shipped with real public Supabase settings. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[bridger] Supabase public URL/key missing in this build. Sign-in will not work until EAS env is set. Demo unlock still works.'
  );
}

// Placeholders keep createClient happy when env was stripped from the store build.
const url = isSupabaseConfigured ? supabaseUrl : 'https://example.supabase.co';
const key = isSupabaseConfigured
  ? supabasePublishableKey
  : 'sb_publishable_missing_configure_eas_env';

// --- The typed client. `Database` gives us column/enum autocomplete + safety. ---
export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On native there is no URL to read a session from; on web we also use
    // email sign-in for now, so leave detection off (revisit for OAuth links).
    detectSessionInUrl: false
  }
});

// --- Keep token auto-refresh tied to app foreground state (native only) ---
if (Platform.OS !== 'web' && isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
