// ============================================
// WHAT THIS FILE DOES (plain English):
// The Create account screen. Google and Apple are the main paths (tap = sign
// up, no extra button). Email sign-up is tucked behind a subtle "Sign up with
// email" link. The manual form asks for email, password, and confirm password
// so sign-up is clearly different from sign-in (which has no confirm field).
// Every control carries a taxonomy analyticsId.
// ============================================
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AUTH,
  openSurface,
  trackClick,
  trackProduct
} from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
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
  const [showManual, setShowManual] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const canCreate =
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  useEffect(() => {
    openSurface('auth');
  }, []);

  async function onGoogle() {
    setBusy('google');
    setError(null);
    setInfo(null);
    const { error: err, cancelled } = await signInWithGoogle();
    setBusy(null);
    if (!cancelled && err) setError(err);
    if (!cancelled && !err) trackProduct('auth_signed_up', { method: 'google' });
  }

  async function onApple() {
    setBusy('apple');
    setError(null);
    setInfo(null);
    const { error: err, cancelled } = await signInWithApple();
    setBusy(null);
    if (!cancelled && err) setError(err);
    if (!cancelled && !err) trackProduct('auth_signed_up', { method: 'apple' });
  }

  async function onCreateEmail() {
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setBusy('email');
    setError(null);
    setInfo(null);
    const { error: err } = await signUpWithEmail(email.trim(), password);
    setBusy(null);
    if (err) {
      setError(err);
    } else {
      trackProduct('auth_signed_up', { method: 'email' });
      setInfo('Account created. If email confirmation is on, check your inbox, then sign in.');
    }
  }

  return (
    <Screen tone="canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ paddingTop: insets.top + 24 }} className="px-5 pb-2">
          <AnalyticsRegion
            analyticsId={AUTH.sign_up.page_title}
            interactive={false}
            accessibilityLabel="Create account"
          >
            <PixelHeading size="lg">Create account</PixelHeading>
          </AnalyticsRegion>
        </View>

        <ScreenBody tabBarInset={false}>
          {!showManual ? (
            <>
              <View className="mt-4 gap-3">
                <ButtonSecondary
                  full
                  size="lg"
                  onPress={onGoogle}
                  disabled={busy !== null}
                  loading={busy === 'google'}
                  accessibilityLabel="Continue with Google"
                  analyticsId={AUTH.sign_up.google}
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
                  analyticsId={AUTH.sign_up.apple}
                  analyticsProps={{ method: 'apple' }}
                >
                  Continue with Apple
                </ButtonSecondary>
              </View>

              <Pressable
                onPress={() => {
                  trackClick(AUTH.sign_up.manual_link);
                  setShowManual(true);
                }}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Sign up with email"
                className="mt-5 items-center py-2"
              >
                <Text className="font-sans-sb text-[13px] text-ink-mute underline decoration-ink-mute/40">
                  Sign up with email
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  trackClick(AUTH.sign_up.switch_to_sign_in);
                  router.replace('/(auth)/sign-in');
                }}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                className="mt-2 items-center py-2"
              >
                <Text className="font-sans-b text-[13px] text-ink-soft">
                  Already have an account?{' '}
                  <Text className="font-sans-sb text-ink underline decoration-ink/30">
                    Sign in
                  </Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  setShowManual(false);
                  setError(null);
                  setInfo(null);
                }}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Back to Google and Apple sign up"
                className="mb-4 self-start py-1"
              >
                <Text className="font-sans-sb text-[13px] text-ink-mute">← Back</Text>
              </Pressable>

              <View className="gap-3">
                <TextField
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@email.com"
                  type="email"
                  autoComplete="email"
                  analyticsId={AUTH.sign_up.email}
                />
                <TextField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  analyticsId={AUTH.sign_up.password}
                />
                <TextField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  placeholder="Type it again"
                  autoComplete="new-password"
                  analyticsId={AUTH.sign_up.confirm_password}
                />
              </View>

              {confirmPassword.length > 0 && !passwordsMatch ? (
                <Text
                  className="mt-2 font-sans-sb text-[13px] text-coral"
                  accessibilityLiveRegion="polite"
                >
                  Passwords do not match.
                </Text>
              ) : null}

              <View className="mt-5">
                <ButtonPrimary
                  full
                  size="lg"
                  onPress={onCreateEmail}
                  disabled={busy !== null || !canCreate}
                  loading={busy === 'email'}
                  accessibilityLabel="Create account with email"
                  analyticsId={AUTH.sign_up.submit}
                  analyticsProps={{ method: 'email' }}
                >
                  Create account
                </ButtonPrimary>
              </View>

              <Pressable
                onPress={() => {
                  trackClick(AUTH.sign_up.switch_to_sign_in);
                  router.replace('/(auth)/sign-in');
                }}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                className="mt-4 items-center py-2"
              >
                <Text className="font-sans-b text-[13px] text-ink-soft">
                  Already have an account?{' '}
                  <Text className="font-sans-sb text-ink underline decoration-ink/30">
                    Sign in
                  </Text>
                </Text>
              </Pressable>
            </>
          )}

          {error ? (
            <Text
              className="mt-4 font-sans-sb text-[13px] text-coral"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}
          {info ? (
            <Text
              className="mt-4 font-sans-sb text-[13px] text-ink-soft"
              accessibilityLiveRegion="polite"
            >
              {info}
            </Text>
          ) : null}
        </ScreenBody>
      </KeyboardAvoidingView>
    </Screen>
  );
}
