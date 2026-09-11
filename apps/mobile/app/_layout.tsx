// #region agent log
// TEMPORARY: debug instrumentation for the lag sweep (loads first to catch everything).
import '../lib/debug-instrumentation';
import { debugGuardRedirect, debugRouteChange } from '../lib/debug-instrumentation';
// #endregion
import 'react-native-gesture-handler';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold
} from '@expo-google-fonts/plus-jakarta-sans';
import { BigShouldersDisplay_900Black } from '@expo-google-fonts/big-shoulders-display';
import { Jersey20_400Regular } from '@expo-google-fonts/jersey-20';
import { Jersey25_400Regular } from '@expo-google-fonts/jersey-25';
import { AnonymousPro_700Bold } from '@expo-google-fonts/anonymous-pro';
import { Antonio_700Bold } from '@expo-google-fonts/antonio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme,
  DefaultTheme,
  type Href,
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
  useSegments
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// --- STYLING: loads Tailwind/NativeWind styles for the whole app (must be here, once) ---
import '../global.css';

import { registerAvatarPhotoResolver, GridColorProvider, useGridColor } from '@bridger/ui';

import { useColorScheme } from '@/components/useColorScheme';
import { WELCOME_SEEN_KEY } from '../content/welcome';
import {
  getOnboardingComplete,
  hydrateOnboardingComplete,
  isOnboardingCompleteCached
} from '../data/onboarding';
import { getInviteAccess, hydrateDemoAccess } from '../data/access';
import { DelightHost } from '../delight/_host/DelightHost';
import { bootstrapAnalytics } from '../lib/analytics-bootstrap';
import { syncAnalyticsSession } from '../lib/analytics-consent';
import { avatarPhotoFor } from '../lib/avatar-photo';
import {
  disableDemoMode,
  getDevPreview,
  hydrateDemoMode,
  hydrateOnboardingFlowVariant,
  isDemoMode
} from '../lib/demo';
import { resolveJnameReferral, saveJnameResult } from '../lib/jname-api';
import {
  getAnonRef,
  peekPendingReferral,
  setShowDuoToken,
  takePendingReferral,
  takeShowDuoToken
} from '../lib/jname-referral';
import {
  clearJnameGuestResult,
  loadJnameGuestResult
} from '../quizzes/what-j-name/guest-result';
import { setLiveJnameSessionResult } from '../data/quiz';
import { takePendingInvite } from '../lib/invite-pending';
import { redeemInvite } from '../data/invites';
import { loadPeople } from '../lib/people-cache';
import { trackProduct } from '@bridger/shared';
import { recordRoutePath } from '../lib/route-trail';
import { AuthProvider, useAuth } from '../providers/auth-provider';
import { BridgeLiveProvider, useBridgeLive } from '../providers/bridge-live-provider';
import { BillyVoiceProvider, useBillyVoice } from '../providers/billy-voice-provider';
import { PurchasesProvider } from '../providers/purchases-provider';
import { PartyCapturePromptSync } from '../components/story/PartyCapturePromptSync';
import { AgentIsland } from '../components/assistant/AgentIsland';
import { fetchAssistantSettings } from '../data/assistant';
import { apiFetch } from '../lib/api';

// Analytics: wire context + (dev) sink once. Capture stays opted-out until Settings.
bootstrapAnalytics();

// Photos: prefer a live signed avatar URL from the people cache. Demo mode
// may fall back to dropped-in assets; live mode never shows a stranger's face.
registerAvatarPhotoResolver((personId) => avatarPhotoFor(personId));

// Crashes show the Magic Patterns Windows 404 ("Error 404 / You're invited to suffer"), not Expo's
// black "Something went wrong" page. Missing routes still use +not-found.tsx.
export { AppErrorBoundary as ErrorBoundary } from '../components/AppErrorBoundary';

// App icon splash shown while fonts load and demo state hydrate (matches native splash).
const BOOT_ICON = require('../assets/images/icon.png');
const BOOT_ICON_SIZE = 240;

