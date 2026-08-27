// ============================================
// WHAT THIS FILE DOES (plain English):
// The "your version of Jake" board. Friends who took the quiz are grouped by
// the J-name they got. The Home teaser shows the top 3 busiest groups; this
// full list grows as more friends take it (or get added). Account required:
// only signed-in people see friend results (the free web page stays gated).
// ============================================

import React from 'react';
import { Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { AvatarStack, cn } from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { personById } from '../../data/people';

export type LeaderboardBucket = {
  jName: string;
  friendIds: string[];
};

const ACCENT_BY_NAME: Record<string, Accent> = {
  Justin: 'pink',
  Josh: 'green',
  Joey: 'amber',
  James: 'blue',
  Jake: 'coral',
  Jared: 'purple',
  John: 'teal'
};

export function JnameLeaderboard({
  buckets,
  /** When set, only show this many rows (Home teaser). */
  limit,
  title = 'Your versions'
}: {
  buckets: LeaderboardBucket[];
  limit?: number;
  title?: string;
}) {
  const shown = typeof limit === 'number' ? buckets.slice(0, limit) : buckets;
  if (!shown.length) {
    return (
      <View
        accessible
        accessibilityLabel="No friends have taken the quiz yet"
        className="rounded-card border border-ink-line bg-surface px-4 py-5"
      >
        <Text className="text-center font-sans-sb text-[13px] text-ink-mute">
          When friends take it, they show up here as your version of each J.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        accessibilityRole="header"
        className="mb-3 font-sans-b text-[15px] text-ink"
      >
        {title}
      </Text>
      <View className="gap-2.5">
        {shown.map((b) => {
          const accent = ACCENT_BY_NAME[b.jName] ?? 'purple';
          return (
            <View
              key={b.jName}
              accessible
              accessibilityLabel={`Your version of ${b.jName}, ${b.friendIds.length} friends`}
              className={cn(
                'w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-4 py-3'
              )}
            >
              <View className="min-w-0 flex-1">
                <Text className="font-sans-b text-[13px] text-ink" numberOfLines={1}>
                  Your version of {b.jName}
                </Text>
                <Text className="mt-0.5 font-sans-sb text-[11px] text-ink-mute">
                  {b.friendIds.length} {b.friendIds.length === 1 ? 'friend' : 'friends'}
                </Text>
              </View>
              <AvatarStack
                people={b.friendIds.slice(0, 4).map((id) => {
                  const p = personById(id);
                  return {
                    name: p.name,
                    emoji: p.emoji,
                    accent: (p.accent as Accent) ?? accent,
                    personId: id,
                    photo: getProfilePhoto(id)
                  };
                })}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
