// ============================================
// WHAT THIS FILE DOES (plain English):
// The week picker on the Friend Pod page. This week is always there.
// Co-op members can tap an older locked week. Free Lite sees one extra
// chip that opens join co-op. No voice counts on the chips.
// ============================================
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { RecapWeekListItem } from '@bridger/shared';
import { RECAP_PLAYER } from '@bridger/shared';
import {
  AnalyticsRegion,
  Chip,
  useResponsiveLayout
} from '@bridger/ui';

export function RecapWeekStrip({
  weeks,
  selectedId,
  canBrowsePast,
  onSelectWeek,
  onJoinCoop
}: {
  weeks: RecapWeekListItem[];
  selectedId?: string;
  canBrowsePast: boolean;
  onSelectWeek: (weekId: string) => void;
  onJoinCoop?: () => void;
}) {
  const { contentMaxWidth } = useResponsiveLayout();
  // THIS SECTION DOES: hide the strip when a member only has this week.
  const show = weeks.length > 1 || !canBrowsePast;

  if (!show) return null;

  return (
    <View
      className="gap-2"
      style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}
    >
      <AnalyticsRegion
        analyticsId={RECAP_PLAYER.weeks.body}
        interactive={false}
      >
        <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
          Weeks
        </Text>
      </AnalyticsRegion>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {weeks.map((w) => {
          const label = w.isCurrent
            ? 'This week'
            : w.weekOf.replace(/^Week of\s*/i, '');
          return (
            <Chip
              key={w.id}
              label={label}
              size="sm"
              selected={w.id === selectedId}
              accessibilityLabel={w.isCurrent ? 'This week' : w.weekOf}
              analyticsId={RECAP_PLAYER.weeks.row}
              analyticsProps={{ method: w.isCurrent ? 'current' : 'past' }}
              onPress={() => onSelectWeek(w.id)}
            />
          );
        })}
        {!canBrowsePast ? (
          <Chip
            label="Earlier weeks"
            size="sm"
            accent="amber"
            accessibilityLabel="Earlier weeks, join co-op"
            analyticsId={RECAP_PLAYER.weeks.join}
            onPress={onJoinCoop}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
