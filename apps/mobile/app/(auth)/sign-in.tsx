// ============================================
// WHAT THIS FILE DOES (plain English):
// The Sign in screen. Full-bleed Bridger color-bar art, the Bridger mark in the
// middle, and Google / Apple as the main paths (tap = sign in, no extra button).
// Email + password is tucked behind a subtle "Sign in with email" link under
// Apple. Long-pressing the logo (when the build allows) opens the demo gate.
// Every control carries a taxonomy analyticsId so taps are measured.
// ============================================
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { resetOnboarding, setOnboardingComplete } from '../../data/onboarding';
import {
  enableDemoMode,
  isDemoUnlockAllowed,
  makeDemoOnboardSeed,
  setDemoOnboardSeed,
  verifyDemoUnlockPassword,
  verifyOnboardDemoPassword
} from '../../lib/demo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';

/**
 * After Google / Apple succeeds, decide signup vs sign-in for analytics.
 * Brand-new accounts were created in the last minute; everyone else is returning.
 */
async function trackAuthOutcome(method: 'google' | 'apple') {
  try {
    const { data } = await supabase.auth.getUser();
    const createdAt = data.user?.created_at
      ? new Date(data.user.created_at).getTime()
      : 0;
    const isNew = createdAt > 0 && Date.now() - createdAt < 60_000;
    trackProduct(isNew ? 'auth_signed_up' : 'auth_signed_in', { method });
  } catch {
    trackProduct('auth_signed_in', { method });
  }
}

