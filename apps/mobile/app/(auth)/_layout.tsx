// ============================================
// WHAT THIS FILE DOES (plain English):
// The navigator for signed-OUT screens: Welcome (first open) and Sign in.
// Google / Apple on Sign in create an account the first time and sign in after.
// The old Create account route still exists only as a redirect to Sign in.
// The root layout sends people here when they are not logged in.
// ============================================
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
