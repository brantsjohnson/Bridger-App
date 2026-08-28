// ============================================
// WHAT THIS FILE DOES (plain English):
// Mandatory one-time welcome before the first profile fill. Black intro canvas
// (same vibe as Events and Discover). Top half: welcome + CRT. Bottom half:
// dotted divider, padlock, and a larger Privacy header. "Hell yeah" finishes
// it and we never show this screen again for that account.
//
// Non-skippable: you must tap Hell yeah once.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Modal, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PROFILE,
  dismissSurface,
  openSurface,
  trackFlowCompleted,
  trackFlowStarted
} from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, PixelHeading, SynthGrid } from '@bridger/ui';
import {
  ProfileIntroDivider,
  ProfileIntroGraphic,
  ProfileIntroPadlock
} from './ProfileIntroGraphic';

/** Fixed near-black so this gate matches Events / Discover intro (never eggshell). */
const INTRO_BLACK = '#0E0E0E';
/** Soft white grid lines on black (same SynthGrid as Events, tinted for intro). */
const INTRO_GRID = 'rgba(255,255,255,0.22)';
const ON_BLACK = '#FFFFFF';
const ON_BLACK_MUTE = 'rgba(255,255,255,0.72)';
/** Matches paddingHorizontal on the intro shell. */
const INTRO_PAD_X = 24;

export function ProfileIntro({
  open,
  onContinue
}: {
  open: boolean;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const startedAt = useRef<number | null>(null);
  // Air above/below the dotted line grows a bit on taller phones so the CRT
  // and the lock never crowd the divider.
  const dividerGap = Math.max(28, Math.round(windowHeight * 0.045));

  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    openSurface('profile_intro', 'profile');
    trackFlowStarted('profile_intro');
    return () => {
      dismissSurface('profile_intro');
    };
  }, [open]);

  const finish = () => {
    const ms = startedAt.current != null ? Date.now() - startedAt.current : 0;
    trackFlowCompleted('profile_intro', ms);
    onContinue();
  };

  return (
    <Modal visible={open} animationType="fade" onRequestClose={() => undefined}>
      <View
        style={{
          flex: 1,
          backgroundColor: INTRO_BLACK,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: INTRO_PAD_X
        }}
      >
        {/* Same drifting grid as Events / Home, painted white on the black intro. */}
        <SynthGrid strength="normal" color={INTRO_GRID} />

        <View className="relative z-10 flex-1" style={{ backgroundColor: 'transparent' }}>
        {/* TOP HALF: welcome copy + CRT pushed a bit lower. */}
        <View style={{ flex: 1.15, minHeight: 0 }}>
          <AnalyticsRegion
            analyticsId={PROFILE.intro.body}
            interactive={false}
            accessibilityLabel="Welcome to your profile. This area is all about you."
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <PixelHeading
                size="lg"
                className="leading-tight text-white"
                style={{
                  color: ON_BLACK,
                  textAlign: 'center',
                  fontSize: 38,
                  lineHeight: 44
                }}
              >
                WELCOME
              </PixelHeading>
              <PixelHeading
                size="lg"
                className="leading-tight text-white"
                style={{
                  color: ON_BLACK,
                  marginTop: 4,
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                TO YOUR PROFILE!
              </PixelHeading>
              <Text
                className="mt-3 font-sans-sb text-[16px] leading-relaxed"
                style={{
                  color: ON_BLACK_MUTE,
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                This area is all about you! Make it yours and share it with your friends.
              </Text>
            </View>
          </AnalyticsRegion>

          <View style={{ flex: 1, minHeight: 12, justifyContent: 'center' }}>
            <AnalyticsRegion analyticsId={PROFILE.intro.body} interactive={false}>
              <ProfileIntroGraphic />
            </AnalyticsRegion>
          </View>
        </View>

        {/* BOTTOM HALF: dotted line with roomy air, then lock + Privacy. */}
        <View style={{ flex: 0.85, minHeight: 0, justifyContent: 'flex-start' }}>
          <ProfileIntroDivider
            style={{ marginTop: dividerGap, marginBottom: dividerGap }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 22,
              flex: 1
            }}
            accessible
            accessibilityLabel="Privacy: You decide what you share with who."
          >
            <ProfileIntroPadlock />
            <View style={{ flex: 1, gap: 12, paddingTop: 28 }}>
              <PixelHeading
                size="lg"
                className="leading-tight text-white"
                style={{ color: ON_BLACK, fontSize: 28, lineHeight: 32 }}
              >
                Privacy:
              </PixelHeading>
              <Text
                className="font-sans-sb text-[16px] leading-relaxed"
                style={{ color: ON_BLACK_MUTE }}
              >
                You decide what you share with who.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingTop: 12 }}>
          <ButtonPrimary
            full
            size="lg"
            onPress={finish}
            accessibilityLabel="Hell yeah"
            analyticsId={PROFILE.intro.continue}
          >
            Hell yeah
          </ButtonPrimary>
        </View>
        </View>
      </View>
    </Modal>
  );
}
