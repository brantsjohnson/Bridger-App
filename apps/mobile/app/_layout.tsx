import 'react-native-gesture-handler';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold
} from '@expo-google-fonts/plus-jakarta-sans';
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
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// --- STYLING: loads Tailwind/NativeWind styles for the whole app (must be here, once) ---
import '../global.css';

import { registerAvatarPhotoResolver } from '@bridger/ui';

import { useColorScheme } from '@/components/useColorScheme';
import { WELCOME_SEEN_KEY } from '../content/welcome';
import { getProfilePhoto } from '../data/fixtures/demo-media';
import { getOnboardingComplete, isOnboardingCompleteCached } from '../data/onboarding';
import { DelightHost } from '../delight/_host/DelightHost';
import { bootstrapAnalytics } from '../lib/analytics-bootstrap';
import { hydrateDemoMode, isDemoMode } from '../lib/demo';
import { recordRoutePath } from '../lib/route-trail';
import { AuthProvider, useAuth } from '../providers/auth-provider';
import { BridgeLiveProvider, useBridgeLive } from '../providers/bridge-live-provider';
import { BillyVoiceProvider, useBillyVoice } from '../providers/billy-voice-provider';
import { AgentIsland } from '../components/assistant/AgentIsland';
import { fetchAssistantSettings } from '../data/assistant';

// Analytics: wire context + (dev) sink once. Capture stays opted-out until Settings.
bootstrapAnalytics();

// Photos: let any <Avatar personId="..."> pull a person's dropped-in photo,
// so real faces appear everywhere (Friend Pod, Inside Jokes, rows, etc.).
registerAvatarPhotoResolver(getProfilePhoto);

// Crashes show the Magic Patterns Windows 404 ("Fucks not found."), not Expo's
// black "Something went wrong" page. Missing routes still use +not-found.tsx.
export { AppErrorBoundary as ErrorBoundary } from '../components/AppErrorBoundary';

export const unstable_settings = {
  initialRouteName: '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // --- FONTS: the retro pixel header font + the clean body font (all weights).
  //     The app waits for these before showing anything, so text never "pops"
  //     from a fallback font to the real one. ---
  const [loaded, error] = useFonts({
    FeloniaPixel: require('../assets/fonts/FeloniaPixel.otf'),
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold
  });
  // THIS SECTION DOES: read the saved demo flag before the auth gate runs.
  const [demoReady, setDemoReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void hydrateDemoMode().finally(() => setDemoReady(true));
  }, []);

  useEffect(() => {
    if (loaded && demoReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, demoReady]);

  if (!loaded || !demoReady) {
    return null;
  }

  // --- Everything below can now ask "who is logged in?" via useAuth() ---
  // Gesture root: needed so Friends edit-mode drag-and-drop (and other pans) work.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <BridgeLiveProvider>
          {/* Shared Billy mic lives above screens so listening survives navigation. */}
          <BillyVoiceProvider>
            <RootLayoutNav />
          </BillyVoiceProvider>
        </BridgeLiveProvider>
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
  // Onboarding gate: has this account finished the new-user run?
  const [onbReady, setOnbReady] = useState(false);
  const [onbComplete, setOnbComplete] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY).then((v) => {
      setSeenWelcome(v === '1');
      setWelcomeReady(true);
    });
    getOnboardingComplete().then((done) => {
      setOnbComplete(done);
      setOnbReady(true);
    });
  }, []);

  useEffect(() => {
    if (loading || !welcomeReady || !onbReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    // Prefer the synchronous cache so the moment welcome-in sets the flag, the
    // gate lets the person into the app instead of bouncing them back.
    const done = isOnboardingCompleteCached() || onbComplete;

    // Demo mode: preview onboarding once (until the device flag is set), then
    // jump straight into the app tabs (no real login).
    if (isDemoMode()) {
      if (!done && !inOnboarding) {
        router.replace('/onboarding');
        return;
      }
      if (done && (inAuthGroup || inOnboarding)) {
        router.replace('/home');
      }
      return;
    }

    if (!session) {
      // First open: send people into Welcome. Once they are already inside the
      // auth group (Welcome → Create account → Sign in), leave them alone so we
      // don't bounce them back mid-flow.
      if (!seenWelcome && !inAuthGroup) {
        router.replace('/welcome');
        return;
      }
      if (seenWelcome && !inAuthGroup) {
        router.replace('/sign-in');
      }
      return;
    }

    // Signed in but hasn't finished onboarding -> send them through the front door.
    if (!done && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }
    // Signed in, onboarded, sitting on an auth/onboarding screen -> into the app.
    if (done && (inAuthGroup || inOnboarding)) {
      router.replace('/home');
    }
  }, [session, loading, segments, router, welcomeReady, seenWelcome, onbReady, onbComplete]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useProtectedRoute();
  useRouteTrail();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Delight gifts mount above navigation so they can play on any screen. */}
      <DelightHost />
      <View className="flex-1">
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
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
  const { enabled, status, line, setEnabled } = useBridgeLive();
  const { hearing, liveTranscript, cancelListening } = useBillyVoice();

  useEffect(() => {
    let cancelled = false;
    void fetchAssistantSettings().then((s) => {
      if (!cancelled) setEnabled(Boolean(s.assistantEnabled));
    });
    return () => {
      cancelled = true;
    };
  }, [setEnabled]);

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
