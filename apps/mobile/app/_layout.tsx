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
  useRouter,
  useSegments
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

// --- STYLING: loads Tailwind/NativeWind styles for the whole app (must be here, once) ---
import '../global.css';

import { registerAvatarPhotoResolver } from '@bridger/ui';

import { useColorScheme } from '@/components/useColorScheme';
import { WELCOME_SEEN_KEY } from '../content/welcome';
import { getProfilePhoto } from '../data/fixtures/demo-media';
import { getOnboardingComplete, isOnboardingCompleteCached } from '../data/onboarding';
import { bootstrapAnalytics } from '../lib/analytics-bootstrap';
import { isDemoMode } from '../lib/demo';
import { AuthProvider, useAuth } from '../providers/auth-provider';

// Analytics: wire context + (dev) sink once. Capture stays opted-out until Settings.
bootstrapAnalytics();

// Photos: let any <Avatar personId="..."> pull a person's dropped-in photo,
// so real faces appear everywhere (Friend Pod, Inside Jokes, rows, etc.).
registerAvatarPhotoResolver(getProfilePhoto);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // --- Everything below can now ask "who is logged in?" via useAuth() ---
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// --- DEMO MODE: skip sign-in so you can preview real screens on localhost.
//     Turn on with EXPO_PUBLIC_DEMO_MODE=1 in apps/mobile/.env. Never ship this on. ---
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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
