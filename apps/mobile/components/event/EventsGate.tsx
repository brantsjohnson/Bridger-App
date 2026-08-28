// ============================================
// WHAT THIS FILE DOES (plain English):
// The Events marketing page before you have looked around. Black intro canvas
// with the drifting graph grid behind it (same family as Discover's first
// look). Big headline at the top, three slow-scrolling rows of idea chips
// centered in the middle, and Explore Events pinned near the bottom. Chips
// are decoration only — they do not fill in the create wizard. Creating
// lives on the header + after you explore.
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
import { EVENT_IDEAS, type EventIdea } from '../../data/fixtures/event-ideas';
import { IdeaMarqueeRow } from './IdeaMarqueeRow';

/** Match ScreenHeader spacing so we size the gate under the title row. */
const HEADER_TOP_PAD = 16;
const HEADER_BOTTOM_PAD = 8;
const GAP_BELOW_HEADER = 10;
const HEADER_ROW = 44;
/** Room for the floating tab bar so the CTA sits above it. */
const TAB_BAR_CLEARANCE = 120;

/** Split the catalog into three interleaved rows so each row feels different. */
function splitRows(ideas: EventIdea[]): [EventIdea[], EventIdea[], EventIdea[]] {
  const a: EventIdea[] = [];
  const b: EventIdea[] = [];
  const c: EventIdea[] = [];
  ideas.forEach((idea, i) => {
    if (i % 3 === 0) a.push(idea);
    else if (i % 3 === 1) b.push(idea);
    else c.push(idea);
  });
  return [a, b, c];
}

export function EventsGate({ onExplore }: { onExplore: () => void }) {
  const [rowA, rowB, rowC] = useMemo(() => splitRows(EVENT_IDEAS), []);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // THIS SECTION DOES: fill the open canvas under the header so the chip wall
  // can sit in the vertical middle and the CTA can sit at the bottom.
  const headerBlock =
    insets.top + HEADER_TOP_PAD + HEADER_ROW + HEADER_BOTTOM_PAD + GAP_BELOW_HEADER;
  const contentMinHeight = Math.max(
    windowHeight - headerBlock - TAB_BAR_CLEARANCE,
    420
  );

  return (
    <View style={{ minHeight: contentMinHeight }} className="pt-2">
      {/* THIS SECTION DOES: the hero line that explains what Events is for */}
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
          to.
        </Text>
      </AnalyticsRegion>

      {/* THIS SECTION DOES: full-bleed marquees centered in the leftover space.
          pointerEvents none so the scrolling chips cannot steal the Explore tap. */}
      <View
        className="-mx-5 gap-2.5"
        pointerEvents="none"
        style={{ flex: 1, justifyContent: 'center', minHeight: 160 }}
      >
        <IdeaMarqueeRow items={rowA} direction={1} durationSec={34} />
        <IdeaMarqueeRow items={rowB} direction={-1} durationSec={40} />
        <IdeaMarqueeRow items={rowC} direction={1} durationSec={36} />
      </View>

      {/* THIS SECTION DOES: leave the gate and open the normal Events list */}
      <View className="z-10 pb-2">
        <ButtonPrimary
          full
          size="lg"
          onPress={onExplore}
          analyticsId={EVENTS.gate.explore}
          accessibilityLabel="Explore Events"
        >
          Explore Events
        </ButtonPrimary>
      </View>
    </View>
  );
}
