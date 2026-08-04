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

import { useColorScheme } from '@/components/useColorScheme';
import { WELCOME_SEEN_KEY } from '../content/welcome';
import { isDemoMode } from '../lib/demo';
import { AuthProvider, useAuth } from '../providers/auth-provider';

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

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY).then((v) => {
      setSeenWelcome(v === '1');
      setWelcomeReady(true);
    });
  }, []);

  useEffect(() => {
    if (loading || !welcomeReady) return;
    const inAuthGroup = segments[0] === '(auth)';

    // Demo mode: jump straight into the app tabs (no real login).
    if (isDemoMode()) {
      if (inAuthGroup) {
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
    } else if (session && inAuthGroup) {
      // Logged in but sitting on an auth screen -> go to the app.
      router.replace('/home');
    }
  }, [session, loading, segments, router, welcomeReady, seenWelcome]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useProtectedRoute();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
