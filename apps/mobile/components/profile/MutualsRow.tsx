// ============================================
// WHAT THIS FILE DOES (plain English):
// The Spotify "You liked" slot: mutual friends faces. Tap opens In common /
// who you both know. Own profile typically hides this (no mutuals with self).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Person } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { Avatar, withAnalyticsPress } from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { PROFILE_SECTION_TITLE_SIZE } from './profileSpacing';

export function MutualsRow({
  mutuals,
  onPress
}: {
  mutuals: Person[];
  onPress?: () => void;
}) {
  if (mutuals.length === 0) return null;
  const shown = mutuals.slice(0, 4);
  const extra = Math.max(0, mutuals.length - shown.length);

  return (
    <Pressable
      onPress={withAnalyticsPress(PROFILE.card.mutuals, () => onPress?.())}
      accessibilityRole="button"
      accessibilityLabel={`${mutuals.length} mutual friends. Who you both know.`}
      className="min-h-[56px] flex-row items-center gap-3"
    >
      <View className="flex-row">
        {shown.map((p, i) => (
          <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: shown.length - i }}>
            <Avatar
              name={p.name}
              emoji={p.emoji}
              accent={p.accent}
              photo={getProfilePhoto(p.id)}
              size="sm"
            />
          </View>
        ))}
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="font-sans-b text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE - 4 }}
        >
          Mutuals
        </Text>
        <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
          {mutuals.length} friend{mutuals.length === 1 ? '' : 's'}
          {extra > 0 ? ` · +${extra}` : ''} · who you both know
        </Text>
      </View>
      <Text className="font-sans-sb text-[16px] text-ink-mute">›</Text>
    </Pressable>
  );
}