export const unstable_settings = {
  initialRouteName: '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // --- FONTS: the retro pixel header font + the clean body font (all weights).
  //     The app waits for these before showing anything, so text never "pops"
  //     from a fallback font to the real one.
  //     The last five are the collage-poster fonts used by the "What J-name are
  //     you?" result card (the image people save to their photos). They are
  //     loaded here, once, because the saved PNG has to look identical every
  //     time and a half-loaded font would ruin it. ---
  const [fontsLoaded, fontError] = useFonts({
    FeloniaPixel: require('../assets/fonts/FeloniaPixel.otf'),
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    BigShouldersDisplay_900Black,
    Jersey20_400Regular,
    Jersey25_400Regular,
    AnonymousPro_700Bold,
    Antonio_700Bold
  });
  // THIS SECTION DOES: read the saved demo flag before the auth gate runs.
  // Never leave the splash stuck if device storage is slow or throws.
  const [demoReady, setDemoReady] = useState(false);
  // Failsafe: if fonts never resolve, still leave the boot screen after 8s.
  const [fontsTimedOut, setFontsTimedOut] = useState(false);
  const fontsReady = fontsLoaded || fontsTimedOut;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  // Hide splash first so a font failure does not look like a frozen launch.
  useEffect(() => {
    if (fontsLoaded || fontError || fontsTimedOut) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, fontsTimedOut]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const t = setTimeout(() => {
      console.warn('[boot] fonts timed out; continuing with fallbacks');
      setFontsTimedOut(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    let cancelled = false;
    // Failsafe: if hydrate hangs, still open the app after 2.5s.
    const failsafe = setTimeout(() => {
      if (!cancelled) setDemoReady(true);
    }, 2500);

    void (async () => {
      try {
        await hydrateDemoMode();
        await hydrateOnboardingFlowVariant();
        // LOCAL PREVIEW: leave any leftover long-press demo so Welcome can play.
        if (process.env.EXPO_PUBLIC_FORCE_WELCOME === '1') {
          await disableDemoMode();
        }
      } catch (err) {
        console.warn('[boot] demo hydrate failed; continuing', err);
      } finally {
        if (!cancelled) setDemoReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    if (fontsReady && demoReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, demoReady]);

  if (!fontsReady || !demoReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        accessibilityIgnoresInvertColors
      >
        <Image
          source={BOOT_ICON}
          resizeMode="contain"
          style={{ width: BOOT_ICON_SIZE, height: BOOT_ICON_SIZE }}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  // --- Everything below can now ask "who is logged in?" via useAuth() ---
  // Gesture root: needed so Friends edit-mode drag-and-drop (and other pans) work.
  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%' }}>
      <AuthProvider>
        <PurchasesProvider>
          <BridgeLiveProvider>
            {/* Shared Billy mic lives above screens so listening survives navigation. */}
            <BillyVoiceProvider>
              {/* Personal grid tint from onboarding ColorStep wraps every Screen. */}
              <GridColorProvider>
                <RootLayoutNav />
              </GridColorProvider>
            </BillyVoiceProvider>
          </BridgeLiveProvider>
        </PurchasesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// --- DEMO MODE: skip sign-in when env forces it or the person unlocked via logo.
//     Preview / internal builds allow long-press unlock; production leaves it off. ---
// --- SECURITY: send signed-out people to Welcome / auth, and signed-in people to the app ---
function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [welcomeReady, setWelcomeReady] = useState(false);
  const [seenWelcome, setSeenWelcome] = useState(true);
  const [onbReady, setOnbReady] = useState(false);
  const [onbComplete, setOnbComplete] = useState(true);
  // THIS SECTION DOES: after login, wait for the server "finished onboarding?"
  // answer before sending anyone into the onboarding flow. A fresh install has
  // no local flag, so without this wait a returning person gets asked again.
  const [onbServerReady, setOnbServerReady] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [accessGranted, setAccessGranted] = useState(true);

  useEffect(() => {
    void (async () => {
      await hydrateDemoAccess();
      if (process.env.EXPO_PUBLIC_FORCE_WELCOME === '1') {
        await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
        setSeenWelcome(false);
        setWelcomeReady(true);
      } else {
        const v = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
        setSeenWelcome(v === '1');
        setWelcomeReady(true);
      }
      // SECURITY: startup reads only this device until authentication finishes.
      const done = await hydrateOnboardingComplete();
      setOnbComplete(done);
      setOnbReady(true);
      setAccessReady(true);
    })();
  }, []);

  // THIS SECTION DOES: once someone is signed in, ask the server if they already
  // finished onboarding (and whether they have invite access). Update the local
  // flag so a reinstall still skips the setup run.
  useEffect(() => {
    if (!session?.user?.id) {
      setAccessGranted(true);
      setOnbServerReady(true);
      return;
    }
    setOnbServerReady(false);
    void (async () => {
      const done = await getOnboardingComplete();
      setOnbComplete(done);
      setOnbServerReady(true);
      if (!done) {
        setAccessGranted(true);
        return;
      }
      try {
        const access = await getInviteAccess();
        setAccessGranted(access.accessGranted);
      } catch {
        setAccessGranted(true);
      }
    })();
  }, [session?.user?.id]);

  useEffect(() => {
    // Wait for the server onboarding check when signed in, so we never bounce a
    // returning account into onboarding off an empty device flag.
    if (loading || !welcomeReady || !onbReady || !accessReady) return;
    if (session && !onbServerReady) return;
    // THIS SECTION DOES: figure out which top-level route we are on
    // (CI has no local .expo typed routes, so treat segments as a plain string list).
    const routeSegments = segments as readonly string[];
    const inAuthGroup = routeSegments[0] === '(auth)';
    const inOnboarding = routeSegments[0] === 'onboarding';
    const inInviteAccess = routeSegments[0] === 'invite-access';
    if (routeSegments[0] === 'q') return;
    // Logged-out friends can take Which J name from a share link (no account).
    if (routeSegments[0] === 'quiz' && !session && routeSegments[1] !== 'preview-cards') {
      return;
    }
    // Let the invite link screen mount so it can either redeem now (signed in)
    // or stash the invite and route to sign-in itself (signed out).
    if (segments[0] === 'invite') return;
    const done = isOnboardingCompleteCached() || onbComplete;

    if (isDemoMode()) {
      const preview = getDevPreview();
      // Dev preview: stay on CRT intro / sign-in or onboarding instead of Home,
      // but once the run is marked complete, let Let's Go leave.
      if (preview === 'crt' && inAuthGroup) return;
      if (preview === 'onboarding' && inOnboarding && !isOnboardingCompleteCached()) return;

      // In demo we trust the synchronous cache only, so the "onboard" bypass
      // (which just reset the flag) starts the run instead of bouncing to Home.
      const demoDone = isOnboardingCompleteCached();
      if (!demoDone && !inOnboarding) {
        // #region agent log
        debugGuardRedirect('/onboarding', 'demo not-done', segments.join('/'));
        // #endregion
        router.replace('/onboarding');
        return;
      }
      if (demoDone && !accessGranted && !inInviteAccess) {
        // #region agent log
        debugGuardRedirect('/invite-access', 'demo no-access', segments.join('/'));
        // #endregion
        router.replace('/invite-access');
        return;
      }
      if (demoDone && accessGranted && inInviteAccess) {
        // #region agent log
        debugGuardRedirect('/home', 'demo leave-invite-access', segments.join('/'));
        // #endregion
        router.replace('/home');
        return;
      }
      if (demoDone && (inAuthGroup || inOnboarding)) {
        // #region agent log
        debugGuardRedirect('/home', 'demo leave-auth-or-onboarding', segments.join('/'));
        // #endregion
        router.replace('/home');
      }
      return;
    }

    if (!session) {
      if (!seenWelcome && !inAuthGroup) {
        router.replace('/welcome');
        return;
      }
      if (seenWelcome && !inAuthGroup) {
        router.replace('/sign-in');
      }
      return;
    }

    if (!done && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }
    if (done && !accessGranted && !inInviteAccess) {
      router.replace('/invite-access');
      return;
    }
    if (done && accessGranted && inInviteAccess) {
      router.replace('/home');
      return;
    }
    if (done && accessGranted && (inAuthGroup || inOnboarding)) {
      router.replace('/home');
    }
  }, [
    session,
    loading,
    segments,
    router,
    welcomeReady,
    seenWelcome,
    onbReady,
    onbComplete,
    onbServerReady,
    accessReady,
    accessGranted
  ]);
}

function AnalyticsSessionSync() {
  const { user } = useAuth();
  useEffect(() => {
    void syncAnalyticsSession(user?.id ?? null);
  }, [user?.id]);
  return null;
}

// THIS SECTION DOES: after sign-in, load profileColor from settings and tint
// the drifting SynthGrid. Clears back to default purple when signed out.
function GridColorSync() {
  const { session } = useAuth();
  const { setGridColorHex } = useGridColor();

  useEffect(() => {
    if (!session?.user?.id) {
      setGridColorHex(null);
      return;
    }
    if (isDemoMode()) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await apiFetch<{ profileColor?: string | null }>('/me/settings');
        if (!cancelled) setGridColorHex(s.profileColor ?? null);
      } catch {
        if (!cancelled) setGridColorHex(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, setGridColorHex]);

  return null;
}

// THIS SECTION DOES: once someone is signed in, if they arrived by opening a
// friend's shared J-name link before making an account, upload their guest
// take, add that friend, then (after onboarding) open the duo result.
function JnameReferralSync() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      processedRef.current = null;
      return;
    }
    if (processedRef.current === user.id) return;
    processedRef.current = user.id;
    void (async () => {
      const guest = await loadJnameGuestResult();
      const pending = await peekPendingReferral();
      const token = pending ?? guest?.shareToken ?? null;
      if (token) await setShowDuoToken(token);

      if (guest?.jName) {
        await saveJnameResult({
          jName: guest.jName,
          percent: guest.percent,
          topNames: guest.topNames
        });
        setLiveJnameSessionResult({ jName: guest.jName, percent: guest.percent });
        await clearJnameGuestResult();
      }

      await takePendingReferral();
      const anonRef = await getAnonRef();
      if (!token && !anonRef) return;
      const res = await resolveJnameReferral({
        ...(token ? { token } : {}),
        anonRef
      });
      if (res.connected) {
        trackProduct('friend_added', { method: 'link' });
        if (!isDemoMode()) await loadPeople();
      }

      if (!token) return;
      const done = isOnboardingCompleteCached() || (await getOnboardingComplete());
      const root = segments[0];
      const blocked =
        root === 'onboarding' ||
        root === '(auth)' ||
        root === 'welcome' ||
        root === 'quiz';
      if (done && !blocked) {
        await takeShowDuoToken();
        router.replace({
          pathname: '/quiz/[slug]',
          params: { slug: 'what-j-name', share: token }
        } as Href);
      }
    })();
  }, [user?.id, router, segments]);

  // After setup is done, open the quiz so they see you-vs-them (the duo result).
  useEffect(() => {
    if (!user?.id) return;
    const root = segments[0];
    if (
      root === 'onboarding' ||
      root === '(auth)' ||
      root === 'welcome' ||
      root === 'quiz'
    ) {
      return;
    }
    void (async () => {
      const done = isOnboardingCompleteCached() || (await getOnboardingComplete());
      if (!done) return;
      const token = await takeShowDuoToken();
      if (!token) return;
      router.replace({
        pathname: '/quiz/[slug]',
        params: { slug: 'what-j-name', share: token }
      } as Href);
    })();
  }, [user?.id, segments, router]);

  return null;
}

// THIS SECTION DOES: once someone is signed in, if they opened a friend's
// "add me" invite link before making an account, redeem it now so the two of
// them become friends, then open the reveal. Waits until onboarding is done so
// we never interrupt setup. No-op when there is nothing pending.
function InviteRedeemSync() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const done = await getOnboardingComplete();
      if (!done) return;
      const raw = await takePendingInvite();
      if (!raw) return;
      try {
        const res = await redeemInvite(raw);
        trackProduct('friend_added', { method: res.method });
        if (!isDemoMode()) await loadPeople();
        router.push(`/reveal/${res.personId}`);
      } catch {
        // Expired or already connected — just drop it, no error to the user.
      }
    })();
  }, [user?.id, router]);
  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useProtectedRoute();
  useRouteTrail();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Restore this account's analytics choice (off until they opt in). */}
      <AnalyticsSessionSync />
      {/* Connect a fresh signup to the friend whose shared link brought them. */}
      <JnameReferralSync />
      {/* Finish a friend invite link that was opened before signing in. */}
      <InviteRedeemSync />
      {/* Load personal grid tint after auth so SynthGrid matches ColorStep. */}
      <GridColorSync />
      {/* Mid-party capture nudges when BeReal-like reminders are on. */}
      <PartyCapturePromptSync />
      {/* Delight gifts mount above navigation so they can play on any screen. */}
      <DelightHost />
      <View
        className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}
        style={{ width: '100%', height: '100%' }}
      >
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="invite-access" options={{ headerShown: false }} />
          <Stack.Screen name="person/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="pending/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="discover/connect-over" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="event/create"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="messages/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="messages/contact-card" options={{ headerShown: false }} />
          <Stack.Screen
            name="reveal/[id]"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="story/[id]"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="story/capture"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="collage/capture"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="collage/editor"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="collage/finish"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="quiz/[slug]"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          {/* Public shared J-name result (opens in app if installed, else web). */}
          <Stack.Screen name="q/[token]" options={{ headerShown: false }} />
          {/* Friend invite link: redeem + reveal (opens in app when installed). */}
          <Stack.Screen name="invite/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="recap/index" options={{ headerShown: false }} />
          <Stack.Screen name="activity/index" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile/customize" options={{ headerShown: false }} />
          <Stack.Screen
            name="assistant/index"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="coop/index" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/index" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/mission" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/model" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/ideas/index" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/ideas/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/vote" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/cost" options={{ headerShown: false }} />
          <Stack.Screen name="coop/portal/manage" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        {/* Billy Island: only when opted in, live, and not already on Home/Screen. */}
        <BridgeIslandHost />
      </View>
    </ThemeProvider>
  );
}

