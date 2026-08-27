// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny decorative event idea card for the Events marketing gate wall.
// Looks like a mini event cover + title. Not tappable for create/prefill —
// it is only there so people see what Events can be for. Touch Grass marks
// use the same green Sprout icon as the big Touch Grass button.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { SproutIcon } from 'lucide-react-native';
import { EVENTS } from '@bridger/shared';
import { AnalyticsRegion, CoverArt, cn } from '@bridger/ui';
import type { EventIdea } from '../../data/fixtures/event-ideas';

export function EventIdeaChip({ idea }: { idea: EventIdea }) {
  const isGrass = idea.kind === 'touch_grass';

  return (
    <AnalyticsRegion
      analyticsId={
        isGrass ? EVENTS.gate.touch_grass_mark : EVENTS.gate.idea_chip
      }
      interactive={false}
      accessibilityLabel={idea.title}
      className={cn(
        'h-24 w-[118px] overflow-hidden rounded-card border border-ink-line',
        isGrass ? 'bg-[#E8F6E9]' : 'bg-surface'
      )}
    >
      {/* THIS SECTION DOES: mini cover — Sprout for TG, emoji cover for ideas */}
      {isGrass ? (
        <View className="h-[42px] w-full items-center justify-center bg-green">
          <SproutIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      ) : (
        <View className="h-[42px] w-full overflow-hidden">
          <CoverArt
            cover={{ kind: 'emoji', value: idea.emoji }}
            accent={idea.accent}
          />
        </View>
      )}
      <View className="flex-1 justify-center px-2 py-1.5">
        <Text
          numberOfLines={2}
          className={cn(
            'font-sans-b text-[11px] leading-snug',
            isGrass ? 'text-[#1F7A42]' : 'text-ink'
          )}
        >
          {idea.title}
        </Text>
      </View>
    </AnalyticsRegion>
  );
}
