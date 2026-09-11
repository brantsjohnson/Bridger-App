// ============================================
// WHAT THIS FILE DOES (plain English):
// The Events marketing page before you have looked around. Black intro canvas
// with the drifting graph grid behind it. Big headline, ONE slow-scrolling row
// of idea chips (a rolling strip, not a wall of options), and Explore Events
// pinned near the bottom. Chips are decoration only.
// ============================================
import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EVENTS } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  PixelHeading
} from '@bridger/ui';
import { EVENT_IDEAS } from '../../data/fixtures/event-ideas';
import { GateCtaProgress } from '../GateCtaProgress';
import { useGateProgress } from '../../hooks/useGateProgress';
import { IdeaMarqueeRow } from './IdeaMarqueeRow';

/** Device key for the 15 second CTA charge-up (time left, in milliseconds). */
const EVENTS_GATE_CHARGE_KEY = 'bridger.gate.events.charge_remaining_ms';

/** Match ScreenHeader spacing so we size the gate under the title row. */
const HEADER_TOP_PAD = 16;
const HEADER_BOTTOM_PAD = 8;
const GAP_BELOW_HEADER = 10;
const HEADER_ROW = 44;
/** Room for the floating tab bar so the CTA sits above it. */
const TAB_BAR_CLEARANCE = 120;

export function EventsGate({ onExplore }: { onExplore: () => void }) {
  // THIS SECTION DOES: charge the CTA over 15 total seconds of looking at this
  // page (pauses when you leave, resumes where it stopped next visit).
  const { done: ctaReady, progress } = useGateProgress(EVENTS_GATE_CHARGE_KEY);
  // One rolling row: enough ideas to feel lively without a 3-row wall.
  const row = useMemo(() => EVENT_IDEAS.slice(0, 12), []);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const headerBlock =
    insets.top + HEADER_TOP_PAD + HEADER_ROW + HEADER_BOTTOM_PAD + GAP_BELOW_HEADER;
  const contentMinHeight = Math.max(
    windowHeight - headerBlock - TAB_BAR_CLEARANCE,
    420
  );

  return (
    <View style={{ minHeight: contentMinHeight }} className="pt-2">
      <AnalyticsRegion
        analyticsId={EVENTS.gate.headline}
        interactive={false}
        accessibilityLabel="Create places where memories happen."
      >
        <PixelHeading
          size="lg"
          className="leading-tight text-white"
          style={{ color: '#FFFFFF' }}
        >
          Create places where memories happen.
        </PixelHeading>
      </AnalyticsRegion>

      <AnalyticsRegion analyticsId={EVENTS.gate.body} interactive={false}>
        <Text
          className="mt-5 font-sans-sb text-[14px] leading-relaxed text-white/80"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Plans, dinners, clubs, nights out. Start something people can return
          to. After you explore, Touch Grass is at the top: tell friends you are
          free in one tap.
        </Text>
      </AnalyticsRegion>

      {/* THIS SECTION DOES: one horizontal idea strip (not a 3-row grid wall). */}
      <View
        className="-mx-5"
        pointerEvents="none"
        style={{ flex: 1, justifyContent: 'center', minHeight: 96 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <IdeaMarqueeRow items={row} direction={1} durationSec={42} />
      </View>

      <View className="z-10 pb-2">
        {/* THIS SECTION DOES: show the charging bar until the 15 seconds are
            done, then swap in the real Explore Events button. */}
        {ctaReady ? (
          <ButtonPrimary
            full
            size="lg"
            onPress={onExplore}
            analyticsId={EVENTS.gate.explore}
            accessibilityLabel="Explore Events"
          >
            Explore Events
          </ButtonPrimary>
        ) : (
          <GateCtaProgress
            progress={progress}
            analyticsId={EVENTS.gate.cta_loading}
            label="Loading your Events space"
          />
        )}
      </View>
    </View>
  );
}
