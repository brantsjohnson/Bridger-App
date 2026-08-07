// ============================================
// WHAT THIS FILE DOES (plain English):
// The menu of all 14 profile fill modules: description, time estimate,
// Continue / Edit. Own profile opens this from "Add to your profile" or
// Favorites "to start". Cancel saves nothing (ModuleFlow owns that).
// ============================================
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { PROFILE } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { PROFILE_MODULES, type ProfileModuleId } from '../../data/profile-modules';

/** Canonical 14 modules for the menu (skip legacy aliases). */
const MENU_IDS: ProfileModuleId[] = [
  'about_basics',
  'about_deeper',
  'hobbies',
  'food_drinks',
  'entertainment',
  'everyday',
  'sports',
  'this_or_that',
  'places',
  'top5',
  'obsession',
  'timeline',
  'recommendations',
  'goals'
];

export function ModuleMenuSheet({
  open,
  onClose,
  onOpenModule,
  answeredCounts = {}
}: {
  open: boolean;
  onClose: () => void;
  onOpenModule: (id: ProfileModuleId) => void;
  answeredCounts?: Partial<Record<string, number>>;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const cards = PROFILE_MODULES.filter((m) => MENU_IDS.includes(m.id));

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
        className="flex-1 bg-canvas"
      >
        <View className="flex-row items-center gap-3 px-4 pb-3">
          <Pressable
            onPress={withAnalyticsPress(PROFILE.module.cancel, onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close module menu"
            className="h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-surface"
          >
            <XIcon size={18} color={c.ink} strokeWidth={2.4} />
          </Pressable>
          <Text className="font-pixel text-[18px] text-ink">Add to your profile</Text>
        </View>
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24, gap: 10 }}>
          {cards.map((m) => {
            const count = answeredCounts[m.id] ?? 0;
            const label = count > 0 ? 'Edit' : 'Continue';
            return (
              <Pressable
                key={m.id}
                onPress={withAnalyticsPress(PROFILE.card.add_module, () => {
                  onOpenModule(m.id);
                  onClose();
                })}
                accessibilityRole="button"
                accessibilityLabel={`${m.label}. ${m.line}. About ${m.minutes} minutes. ${label}.`}
                className="min-h-[72px] flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
              >
                <Text accessible={false} className="text-[28px]">
                  {m.emoji}
                </Text>
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-b text-[15px] text-ink">{m.label}</Text>
                  <Text numberOfLines={2} className="font-sans-sb text-[12px] text-ink-mute">
                    {m.line} · ~{m.minutes} min
                    {count > 0 ? ` · ${count} answered` : ''}
                  </Text>
                </View>
                <Text className="font-sans-b text-[13px] text-purple">{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