/** Shows the floating Billy capsule when work is live off Home. */
function BridgeIslandHost() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const { enabled, status, line, setEnabled } = useBridgeLive();
  const { hearing, liveTranscript, cancelListening } = useBillyVoice();

  useEffect(() => {
    // No session yet (Welcome / Sign in): Billy stays off. Don't call the API.
    if (!session) {
      setEnabled(false);
      return;
    }
    let cancelled = false;
    void fetchAssistantSettings()
      .then((s) => {
        if (!cancelled) setEnabled(Boolean(s.assistantEnabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, setEnabled]);

  const onHome =
    pathname === '/home' ||
    pathname === '/(tabs)/home' ||
    pathname?.endsWith('/home');
  const onAssistant = pathname?.includes('/assistant');

  if (!enabled || onHome || onAssistant) return null;

  return (
    <AgentIsland
      status={status}
      line={line || 'Billy'}
      hearing={hearing}
      transcript={liveTranscript}
      onStopListen={() => void cancelListening()}
      onOpen={() =>
        router.push({ pathname: '/assistant', params: { entry: 'island' } })
      }
    />
  );
}

/** Keep a short list of screens visited so a 404 can report the path. */
function useRouteTrail() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) recordRoutePath(pathname);
    // #region agent log
    if (pathname) debugRouteChange(pathname);
    // #endregion
  }, [pathname]);
}
