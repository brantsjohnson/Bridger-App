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
  Stack,
  ThemeProvider,
  usePathname,
  useRouter,
  useSegments
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
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
  isDemoMode
} from '../lib/demo';
import { resolveJnameReferral } from '../lib/jname-api';
import { takePendingReferral } from '../lib/jname-referral';
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
  const [loaded, error] = useFonts({
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
  const [demoReady, setDemoReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void (async () => {
      await hydrateDemoMode();
      // LOCAL PREVIEW: leave any leftover long-press demo so Welcome can play.
      if (process.env.EXPO_PUBLIC_FORCE_WELCOME === '1') {
        await disableDemoMode();
      }
      setDemoReady(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded && demoReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, demoReady]);

  if (!loaded || !demoReady) {
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

  useEffect(() => {
    if (!session?.user?.id) {
      setAccessGranted(true);
      return;
    }
    void (async () => {
      const done = isOnboardingCompleteCached() || (await getOnboardingComplete());
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
    if (loading || !welcomeReady || !onbReady || !accessReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inInviteAccess = segments[0] === 'invite-access';
    if (segments[0] === 'q') return;
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
        router.replace('/onboarding');
        return;
      }
      if (demoDone && !accessGranted && !inInviteAccess) {
        router.replace('/invite-access');
        return;
      }
      if (demoDone && accessGranted && inInviteAccess) {
        router.replace('/home');
        return;
      }
      if (demoDone && (inAuthGroup || inOnboarding)) {
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
// friend's shared J-name link before making an account, connect them to that
// friend now (then forget the link). No-op when there is nothing pending.
function JnameReferralSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const token = await takePendingReferral();
      if (token) await resolveJnameReferral({ token });
    })();
  }, [user?.id]);
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
            name="quiz/[slug]"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          {/* Public shared J-name result (opens in app if installed, else web). */}
          <Stack.Screen name="q/[token]" options={{ headerShown: false }} />
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
  }, [pathname]);
}
