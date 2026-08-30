// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Popular tracks" slot: up to 5 numbered things anyone who knows you
// well should know. Optional emoji/image per row. Own profile can empty-state
// into the Top 5 module.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Top5Item } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import {
  PROFILE_ROW_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

export function Top5Section({
  items,
  editable,
  own,
  onAdd,
  onPressRow
}: {
  items: Top5Item[];
  editable?: boolean;
  /** Own profile can always add/fill, even when not in rearrange (Edit) mode. */
  own?: boolean;
  onAdd?: () => void;
  onPressRow?: (item: Top5Item) => void;
}) {
  const ordered = [...items].sort((a, b) => a.order - b.order).slice(0, 5);
  // THIS SECTION DOES: show the "Add" button whenever it's your own profile,
  // not only while the layout Edit toggle is on.
  const canAdd = editable || own;

  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.top5} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Top 5
        </Text>
        <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
          5 things anyone who knows me should know
        </Text>
      </AnalyticsRegion>

      <View style={{ marginTop: PROFILE_TITLE_TO_BODY, gap: PROFILE_ROW_GAP }}>
        {ordered.length === 0 ? (
          canAdd ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.card.add_details, () => onAdd?.())}
              accessibilityRole="button"
              accessibilityLabel="Add your Top 5"
              className="min-h-[44px] items-center justify-center rounded-card border border-dashed border-ink-line px-4 py-4"
            >
              <Text className="font-sans-b text-[14px] text-ink">Add your Top 5</Text>
            </Pressable>
          ) : (
            <Text className="font-sans-sb text-[14px] text-ink-mute">Nothing shared yet.</Text>
          )
        ) : (
          ordered.map((item, i) => (
            <Pressable
              key={item.id}
              disabled={!editable}
              onPress={
                editable
                  ? withAnalyticsPress(PROFILE.card.top5_row, () => onPressRow?.(item))
                  : undefined
              }
              accessibilityRole={editable ? 'button' : 'text'}
              accessibilityLabel={`${i + 1}. ${item.text}`}
              className="min-h-[56px] flex-row items-center gap-3"
            >
              <Text className="w-5 font-sans-b text-[14px] text-ink-mute">{i + 1}</Text>
              <View className="h-12 w-12 items-center justify-center rounded-lg border border-ink-line bg-surface">
                <Text className="text-[22px]">{item.emoji ?? '✨'}</Text>
              </View>
              <Text numberOfLines={2} className="min-w-0 flex-1 font-sans-b text-[15px] text-ink">
                {item.text}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
