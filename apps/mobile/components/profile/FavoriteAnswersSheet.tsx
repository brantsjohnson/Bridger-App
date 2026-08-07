// ============================================
// WHAT THIS FILE DOES (plain English):
// Read-only sheet that shows a friend's answers for one Favorites album
// (Food & drinks, Entertainment, This or that, …). Used on friend profiles
// so tapping a square never opens the fill-out quiz.
// ============================================
import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { PROFILE } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';
import type { FavGroup, ThisOrThatRow } from '../../data/profile';

/** Maps FavoriteModule ids to the FavGroup.group label in fixtures. */
const MODULE_TO_GROUP: Record<string, string> = {
  food_drinks: 'Food',
  entertainment: 'Entertainment',
  everyday: 'Everyday',
  sports: 'Sports'
};

function totLabel(row: ThisOrThatRow): string {
  if (row.pick === 'both') return `${row.a} + ${row.b}`;
  if (row.pick === 'b') return row.b;
  return row.a;
}

export function FavoriteAnswersSheet({
  open,
  moduleId,
  moduleLabel,
  favs,
  thisOrThat,
  theirName,
  onClose
}: {
  open: boolean;
  moduleId: string | null;
  moduleLabel?: string;
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  theirName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  const title = moduleLabel ?? 'Favorites';
  const lines = useMemo(() => {
    if (!moduleId) return [] as Array<{ label: string; value: string }>;
    if (moduleId === 'this_or_that') {
      return thisOrThat.map((row) => ({
        label: `${row.a} or ${row.b}`,
        value: totLabel(row)
      }));
    }
    const groupName = MODULE_TO_GROUP[moduleId];
    const group = favs.find((g) => g.group === groupName);
    if (!group) return [];
    return group.items.map((item) => ({ label: group.group, value: item }));
  }, [moduleId, favs, thisOrThat]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[80%] rounded-t-3xl bg-surface px-4 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="font-pixel text-[18px] text-ink">{title}</Text>
              <Text className="mt-0.5 font-sans-sb text-[12px] text-ink-mute">
                {theirName}'s answers
              </Text>
            </View>
            <Pressable
              onPress={withAnalyticsPress(PROFILE.card.favorites_tile, onClose, {
                analyticsProps: { method: 'dismiss' }
              })}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-10 w-10 items-center justify-center rounded-full border border-ink-line"
            >
              <XIcon size={18} color={c.ink} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {lines.length === 0 ? (
              <Text className="py-6 text-center font-sans-sb text-[14px] text-ink-mute">
                Nothing shared here.
              </Text>
            ) : moduleId === 'this_or_that' ? (
              <View className="gap-0">
                {lines.map((row, i) => (
                  <View
                    key={`${row.label}-${i}`}
                    className={`py-3 ${i > 0 ? 'border-t border-ink-line' : ''}`}
                  >
                    <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                      {row.label}
                    </Text>
                    <Text className="mt-1 font-sans-sb text-[15px] text-ink">{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="gap-2 pb-2">
                {lines.map((row, i) => (
                  <View
                    key={`${row.value}-${i}`}
                    className="rounded-card border border-ink-line bg-canvas px-3.5 py-3"
                  >
                    <Text className="font-sans-sb text-[15px] text-ink">{row.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
