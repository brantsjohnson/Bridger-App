// ============================================
// WHAT THIS FILE DOES (plain English):
// Mandatory one-time intro before the first profile fill. You decide what
// each group of friends knows, and you can delete anything anytime (removed
// from Bridger's database). Non-skippable; same idea as onboarding welcome.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PROFILE,
  dismissSurface,
  openSurface,
  trackClick,
  trackFlowCompleted,
  trackFlowStarted
} from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary } from '@bridger/ui';

export function ProfileIntro({
  open,
  onContinue
}: {
  open: boolean;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    openSurface('profile_intro', 'profile');
    trackFlowStarted('profile_intro');
    return () => {
      dismissSurface('profile_intro');
    };
  }, [open]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={() => undefined}>
      <View
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}
        className="flex-1 bg-canvas px-6"
      >
        <Text className="font-pixel text-[22px] text-ink">Your profile, your rules</Text>
        <AnalyticsRegion analyticsId={PROFILE.intro.body} interactive={false} className="mt-5">
          <Text className="font-sans-sb text-[16px] leading-relaxed text-ink-soft">
            You decide what each group of friends knows about you. Close friends can see
            more; acquaintances see less. Change it anytime.
          </Text>
          <Text className="mt-4 font-sans-sb text-[16px] leading-relaxed text-ink-soft">
            You can delete anything at any time. When you do, it is removed from Bridger&apos;s
            database.
          </Text>
        </AnalyticsRegion>
        <View className="mt-auto">
          <ButtonPrimary
            full
            size="lg"
            onPress={() => {
              trackClick(PROFILE.intro.continue);
              const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
              trackFlowCompleted('profile_intro', ms);
              onContinue();
            }}
          >
            Got it
          </ButtonPrimary>
        </View>
      </View>
    </Modal>
  );
}
