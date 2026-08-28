// ============================================
// WHAT THIS FILE DOES (plain English):
// The blue splash that comes right before the co-op join page. In plain words
// it explains WHAT a co-op is and WHY Bridger is one, so the join page after it
// makes sense. No form here, just a short read and a green button to continue.
//
// The idea, in simple terms:
//  - Most apps make money by keeping you hooked and selling your attention.
//  - A co-op is different: the people who use it can own a piece and get a vote.
//  - So the choices that made other apps addictive have a check (the members).
//  - Connection should never be locked away, so Bridger is free to use.
//  - Joining the co-op is what keeps it free of addictive ads.
//
// LOOK: flat blue page (same family as the four reality-check "stat" screens),
// cream display headline, cream body copy, a light-red accent eyebrow, and a
// green square "See what you get" button at the bottom with a quiet Back link.
//
// ACCESSIBILITY: the paragraphs are one readable block; the button says what it
// does and clears 44pt; Back keeps a 44pt tap target via hitSlop. Nothing here
// depends on color alone. This screen is static, so Reduce Motion changes
// nothing.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OB } from './onboarding-theme';
import { OBCTA } from './onboarding-ui';

// THIS SECTION DOES: cream + accent type that stays light on the blue page in
// both light and dark mode (never text-ink / text-canvas, which flip to black).
const ON_BLUE = OB.onColor;
const ON_BLUE_MUTE = 'rgba(255,255,255,0.68)';
const ON_BLUE_ACCENT = OB.redOnBlue;

/** The plain-language explainer lines, in reading order. */
const LINES: { text: string; strong?: boolean }[] = [
  { text: 'Most apps make money by keeping you hooked and selling your attention. You are the product.' },
  {
    text: 'A co-op is different. The people who use it can own a piece of it and get a vote.',
    strong: true
  },
  {
    text: 'So the choices that made other apps addictive have a check: the members, not just advertisers.'
  },
  { text: 'Connection should never be locked away, so Bridger is free to use.', strong: true },
  { text: 'Joining the co-op is what keeps it that way, paid for by people instead of ads.' }
];

export function CoopIntroStep({
  onNext,
  onBack
}: {
  /** Move on to the co-op join page. */
  onNext: () => void;
  /** Step back to the previous screen (the screen-time stat). */
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: OB.blue }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 28,
          paddingBottom: Math.max(insets.bottom, 12) + 16,
          justifyContent: 'space-between',
          gap: 28
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* THE MESSAGE: eyebrow, big headline, then the short explainer block. */}
        <AnalyticsRegion
          analyticsId={ONBOARDING.coop_intro.body}
          interactive={false}
          accessibilityLabel="Bridger is a co-op. What that means."
        >
          <View style={{ gap: 18 }}>
            <Text
              className="font-sans-b text-[13px]"
              style={{
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: ON_BLUE_ACCENT
              }}
            >
              Not an ad machine
            </Text>

            <Text
              className="font-display"
              style={{ fontSize: 44, lineHeight: 46, letterSpacing: -1.4, color: ON_BLUE }}
            >
              Bridger is a co-op
            </Text>

            <View style={{ gap: 14 }}>
              {LINES.map((l, i) => (
                <Text
                  key={i}
                  className={l.strong ? 'font-sans-b' : 'font-sans-sb'}
                  style={{
                    fontSize: l.strong ? 18 : 16,
                    lineHeight: l.strong ? 25 : 23,
                    color: l.strong ? ON_BLUE : ON_BLUE_MUTE
                  }}
                >
                  {l.text}
                </Text>
              ))}
            </View>
          </View>
        </AnalyticsRegion>

        {/* THE BUTTON: green square to continue, plus a quiet Back link. */}
        <View style={{ gap: 6 }}>
          <OBCTA
            label="See what you get"
            tone="green"
            analyticsId={ONBOARDING.coop_intro.continue}
            onPress={onNext}
            accessibilityLabel="See what you get with the co-op"
          />
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={{ alignSelf: 'center', paddingVertical: 2 }}
          >
            <Text
              className="font-sans-sb text-[14px]"
              style={{ color: ON_BLUE_MUTE, textDecorationLine: 'underline' }}
            >
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
