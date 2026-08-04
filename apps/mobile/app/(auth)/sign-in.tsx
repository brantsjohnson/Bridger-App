// ============================================
// WHAT THIS FILE DOES (plain English):
// The Sign in screen — same Magic Patterns layout as Create account (Google and
// Apple first, then email), with Sign-in copy. People who already have an
// account land here; new people go to Create account.
// Every control carries a taxonomy analyticsId so taps are measured.
// ============================================
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AUTH,
  openSurface,
  trackProduct
} from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  TextField
} from '@bridger/ui';
import { useAuth } from '../../providers/auth-provider';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mark this screen as the active analytics surface when it opens.
  useEffect(() => {
    openSurface('auth');
  }, []);

  async function onGoogle() {
    setBusy('google');
    setError(null);
    const { error: err, cancelled } = await signInWithGoogle();
    setBusy(null);
    if (!cancelled && err) setError(err);
    if (!cancelled && !err) trackProduct('auth_signed_in', { method: 'google' });
  }

  async function onApple() {
    setBusy('apple');
    setError(null);
    const { error: err, cancelled } = await signInWithApple();
    setBusy(null);
    if (!cancelled && err) setError(err);
    if (!cancelled && !err) trackProduct('auth_signed_in', { method: 'apple' });
  }

  async function onSignIn() {
    setBusy('email');
    setError(null);
    const { error: err } = await signInWithEmail(email.trim(), password);
    setBusy(null);
    if (err) setError(err);
    else trackProduct('auth_signed_in', { method: 'email' });
  }

  return (
    <Screen tone="canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingTop: insets.top + 24 }} className="px-5 pb-2">
          <AnalyticsRegion
            analyticsId={AUTH.sign_in.page_title}
            interactive={false}
            accessibilityLabel="Sign in"
          >
            <PixelHeading size="lg">Sign in</PixelHeading>
          </AnalyticsRegion>
        </View>

        <ScreenBody tabBarInset={false}>
          <View className="mt-4 gap-3">
            <ButtonSecondary
              full
              size="lg"
              onPress={onGoogle}
              disabled={busy !== null}
              loading={busy === 'google'}
              accessibilityLabel="Continue with Google"
              analyticsId={AUTH.sign_in.google}
              analyticsProps={{ method: 'google' }}
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
              analyticsId={AUTH.sign_in.apple}
              analyticsProps={{ method: 'apple' }}
            >
              Continue with Apple
            </ButtonSecondary>
          </View>

          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-ink-line" />
            <Text className="font-sans-b text-[12px] text-ink-mute">or</Text>
            <View className="h-px flex-1 bg-ink-line" />
          </View>

          <View className="gap-3">
            <TextField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              type="email"
              autoComplete="email"
              analyticsId={AUTH.sign_in.email}
            />
            <TextField
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Your password"
              autoComplete="password"
              analyticsId={AUTH.sign_in.password}
            />
          </View>

          <View className="mt-6 gap-2.5">
            <ButtonSecondary
              full
              size="lg"
              tone="solid"
              onPress={onSignIn}
              disabled={busy !== null || !email.trim() || !password}
              loading={busy === 'email'}
              accessibilityLabel="Sign in"
              analyticsId={AUTH.sign_in.submit}
              analyticsProps={{ method: 'email' }}
            >
              Sign in
            </ButtonSecondary>
            <ButtonSecondary
              full
              tone="ghost"
              onPress={() => router.replace('/(auth)/sign-up')}
              disabled={busy !== null}
              accessibilityLabel="Create account"
              analyticsId={AUTH.sign_in.switch_to_sign_up}
            >
              Create account
            </ButtonSecondary>
          </View>

          {error ? (
            <Text className="mt-4 font-sans-sb text-[13px] text-coral" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </ScreenBody>
      </KeyboardAvoidingView>
    </Screen>
  );
}
