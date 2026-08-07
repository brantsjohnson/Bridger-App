// ============================================
// WHAT THIS FILE DOES (plain English):
// Events the viewer is invited to with this person (or hosting/attending on
// your own profile). Hidden when empty. No vanity counts.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import {
  PROFILE_ROW_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

export type UpcomingEventRow = {
  id: string;
  title: string;
  whenLabel: string;
  rsvpLabel?: string;
};

export function UpcomingEventsSection({
  events,
  onOpenEvent
}: {
  events: UpcomingEventRow[];
  onOpenEvent?: (id: string) => void;
}) {
  if (events.length === 0) return null;

  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.upcoming} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Upcoming
        </Text>
      </AnalyticsRegion>
      <View style={{ marginTop: PROFILE_TITLE_TO_BODY, gap: PROFILE_ROW_GAP }}>
        {events.map((e) => (
          <Pressable
            key={e.id}
            onPress={withAnalyticsPress(PROFILE.card.upcoming_row, () => onOpenEvent?.(e.id))}
            accessibilityRole="button"
            accessibilityLabel={`${e.title}, ${e.whenLabel}${e.rsvpLabel ? `, ${e.rsvpLabel}` : ''}`}
            className="min-h-[44px] flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
          >
            <Text accessible={false} className="text-ink-mute">
              ▸
            </Text>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                {e.title}
              </Text>
              <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                {e.whenLabel}
                {e.rsvpLabel ? ` · ${e.rsvpLabel}` : ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