const LOGIN_BG = require('../../assets/brand/login-screen.png');
const BRIDGER_MARK = require('../../assets/brand/bridger-mark.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [showManual, setShowManual] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'apple' | 'email' | 'demo' | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoPassword, setDemoPassword] = useState('');
  const [demoPasswordError, setDemoPasswordError] = useState<string | null>(null);
  const unlockAllowed = isDemoUnlockAllowed();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    openSurface('auth');
  }, []);

  async function onGoogle() {
    setBusy('google');
    setError(null);
    const { error: err, cancelled } = await signInWithGoogle();
    setBusy(null);
    if (!cancelled && err) setError(err);
    // First-time Google users get an account automatically; returning users just sign in.
    if (!cancelled && !err) await trackAuthOutcome('google');
  }

  async function onApple() {
    setBusy('apple');
    setError(null);
    const { error: err, cancelled } = await signInWithApple();
    setBusy(null);
    if (!cancelled && err) setError(err);
    // First-time Apple users get an account automatically; returning users just sign in.
    if (!cancelled && !err) await trackAuthOutcome('apple');
  }

  async function onSignInEmail() {
    setBusy('email');
    setError(null);
    const { error: err } = await signInWithEmail(email.trim(), password);
    setBusy(null);
    if (err) setError(err);
    else trackProduct('auth_signed_in', { method: 'email' });
  }

  function openDemoSheet() {
    if (!unlockAllowed || busy) return;
    setDemoPassword('');
    setDemoPasswordError(null);
    setDemoOpen(true);
  }

  function onLogoPress() {
    trackClick(AUTH.sign_in.brand_logo, { method: 'tap' });
    if (!unlockAllowed || busy) return;
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      openDemoSheet();
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 800);
  }

  function onLogoLongPress() {
    if (!unlockAllowed || busy) return;
    trackClick(AUTH.sign_in.brand_logo, { method: 'long_press' });
    openDemoSheet();
  }

  function onDemoSubmit() {
    const pw = demoPassword.trim();

    if (verifyDemoUnlockPassword(pw)) {
      setDemoOpen(false);
      void (async () => {
        setBusy('demo');
        setError(null);
        try {
          await enableDemoMode();
          await setOnboardingComplete();
          trackProduct('demo_mode_entered', { method: 'logo_password' });
          router.replace('/home');
        } catch {
          setError('Could not start demo on this build.');
        } finally {
          setBusy(null);
          setDemoPassword('');
        }
      })();
      return;
    }

    if (verifyOnboardDemoPassword(pw)) {
      setDemoOpen(false);
      void (async () => {
        setBusy('demo');
        setError(null);
        try {
          await enableDemoMode();
          await resetOnboarding();
          setDemoOnboardSeed(makeDemoOnboardSeed());
          trackProduct('demo_mode_entered', { method: 'logo_onboard' });
          router.replace('/onboarding');
        } catch {
          setError('Could not start demo on this build.');
        } finally {
          setBusy(null);
          setDemoPassword('');
        }
      })();
      return;
    }

    setDemoPasswordError('Wrong password');
  }

  return (
    <Screen tone="plain">
      {/*
        Full-bleed art sits ABSOLUTE behind everything and crops with cover, so
        it always meets the sign-in sheet. ImageBackground + flex left a white
        band on some devices when the image did not stretch to the sheet.
      */}
      <Image
        source={LOGIN_BG}
        resizeMode="cover"
        style={[
          StyleSheet.absoluteFill,
          // Width/height 100% keeps cover painting edge-to-edge on web too.
          { width: '100%', height: '100%' }
        ]}
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo floats over the art; sheet sits below and covers the lower art. */}
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            onPress={onLogoPress}
            onLongPress={onLogoLongPress}
            delayLongPress={700}
            disabled={busy !== null}
            accessibilityRole="imagebutton"
            accessibilityLabel="Bridger logo"
            accessibilityHint={
              unlockAllowed
                ? 'Tap three times or hold to enter the demo password'
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

        <View
          className="rounded-t-3xl bg-canvas px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <AnalyticsRegion
            analyticsId={AUTH.sign_in.page_title}
            interactive={false}
            accessibilityLabel="Sign in"
          >
            <Text className="mb-1 font-pixel text-[22px] text-ink">Sign in</Text>
          </AnalyticsRegion>
          {/* One path for new and returning: Google / Apple create the account if needed. */}
          <Text className="mb-3 font-sans-sb text-[13px] text-ink-mute">
            New or returning. Continue with Google or Apple.
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ maxHeight: 420 }}
          >
            {!showManual ? (
              <>
                {/* OAuth is the default: first tap creates an account; next time it signs in. */}
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

                {/* Email stays for people who already have a password account. */}
                <Pressable
                  onPress={() => {
                    trackClick(AUTH.sign_in.manual_link);
                    setShowManual(true);
                  }}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with email"
                  className="mt-5 items-center py-2"
                >
                  <Text className="font-sans-sb text-[13px] text-ink-mute underline decoration-ink-mute/40">
                    Sign in with email
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Manual sign-in: email + password only (no create-account path). */}
                <Pressable
                  onPress={() => {
                    setShowManual(false);
                    setError(null);
                  }}
                  disabled={busy !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Google and Apple sign in"
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

                <View className="mt-5">
                  <ButtonPrimary
                    full
                    size="lg"
                    onPress={onSignInEmail}
                    disabled={busy !== null || !email.trim() || !password}
                    loading={busy === 'email'}
                    accessibilityLabel="Sign in with email"
                    analyticsId={AUTH.sign_in.submit}
                    analyticsProps={{ method: 'email' }}
                  >
                    Sign in
                  </ButtonPrimary>
                </View>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={demoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDemoOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-ink/40"
          onPress={() => setDemoOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss demo password"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-canvas px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <Text className="font-pixel text-[20px] text-ink">Demo mode</Text>
            <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
              "demomode" walks the finished app. "onboard" runs a fresh onboarding
              demo. No real account is created.
            </Text>
            <View className="mt-4">
              <TextField
                label="Password"
                value={demoPassword}
                onChange={(v) => {
                  setDemoPassword(v);
                  setDemoPasswordError(null);
                }}
                type="password"
                placeholder="Demo password"
                autoComplete="off"
                analyticsId={AUTH.sign_in.password}
              />
            </View>
            {demoPasswordError ? (
              <Text
                className="mt-2 font-sans-sb text-[13px] text-coral"
                accessibilityLiveRegion="polite"
              >
                {demoPasswordError}
              </Text>
            ) : null}
            <View className="mt-5 gap-2.5">
              <ButtonPrimary
                full
                size="lg"
                onPress={onDemoSubmit}
                disabled={busy !== null || !demoPassword.trim()}
                loading={busy === 'demo'}
                accessibilityLabel="Enter demo"
                analyticsId={AUTH.sign_in.submit}
                analyticsProps={{ method: 'demo_password' }}
              >
                Enter demo
              </ButtonPrimary>
              <ButtonSecondary
                full
                tone="ghost"
                onPress={() => setDemoOpen(false)}
                disabled={busy === 'demo'}
                accessibilityLabel="Cancel"
              >
                Cancel
              </ButtonSecondary>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
