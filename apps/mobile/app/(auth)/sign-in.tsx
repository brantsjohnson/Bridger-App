// ============================================
// WHAT THIS FILE DOES (plain English):
// The Sign in screen. Full-bleed Bridger color-bar art and the Bridger mark.
// Default path is phone number + SMS one-time code, with a country dial picker
// so people outside the US are not locked to +1. The code field is wired for
// one-tap SMS autofill on iOS, Android, and Mac/Safari. Google / Apple / email
// stay compiled when EXPO_PUBLIC_AUTH_MODE=legacy. Long-pressing the logo
// (when the build allows) opens the demo gate: "onboard" is the New flow,
// "onboardold" is the Old 19-step flow. Every control has an analyticsId.
// ============================================
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { mergePendingPeopleForMe } from '../../data/pending-people';
import { authMode } from '../../lib/auth-mode';
import { toE164 } from '../../lib/phone';
import { guessDefaultPhoneCountry, type PhoneCountry } from '../../lib/phone-countries';
import {
  enableDemoMode,
  isDemoUnlockAllowed,
  makeDemoOnboardSeed,
  setDemoOnboardSeed,
  setOnboardingFlowVariant,
  verifyDemoUnlockPassword,
  verifyOnboardDemoPassword,
  verifyOnboardOldDemoPassword
} from '../../lib/demo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';
import { AppleSignInMark, GoogleMark } from '../../components/auth/AuthBrandMarks';
import { PhoneCountryField } from '../../components/auth/PhoneCountryField';

/**
 * After Google / Apple succeeds, decide signup vs sign-in for analytics.
 * Brand-new accounts were created in the last minute; everyone else is returning.
 */
