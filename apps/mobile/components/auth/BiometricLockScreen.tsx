// ============================================
// WHAT THIS FILE DOES (plain English):
// A full-screen "Welcome back" cover. The person is still signed in. They
// tap Unlock to use Face ID (or the phone passcode). Use phone number signs
// them out and costs a new text, so we ask once first.
// ============================================
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AUTH, openSurface, trackClick, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  PixelHeading,
  Screen,
  useResponsiveLayout
} from '@bridger/ui';
import { useAuth } from '../../providers/auth-provider';
import { useBiometricLock } from '../../providers/biometric-lock-provider';

const BRIDGER_MARK = require('../../assets/brand/bridger-mark.png');

export function BiometricLockScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { locked, capability, unlock } = useBiometricLock();
  const { contentMaxWidth } = useResponsiveLayout();
  const [busy, setBusy] = useState(false);
  const promptedRef = useRef(false);

  // THIS SECTION DOES: treat the lock as its own surface (not the screen behind).
  useEffect(() => {
    if (locked) openSurface('auth_lock', 'auth');
  }, [locked]);

  // THIS SECTION DOES: offer Face ID once when the cover appears.
  useEffect(() => {
    if (!locked) {
      promptedRef.current = false;
      return;
    }
    if (promptedRef.current) return;
    promptedRef.current = true;
    void unlock();
  }, [locked, unlock]);

  if (!locked) return null;

  const label = capability.label;

  async function onUnlock() {
    if (busy) return;
    setBusy(true);
    await unlock();
    setBusy(false);
  }

  function onUsePhone() {
    Alert.alert(
      'Use your phone number?',
      'This signs you out. You will need a new text to get back in.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              trackProduct('auth_signed_out', { method: 'lock_use_phone' });
              try {
                await signOut();
              } catch {
                // Still leave the cover even if the network call fails.
              }
              router.replace('/(auth)/sign-in');
            })();
          }
        }
      ]
    );
  }

  return (
    <View
      accessibilityViewIsModal
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 80 }}
    >
      <Screen tone="plain" className="bg-canvas">
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}
        >
          <AnalyticsRegion
            analyticsId={AUTH.lock.mark}
            interactive={false}
            accessibilityLabel="Bridger"
          >
            <Image
              source={BRIDGER_MARK}
              style={{ width: 120, height: 156 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </AnalyticsRegion>

          <AnalyticsRegion
            analyticsId={AUTH.lock.page_title}
            interactive={false}
            accessibilityLabel="Welcome back"
          >
            <PixelHeading size="lg" className="mt-6 text-center text-ink">
              Welcome back
            </PixelHeading>
          </AnalyticsRegion>

          <Text className="mt-3 text-center font-sans-sb text-[16px] leading-[26px] text-ink-soft">
            Unlock with {label}. You stay signed in.
          </Text>

          <View className="mt-8 w-full">
            <ButtonPrimary
              full
              size="lg"
              loading={busy}
              disabled={busy}
              onPress={() => void onUnlock()}
              accessibilityLabel={`Unlock with ${label}`}
              analyticsId={AUTH.lock.unlock}
              analyticsProps={{ method: capability.method }}
            >
              Unlock
            </ButtonPrimary>
          </View>

          <Pressable
            onPress={() => {
              trackClick(AUTH.lock.use_phone, { method: 'phone' });
              onUsePhone();
            }}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Use phone number instead"
            accessibilityHint="Signs you out. You will need a new text."
            className="mt-5 min-h-[44px] items-center justify-center px-3"
          >
            <Text className="font-sans-sb text-[16px] text-ink-mute underline decoration-ink-mute/40">
              Use phone number
            </Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}
