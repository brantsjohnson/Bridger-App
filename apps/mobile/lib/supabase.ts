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
// ============================================
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@bridger/shared';

// --- Read the public settings the app is allowed to see (EXPO_PUBLIC_*) ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// --- Fail loudly in dev if the .env wasn't set, instead of silent breakage ---
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Check apps/mobile/.env'
  );
}

// --- The typed client. `Database` gives us column/enum autocomplete + safety. ---
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
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
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
