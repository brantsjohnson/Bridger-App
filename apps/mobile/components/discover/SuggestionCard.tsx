// ============================================
// WHAT THIS FILE DOES (plain English):
// A "People to meet" card. Leads with the shared thread (why you'd click),
// name underneath, "You both know {friend}", and signal chips. Top match is a
// bigger tinted spotlight; the rest are lighter rows. Bridger is the matchmaker.
// Analytics: suggestion_card / spotlight_card / add. Shared-thread headline is
// tagged for dead_click without nesting a second Pressable (web crashes on that).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { UsersIcon } from 'lucide-react-native';
import type { Suggestion } from '@bridger/shared';
import { DISCOVER, trackDeadClick } from '@bridger/shared';
import {
  ACCENTS,
  ButtonSecondary,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { personById } from '../../data/people';

/** Dead-click on the shared-thread line without nesting a Pressable. */
function SharedThreadLine({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  return (
    <Text
      numberOfLines={2}
      className={className}
      onPress={() => trackDeadClick(DISCOVER.people_to_meet.shared_thread_headline)}
      accessibilityRole="text"
    >
      {text}
    </Text>
  );
}

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
  const cardId = spotlight
    ? DISCOVER.people_to_meet.spotlight_card
    : DISCOVER.people_to_meet.suggestion_card;

  if (spotlight) {
    // Outer View (not Pressable) so Add button is not nested inside another button.
    return (
      <View className={cn('rounded-2xl p-5', token.tintSolid)}>
        <Pressable
          onPress={withAnalyticsPress(cardId, onOpen)}
          accessibilityRole="button"
          accessibilityLabel={`${suggestion.sharedThread}. ${p.name}. You both know ${viaFirst}`}
        >
          <View className="flex-row items-center gap-3">
            {/* Real profile photo when one is dropped in for this person id */}
            <PersonAvatar id={p.id} accent={suggestion.accent} size="lg" />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[12px] uppercase tracking-wide text-onaccent/70">
                Top match
              </Text>
              <SharedThreadLine
                text={suggestion.sharedThread}
                className="font-pixel text-[17px] leading-tight text-onaccent"
              />
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
        </Pressable>

        <View className="mt-4">
          <ButtonSecondary
            full
            size="lg"
            tone="positive"
            onPress={onAdd}
            analyticsId={DISCOVER.people_to_meet.add}
            accessibilityLabel={`Add ${first}`}
          >
            Add {first}
          </ButtonSecondary>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface p-4">
      <Pressable
        onPress={withAnalyticsPress(cardId, onOpen)}
        accessibilityRole="button"
        accessibilityLabel={`${suggestion.sharedThread}. ${p.name}. You both know ${viaFirst}`}
        className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-90"
      >
        <PersonAvatar id={p.id} accent={suggestion.accent} size="lg" />
        <View className="min-w-0 flex-1">
          <SharedThreadLine
            text={suggestion.sharedThread}
            className="font-sans-b text-[16px] tracking-tight text-ink"
          />
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
      </Pressable>
      <ButtonSecondary
        size="sm"
        tone="positive"
        onPress={onAdd}
        analyticsId={DISCOVER.people_to_meet.add}
        accessibilityLabel={`Add ${first}`}
      >
        Add
      </ButtonSecondary>
    </View>
  );
}
