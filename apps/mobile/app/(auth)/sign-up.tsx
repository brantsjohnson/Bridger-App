// ============================================
// WHAT THIS FILE DOES (plain English):
// The Create account screen, ported from the Magic Patterns auth design:
// Google and Apple first (the fast paths people expect), then an "or" divider,
// then email + password. Matches ONBOARDING.md Phase 1 and the prototype at
// design/magic-patterns/.../auth/sign-up.tsx — same layout, same labels, no
// filler copy.
// ============================================
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  TextField
} from '@bridger/ui';
import { useAuth } from '../../providers/auth-provider';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onGoogle() {
    setBusy('google');
    setError(null);
    setInfo(null);
    const { error: err, cancelled } = await signInWithGoogle();
    setBusy(null);
    if (!cancelled && err) setError(err);
  }

  async function onApple() {
    setBusy('apple');
    setError(null);
    setInfo(null);
    const { error: err, cancelled } = await signInWithApple();
    setBusy(null);
    if (!cancelled && err) setError(err);
  }

  async function onCreate() {
    setBusy('email');
    setError(null);
    setInfo(null);
    const { error: err } = await signUpWithEmail(email.trim(), password);
    setBusy(null);
    if (err) {
      setError(err);
    } else {
      setInfo('Account created. If email confirmation is on, check your inbox, then sign in.');
    }
  }

  return (
    <Screen tone="canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* --- Pixel title, matching Magic Patterns --- */}
        <View style={{ paddingTop: insets.top + 24 }} className="px-5 pb-2">
          <PixelHeading size="lg">Create account</PixelHeading>
        </View>

        <ScreenBody tabBarInset={false}>
          {/* --- Fast paths: Google + Apple first --- */}
          <View className="mt-4 gap-3">
            <ButtonSecondary
              full
              size="lg"
              onPress={onGoogle}
              disabled={busy !== null}
              loading={busy === 'google'}
              accessibilityLabel="Continue with Google"
            >
              Continue with Google
            </ButtonSecondary>
            <ButtonSecondary
              full
              size="lg"
              onPress={onApple}
              disabled={busy !== null}
              loading={busy === 'apple'}
              accessibilityLabel="Continue with Apple"
            >
              Continue with Apple
            </ButtonSecondary>
          </View>

          {/* --- "or" divider --- */}
          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-ink-line" />
            <Text className="font-sans-b text-[12px] text-ink-mute">or</Text>
            <View className="h-px flex-1 bg-ink-line" />
          </View>

          {/* --- Email path --- */}
          <View className="gap-3">
            <TextField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              type="email"
              autoComplete="email"
            />
            <TextField
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="8+ characters"
              autoComplete="new-password"
            />
          </View>

          <View className="mt-6 gap-2.5">
            <ButtonSecondary
              full
              size="lg"
              tone="solid"
              onPress={onCreate}
              disabled={busy !== null || !email.trim() || password.length < 8}
              loading={busy === 'email'}
              accessibilityLabel="Create account"
            >
              Create account
            </ButtonSecondary>
            <ButtonSecondary
              full
              tone="ghost"
              onPress={() => router.replace('/(auth)/sign-in')}
              disabled={busy !== null}
              accessibilityLabel="Sign in"
            >
              Sign in
            </ButtonSecondary>
          </View>

          {error ? (
            <Text className="mt-4 font-sans-sb text-[13px] text-coral" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {info ? (
            <Text className="mt-4 font-sans-sb text-[13px] text-ink-soft" accessibilityLiveRegion="polite">
              {info}
            </Text>
          ) : null}
        </ScreenBody>
      </KeyboardAvoidingView>
    </Screen>
  );
}