async function trackAuthOutcome(method: 'google' | 'apple' | 'phone') {
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

// Full-bleed login art (1080×1920). Placed absolute + cover behind the sheet;
// no crop hacks needed because the asset is edge-to-edge color bars.
const LOGIN_BG = require('../../assets/brand/login-screen.png');
const BRIDGER_MARK = require('../../assets/brand/bridger-mark.png');

// THIS SECTION DOES: public legal pages carriers check for SMS opt-in (same as site).
const PRIVACY_URL = 'https://bridger.social/privacy.html';
const TERMS_URL = 'https://bridger.social/terms.html';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, signInWithApple, sendPhoneCode, verifyPhoneCode } =
    useAuth();
  const [showManual, setShowManual] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<
    'google' | 'apple' | 'email' | 'demo' | 'phone' | 'otp' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoPassword, setDemoPassword] = useState('');
  const [demoPasswordError, setDemoPasswordError] = useState<string | null>(null);
  const unlockAllowed = isDemoUnlockAllowed();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Phone OTP: country dial + local number first, then the code we texted.
  const [phonePhase, setPhonePhase] = useState<'phone' | 'otp'>('phone');
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(() =>
    guessDefaultPhoneCountry()
  );
  const [phoneRaw, setPhoneRaw] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const showPhone = authMode() === 'phone';

  useEffect(() => {
    openSurface('auth');
  }, []);

  // THIS SECTION DOES: tick the "resend code" cooldown down once a second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function onSendCode() {
    const e164 = toE164(phoneRaw, phoneCountry.dial);
    if (!e164) {
      setError('Enter a real phone number for that country.');
      return;
    }
    setBusy('phone');
    setError(null);
    const { error: err } = await sendPhoneCode(e164);
    setBusy(null);
    if (err) {
      setError(err);
      return;
    }
    setPhoneE164(e164);
    setPhonePhase('otp');
    setOtp('');
    setResendIn(30);
  }

  async function onVerifyCode(rawCode?: string) {
    if (!phoneE164) return;
    const token = (rawCode ?? otp).replace(/\D/g, '');
    if (token.length < 4) {
      setError('Enter the code we texted you.');
      return;
    }
    setBusy('otp');
    setError(null);
    const { error: err } = await verifyPhoneCode(phoneE164, token);
    setBusy(null);
    if (err) {
      setError(err);
      return;
    }
    await trackAuthOutcome('phone');
    // Merge any private cards other people already made for this number.
    void mergePendingPeopleForMe();
  }

  // THIS SECTION DOES: accept a one-tap SMS fill and verify as soon as 6 digits land.
  function onOtpChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setOtp(digits);
    setError(null);
    if (digits.length >= 6 && busy === null) {
      void onVerifyCode(digits);
    }
  }

  async function onResendCode() {
    if (!phoneE164 || resendIn > 0 || busy) return;
    setBusy('phone');
    setError(null);
    const { error: err } = await sendPhoneCode(phoneE164);
    setBusy(null);
    if (err) {
      setError(err);
      return;
    }
    setResendIn(30);
  }

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
          await setOnboardingFlowVariant('new');
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

    if (verifyOnboardOldDemoPassword(pw)) {
      setDemoOpen(false);
      void (async () => {
        setBusy('demo');
        setError(null);
        try {
          await enableDemoMode();
          await resetOnboarding();
          await setOnboardingFlowVariant('old');
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
    // Dark fallback behind the art so a layout seam never flashes eggshell white.
    <Screen tone="plain" className="bg-canvas-dark">
      {/* Full-bleed art sits absolute behind everything; cover fills the screen. */}
      <View className="flex-1 overflow-hidden">
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
          style={{ backgroundColor: 'transparent' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Logo floats over the art; sign-in sheet sits at the bottom. */}
          <View
            className="flex-1 items-center justify-center px-8"
            style={{ paddingTop: insets.top + 12, backgroundColor: 'transparent' }}
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
            accessibilityLabel={
              showPhone ? 'Create your Bridger account.' : 'Sign in'
            }
          >
            <Text className="mb-1 font-pixel text-[22px] text-ink">
              {showPhone ? 'Create your Bridger account.' : 'Sign in'}
            </Text>
          </AnalyticsRegion>
          <Text className="mb-3 font-sans-sb text-[13px] text-ink-mute">
            {showPhone
              ? phonePhase === 'otp'
                ? 'We sent a verification code to your phone.'
                : 'Use your phone number to get started.'
              : 'New or returning. Continue with Google or Apple.'}
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ maxHeight: 480 }}
          >
            {showPhone ? (
              phonePhase === 'phone' ? (
                <>
                  <View className="gap-3">
                    <PhoneCountryField
                      country={phoneCountry}
                      onCountryChange={(next) => {
                        setPhoneCountry(next);
                        setError(null);
                      }}
                      phoneRaw={phoneRaw}
                      onPhoneChange={(v) => {
                        setPhoneRaw(v);
                        setError(null);
                      }}
                      onSubmitEditing={() => void onSendCode()}
                    />
                  </View>
                  <View className="mt-5">
                    <ButtonPrimary
                      full
                      size="lg"
                      onPress={() => void onSendCode()}
                      disabled={busy !== null || !phoneRaw.trim()}
                      loading={busy === 'phone'}
                      accessibilityLabel="Send me a code"
                      analyticsId={AUTH.sign_in.send_code}
                      analyticsProps={{
                        method: 'phone',
                        country_iso: phoneCountry.iso
                      }}
                    >
                      Send me a code
                    </ButtonPrimary>
                  </View>
                  {/* THIS SECTION DOES: A2P SMS disclosures carriers require before the first text. */}
                  <AnalyticsRegion
                    analyticsId={AUTH.sign_in.sms_consent}
                    interactive={false}
                    accessibilityLabel="SMS consent. One Bridger sign-in text when you ask. Message and data rates may apply. Reply HELP for help, STOP to opt out."
                  >
                    <Text className="mt-3 font-sans text-[13px] leading-5 text-ink-mute">
                      By tapping Send me a code, you agree to receive one Bridger
                      sign-in text when you ask for it. Message frequency: only when
                      you request a code. Msg & data rates may apply. Reply HELP for
                      help, STOP to opt out.{' '}
                      <Text
                        onPress={() => {
                          trackClick(AUTH.sign_in.privacy_policy);
                          void Linking.openURL(PRIVACY_URL);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel="Privacy Policy"
                        className="font-sans-sb text-ink underline"
                      >
                        Privacy
                      </Text>
                      {' · '}
                      <Text
                        onPress={() => {
                          trackClick(AUTH.sign_in.terms);
                          void Linking.openURL(TERMS_URL);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel="Terms of Service"
                        className="font-sans-sb text-ink underline"
                      >
                        Terms
                      </Text>
                    </Text>
                  </AnalyticsRegion>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setPhonePhase('phone');
                      setOtp('');
                      setError(null);
                    }}
                    disabled={busy !== null}
                    accessibilityRole="button"
                    accessibilityLabel="Back to phone number"
                    className="mb-4 self-start py-1"
                  >
                    <Text className="font-sans-sb text-[13px] text-ink-mute">← Back</Text>
                  </Pressable>
                  <View className="gap-3">
                    <TextField
                      label="Verification code"
                      value={otp}
                      onChange={onOtpChange}
                      placeholder="123456"
                      type="otp"
                      autoComplete="one-time-code"
                      autoFocus
                      analyticsId={AUTH.sign_in.otp_code}
                      onSubmitEditing={() => void onVerifyCode()}
                      accessibilityHint="When the text arrives, tap the suggested code above the keyboard"
                    />
                  </View>
                  <View className="mt-5">
                    <ButtonPrimary
                      full
                      size="lg"
                      onPress={() => void onVerifyCode()}
                      disabled={busy !== null || otp.replace(/\D/g, '').length < 4}
                      loading={busy === 'otp'}
                      accessibilityLabel="Verify my number"
                      analyticsId={AUTH.sign_in.verify}
                      analyticsProps={{ method: 'phone' }}
                    >
                      Verify my number
                    </ButtonPrimary>
                  </View>
                  <Pressable
                    onPress={() => {
                      trackClick(AUTH.sign_in.resend_otp);
                      void onResendCode();
                    }}
                    disabled={busy !== null || resendIn > 0}
                    accessibilityRole="button"
                    accessibilityLabel={
                      resendIn > 0 ? `Resend code in ${resendIn} seconds` : 'Resend code'
                    }
                    className="mt-4 items-center py-2"
                  >
                    <Text className="font-sans-sb text-[13px] text-ink-mute underline decoration-ink-mute/40">
                      {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                    </Text>
                  </Pressable>
                </>
              )
            ) : !showManual ? (
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
                    icon={<GoogleMark size={20} />}
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
                    icon={<AppleSignInMark size={20} />}
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
      </View>

      {/* THIS SECTION DOES: the demo password sheet. KeyboardAvoidingView keeps
          the field + Enter button above the keyboard so it cannot hide the sheet.
          Backdrop and sheet stay siblings (web cannot nest buttons in a button). */}
      <Modal
        visible={demoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDemoOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-ink/40"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Modal is already full-screen; no extra nav offset needed.
          keyboardVerticalOffset={0}
        >
          <View className="flex-1 justify-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss demo password"
              onPress={() => setDemoOpen(false)}
              style={StyleSheet.absoluteFill}
            />
            <View
              className="rounded-t-3xl bg-canvas px-5 pt-5"
              style={{
                // Sit above the full-screen dismiss backdrop so taps hit the sheet.
                zIndex: 1,
                maxHeight: '92%',
                paddingBottom: Math.max(insets.bottom, 16) + 8
              }}
            >
              {/* Scroll so short phones can still reach Enter while typing. */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text className="font-pixel text-[20px] text-ink">Demo mode</Text>
                <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
                  "demomode" walks the finished app. "onboard" runs the new onboarding
                  demo. "onboardold" runs the old onboarding demo. No real account is
                  created.
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
                    onSubmitEditing={onDemoSubmit}
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
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
