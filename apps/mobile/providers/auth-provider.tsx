// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the app's "who is logged in?" memory. It wraps the whole app and keeps
// track of the current login session. Any screen can call useAuth() to know if
// someone is signed in, get their user id, or sign in / sign up / sign out —
// with a phone code, email, Google, or Apple.
//
// It listens to Supabase for login changes, so if the token refreshes or the
// user logs out on another screen, everything updates automatically.
// ============================================
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { signInWithApple as oauthApple, signInWithGoogle as oauthGoogle } from '../lib/oauth';
import { clearSessionCaches } from '../lib/session-caches';

// --- The shape of what every screen can use ---
type AuthContextValue = {
  session: Session | null;
  user: User | null;
  // `loading` is true only while we check for a saved session at startup.
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null; cancelled?: boolean }>;
  signInWithApple: () => Promise<{ error: string | null; cancelled?: boolean }>;
  /** Send a one-time SMS code to this E.164 number. */
  sendPhoneCode: (phoneE164: string) => Promise<{ error: string | null }>;
  /** Confirm the SMS code and create / restore the session. */
  verifyPhoneCode: (
    phoneE164: string,
    token: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- On startup: load any saved session from the device ---
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // --- Then keep listening for login/logout/refresh for the app's lifetime ---
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // PRIVACY: only wipe on a real sign-out (not the boot "no session yet" event).
      if (event === 'SIGNED_OUT') {
        void clearSessionCaches();
      }
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      // --- Email + password sign-in ---
      signInWithEmail: async (email, password) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'This build is missing Supabase settings. Use demo (long-press the logo) or rebuild with EAS env.'
          };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      // --- Email + password sign-up (they may need to confirm via email) ---
      signUpWithEmail: async (email, password) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'This build is missing Supabase settings. Use demo (long-press the logo) or rebuild with EAS env.'
          };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      // --- Google / Apple: real OAuth (see lib/oauth.ts) ---
      signInWithGoogle: () => oauthGoogle(),
      signInWithApple: () => oauthApple(),
      // --- Phone: send a one-time SMS code (Supabase Auth). ---
      sendPhoneCode: async (phoneE164) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'This build is missing Supabase settings. Use demo (long-press the logo) or rebuild with EAS env.'
          };
        }
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
        return { error: error?.message ?? null };
      },
      // --- Phone: check the SMS code and start the session. ---
      verifyPhoneCode: async (phoneE164, token) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'This build is missing Supabase settings. Use demo (long-press the logo) or rebuild with EAS env.'
          };
        }
        const { error } = await supabase.auth.verifyOtp({
          phone: phoneE164,
          token,
          type: 'sms'
        });
        return { error: error?.message ?? null };
      },
      // --- Log out and clear the saved session ---
      signOut: async () => {
        await supabase.auth.signOut();
        await clearSessionCaches();
      }
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- The hook screens use. Throws if used outside the provider (a wiring bug). ---
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
