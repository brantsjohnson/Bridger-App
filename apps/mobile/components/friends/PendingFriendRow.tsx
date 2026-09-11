// ============================================
// WHAT THIS FILE DOES (plain English):
// One row for a person who is not on Bridger yet: the card YOU made from
// their contact. Tap it to write notes. When they join with that number,
// this row is replaced by their real profile and your notes stay.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon } from 'lucide-react-native';
import { FRIENDS } from '@bridger/shared';
import { Avatar, withAnalyticsPress } from '@bridger/ui';
import type { PendingPerson } from '../../data/pending-people';

export function PendingFriendRow({
  person,
  onPress
}: {
  person: PendingPerson;
  onPress: () => void;
}) {
  const name = person.displayName?.trim() || 'A friend';
  return (
    <Pressable
      onPress={withAnalyticsPress(FRIENDS.roster.pending_row, onPress)}
      accessibilityRole="button"
      accessibilityLabel={`${name}, not on Bridger yet. Open the card you made.`}
      className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3 active:opacity-90"
    >
      <Avatar name={name} size="md" />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[15px] text-ink" numberOfLines={1}>
          {name}
        </Text>
        <Text className="font-sans-sb text-[12px] text-ink-mute" numberOfLines={1}>
          Not on Bridger yet. You made this card.
        </Text>
      </View>
      <ChevronRightIcon size={16} color="#9A9688" strokeWidth={2.6} />
    </Pressable>
  );
}
