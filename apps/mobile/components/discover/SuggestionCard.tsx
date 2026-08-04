// ============================================
// WHAT THIS FILE DOES (plain English):
// A "People to meet" card. Leads with the shared thread (why you'd click),
// name underneath, "You both know {friend}", and signal chips. Top match is a
// bigger tinted spotlight; the rest are lighter rows. Bridger is the matchmaker.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { UsersIcon } from 'lucide-react-native';
import type { Suggestion } from '@bridger/shared';
import { ACCENTS, Avatar, ButtonSecondary, Card, cn } from '@bridger/ui';
import { personById } from '../../data/people';

export function SuggestionCard({
  suggestion,
  spotlight = false,
  onOpen,
  onAdd
}: {
  suggestion: Suggestion;
  spotlight?: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const p = personById(suggestion.personId);
  const via = personById(suggestion.viaFriendId);
  const token = ACCENTS[suggestion.accent];
  const first = p.name.split(' ')[0];
  const viaFirst = via.name.split(' ')[0];

  if (spotlight) {
    return (
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${suggestion.sharedThread}. ${p.name}. You both know ${viaFirst}`}
        className={cn('rounded-2xl p-5', token.tintSolid)}
      >
        <View className="flex-row items-center gap-3">
          <Avatar name={p.name} emoji={p.emoji} accent={suggestion.accent} size="lg" />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[12px] uppercase tracking-wide text-onaccent/70">
              Top match
            </Text>
            <Text className="font-pixel text-[17px] leading-tight text-onaccent">
              {suggestion.sharedThread}
            </Text>
          </View>
        </View>

        <Text className="mt-3 font-sans-b text-[17px] tracking-tight text-onaccent">{p.name}</Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <UsersIcon size={16} color="#1C1B16" strokeWidth={2.4} style={{ opacity: 0.75 }} />
          <Text className="font-sans-sb text-[13px] text-onaccent/75">
            You both know {viaFirst}
          </Text>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {suggestion.signals.map((sig) => (
            <View key={sig} className="rounded-full bg-surface px-3 py-1.5">
              <Text className="font-sans-b text-[12px] text-ink">{sig}</Text>
            </View>
          ))}
        </View>

        <View className="mt-4">
          <ButtonSecondary
            full
            size="lg"
            tone="positive"
            onPress={onAdd}
            accessibilityLabel={`Add ${first}`}
          >
            Add {first}
          </ButtonSecondary>
        </View>
      </Pressable>
    );
  }

  return (
    <Card className="flex-row items-center gap-3 p-4" onPress={onOpen}>
      <Avatar name={p.name} emoji={p.emoji} accent={suggestion.accent} size="lg" />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-sans-b text-[16px] tracking-tight text-ink">
          {suggestion.sharedThread}
        </Text>
        <Text numberOfLines={1} className="font-sans-sb text-[13px] text-ink-soft">
          {p.name}
        </Text>
        <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
          You both know {viaFirst}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {suggestion.signals.slice(0, 3).map((sig) => (
            <View key={sig} className={cn('rounded-full px-2.5 py-1', token.tintSolid)}>
              <Text className="font-sans-b text-[11px] text-onaccent">{sig}</Text>
            </View>
          ))}
        </View>
      </View>
      <ButtonSecondary size="sm" tone="positive" onPress={onAdd} accessibilityLabel={`Add ${first}`}>
        Add
      </ButtonSecondary>
    </Card>
  );
}
