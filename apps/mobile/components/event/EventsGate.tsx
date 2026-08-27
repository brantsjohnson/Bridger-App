// ============================================
// WHAT THIS FILE DOES (plain English):
// The Events marketing page before you have looked around. Black intro canvas
// (same family as Discover's first look). Big headline,
// three slow-scrolling rows of idea chips (plus tiny Touch Grass marks), and
// an Explore Events button that opens the normal Events tab (Touch Grass +
// calendar). Chips are decoration only — they do not fill in the create
// wizard for you. Creating still lives on the header +.
// ============================================
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { EVENTS } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  PixelHeading
} from '@bridger/ui';
import { EVENT_IDEAS, type EventIdea } from '../../data/fixtures/event-ideas';
import { IdeaMarqueeRow } from './IdeaMarqueeRow';

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

  return (
    <View className="gap-5 pb-8 pt-2">
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
          className="font-sans-sb text-[14px] leading-relaxed text-white/80"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Plans, dinners, clubs, nights out. Start something people can return
          to.
        </Text>
      </AnalyticsRegion>

      {/* THIS SECTION DOES: full-bleed marquees that clip at the screen edges.
          pointerEvents none so the scrolling chips cannot steal the Explore tap
          or open a dead-click region over the button. */}
      <View className="-mx-5 gap-2.5" pointerEvents="none">
        <IdeaMarqueeRow items={rowA} direction={1} durationSec={34} />
        <IdeaMarqueeRow items={rowB} direction={-1} durationSec={40} />
        <IdeaMarqueeRow items={rowC} direction={1} durationSec={36} />
      </View>

      {/* THIS SECTION DOES: leave the gate and open the normal Events list */}
      <View className="z-10 gap-2.5">
        <ButtonPrimary
          full
          size="lg"
          onPress={onExplore}
          analyticsId={EVENTS.gate.explore}
          accessibilityLabel="Explore Events"
        >
          Explore Events
        </ButtonPrimary>
        <Text
          className="text-center font-sans-sb text-[12px] leading-snug text-white/60"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Even two people counts. Or use Touch Grass when you are free tonight.
        </Text>
      </View>
    </View>
  );
}
