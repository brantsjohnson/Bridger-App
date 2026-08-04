// ============================================
// WHAT THIS FILE DOES (plain English):
// The navigator for signed-OUT screens: Welcome (first open), Create account,
// and Sign in. The root layout sends people here when they are not logged in.
// ============================================
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
