// ============================================
// WHAT THIS FILE DOES (plain English):
// "My Top 5": up to 5 things anyone who knows you well should know. Each row
// is a big colored number and the line of text (the profile redesign). Own
// full profile can empty-state into the Top 5 module. Friend / View-as
// previews hide this section entirely when nothing is visible.
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
import { ProfileAddCard } from './ProfileAddCard';

/** One vivid color per row, same order as the profile redesign. */
const TOP5_COLORS = ['#752bf3', '#2ac20b', '#ffb100', '#0072f0', '#ff4800'];

export function Top5Section({
  items,
  editable,
  own,
  showEmptyCtas,
  onAdd,
  onPressRow
}: {
  items: Top5Item[];
  editable?: boolean;
  /** Own profile can always add/fill, even when not in rearrange (Edit) mode. */
  own?: boolean;
  /**
   * When false (friend view or View as Friends/Everyone), an empty Top 5
   * disappears completely so it does not hint that something is missing.
   */
  showEmptyCtas?: boolean;
  onAdd?: () => void;
  onPressRow?: (item: Top5Item) => void;
}) {
  const ordered = [...items].sort((a, b) => a.order - b.order).slice(0, 5);
  // THIS SECTION DOES: show the "Add" button on your full own profile only.
  const canAdd = showEmptyCtas ?? Boolean(editable || own);

  // PRIVACY / UX: no empty header for viewers. The section simply is not there.
  if (ordered.length === 0 && !canAdd) return null;

  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.top5} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          My Top 5
        </Text>
      </AnalyticsRegion>

      <View style={{ marginTop: PROFILE_TITLE_TO_BODY, gap: PROFILE_ROW_GAP }}>
        {ordered.length === 0 ? (
          <ProfileAddCard
            label="Add your Top 5"
            helper="5 things anyone who knows you should know."
            emoji="⭐"
            accent="amber"
            analyticsId={PROFILE.card.add_details}
            accessibilityLabel="Add your Top 5"
            onPress={() => onAdd?.()}
          />
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
              className="min-h-[44px] flex-row items-center gap-3"
            >
              <Text
                className="w-8 font-sans-b text-[32px] leading-none"
                style={{ color: TOP5_COLORS[i % TOP5_COLORS.length] }}
              >
                {i + 1}
              </Text>
              <Text numberOfLines={2} className="min-w-0 flex-1 font-sans-b text-[18px] text-ink">
                {item.text}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
