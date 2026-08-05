// ============================================
// WHAT THIS FILE DOES (plain English):
// Faces of people you and this friend both know. Lives at the top of the
// In common tab — opened when someone taps "N mutuals" on the profile header.
// Tap a face to open that person's profile.
// Analytics: profile.in_common.mutual_row — no names in the event.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PROFILE, type Person } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';

export function MutualFriendsStrip({
  people,
  onOpenPerson
}: {
  people: Person[];
  onOpenPerson?: (id: string) => void;
}) {
  if (people.length === 0) return null;

  return (
    <View
      accessibilityLabel={`${people.length} mutual friends`}
      className="gap-2"
    >
      <Text className="font-sans-b text-[13px] text-ink">
        {people.length} mutual{people.length === 1 ? '' : 's'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 8 }}
      >
        {people.map((p) => (
          <Pressable
            key={p.id}
            onPress={withAnalyticsPress(PROFILE.in_common.mutual_row, () =>
              onOpenPerson?.(p.id)
            )}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            className="w-14 items-center gap-1 active:opacity-80"
          >
            <PersonAvatar id={p.id} size="md" />
            <Text numberOfLines={1} className="w-full text-center font-sans-sb text-[11px] text-ink">
              {p.name.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
