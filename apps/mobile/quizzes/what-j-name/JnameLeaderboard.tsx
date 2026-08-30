// ============================================
// WHAT THIS FILE DOES (plain English):
// The "your version of Jake" board. Friends who took the quiz are grouped by
// the J-name they got. Under each friend we show how compatible you two are on
// this quiz (a fun %). The Home teaser shows the top 3 busiest groups; this
// full list grows as more friends take it. Account required: only signed-in
// people see friend results (the free web page stays gated).
// ============================================

import React from 'react';
import { Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { AvatarStack, cn } from '@bridger/ui';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { personById } from '../../data/people';

export type LeaderboardFriend = {
  userId: string;
  percent: number;
  compatibilityPercent: number;
};

export type LeaderboardBucket = {
  jName: string;
  friendIds: string[];
  friends?: LeaderboardFriend[];
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
  title = 'Your versions',
  /** When true, list each friend with a % compatible line. */
  showCompatibility = true
}: {
  buckets: LeaderboardBucket[];
  limit?: number;
  title?: string;
  showCompatibility?: boolean;
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
          const detail =
            b.friends && b.friends.length > 0
              ? b.friends
              : b.friendIds.map((userId) => ({
                  userId,
                  percent: 0,
                  compatibilityPercent: 0
                }));
          return (
            <View
              key={b.jName}
              accessible
              accessibilityLabel={`Your version of ${b.jName}, ${b.friendIds.length} friends`}
              className={cn(
                'w-full rounded-card border border-ink-line bg-surface px-4 py-3'
              )}
            >
              <View className="flex-row items-center gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-b text-[13px] text-ink" numberOfLines={1}>
                    Your version of {b.jName}
                  </Text>
                  <Text className="mt-0.5 font-sans-sb text-[11px] text-ink-mute">
                    {b.friendIds.length}{' '}
                    {b.friendIds.length === 1 ? 'friend' : 'friends'}
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
                      photo: avatarPhotoFor(id, p.avatarUrl)
                    };
                  })}
                />
              </View>

              {/* THIS SECTION DOES: how compatible you are with each friend here. */}
              {showCompatibility ? (
                <View className="mt-3 gap-1.5 border-t border-ink-line pt-2.5">
                  {detail.map((f) => {
                    const p = personById(f.userId);
                    const name = p.name?.split(/\s+/)[0] || 'Friend';
                    const matched = f.compatibilityPercent >= 82;
                    return (
                      <View
                        key={f.userId}
                        className="flex-row items-center justify-between gap-2"
                        accessible
                        accessibilityLabel={
                          matched
                            ? `You and ${name} matched, ${f.compatibilityPercent} percent compatible`
                            : `${name}, ${f.compatibilityPercent} percent compatible`
                        }
                      >
                        <Text className="min-w-0 flex-1 font-sans-sb text-[12px] text-ink" numberOfLines={1}>
                          {matched ? `You and ${name} matched` : name}
                        </Text>
                        <Text className="font-sans-b text-[12px] text-purple">
                          {f.compatibilityPercent}% compatible
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
