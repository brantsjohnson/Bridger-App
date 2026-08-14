// ============================================
// WHAT THIS FILE DOES (plain English):
// The Sign in screen. Full-bleed Bridger color-bar art, the Bridger mark in the
// middle, and Google / Apple / email controls in a readable panel on the lower
// half. Long-pressing the logo (when the build allows) unlocks fake-data demo
// so TestFlight / local builds can walk the app without a real account.
// Every control carries a taxonomy analyticsId so taps are measured.
// ============================================
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
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
  Screen,
  TextField
} from '@bridger/ui';
import { setOnboardingComplete } from '../../data/onboarding';
import {
  enableDemoMode,
  isDemoUnlockAllowed
} from '../../lib/demo';
import { useAuth } from '../../providers/auth-provider';

const LOGIN_BG = require('../../assets/brand/login-bg.jpg');
const BRIDGER_MARK = require('../../assets/brand/bridger-mark.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'apple' | 'email' | 'demo' | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const unlockAllowed = isDemoUnlockAllowed();

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

  // THIS SECTION DOES: confirm, then turn on fake-data demo and jump into Home.
  function onLogoLongPress() {
    if (!unlockAllowed || busy) return;
    trackClick(AUTH.sign_in.brand_logo, { method: 'long_press' });
    Alert.alert(
      'Enter demo?',
      'Walk Bridger with fake friends and posts. No real account is created.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter demo',
          onPress: () => {
            void (async () => {
              setBusy('demo');
              setError(null);
              try {
                await enableDemoMode();
                // Land in the populated app, not the new-user onboarding run.
                await setOnboardingComplete();
                trackProduct('demo_mode_entered', { method: 'logo_long_press' });
                router.replace('/home');
              } catch {
                setError('Could not start demo on this build.');
              } finally {
                setBusy(null);
              }
            })();
          }
        }
      ]
    );
  }

  return (
    <Screen tone="plain">
      <ImageBackground
        source={LOGIN_BG}
        resizeMode="cover"
        className="flex-1"
        accessibilityIgnoresInvertColors
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* THIS SECTION DOES: hold the logo in the vertical center of the screen. */}
          <View
            className="flex-1 items-center justify-center px-8"
            style={{ paddingTop: insets.top + 12 }}
          >
            <Pressable
              onPress={() => trackClick(AUTH.sign_in.brand_logo, { method: 'tap' })}
              onLongPress={onLogoLongPress}
              delayLongPress={700}
              disabled={busy !== null}
              accessibilityRole="imagebutton"
              accessibilityLabel="Bridger logo"
              accessibilityHint={
                unlockAllowed
                  ? 'Hold to enter demo mode with sample data'
                  : undefined
              }
              className="items-center justify-center"
              hitSlop={16}
            >
              <Image
                source={BRIDGER_MARK}
                style={{ width: 168, height: 220 }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          </View>

          {/* THIS SECTION DOES: put login controls on a readable panel over the art. */}
          <View
            className="rounded-t-3xl bg-canvas px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <AnalyticsRegion
              analyticsId={AUTH.sign_in.page_title}
              interactive={false}
              accessibilityLabel="Sign in"
            >
              <Text className="mb-3 font-pixel text-[22px] text-ink">Sign in</Text>
            </AnalyticsRegion>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{ maxHeight: 420 }}
            >
              <View className="gap-3">
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

              <View className="my-5 flex-row items-center gap-3">
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

              <View className="mt-5 gap-2.5">
                <ButtonPrimary
                  full
                  size="lg"
                  onPress={onSignIn}
                  disabled={busy !== null || !email.trim() || !password}
                  loading={busy === 'email'}
                  accessibilityLabel="Sign in"
                  analyticsId={AUTH.sign_in.submit}
                  analyticsProps={{ method: 'email' }}
                >
                  Sign in
                </ButtonPrimary>
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
                <Text
                  className="mt-4 font-sans-sb text-[13px] text-coral"
                  accessibilityLiveRegion="polite"
                >
                  {error}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </Screen>
  );
}
