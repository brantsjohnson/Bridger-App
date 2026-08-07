// ============================================
// WHAT THIS FILE DOES (plain English):
// Side-by-side hobby follow-up answers on a friend's In common tab: your
// answer next to theirs for the same hobby. Never logs the answer text.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { PROFILE_GUTTER, PROFILE_META_GAP, PROFILE_SECTION_TITLE_SIZE } from './profileSpacing';

export type SideBySideHobby = {
  id: string;
  label: string;
  emoji?: string;
  yours: string;
  theirs: string;
};

export function InCommonAnswers({
  theirName,
  rows
}: {
  theirName: string;
  rows: SideBySideHobby[];
}) {
  if (rows.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: PROFILE_GUTTER }}>
      <AnalyticsRegion analyticsId={PROFILE.in_common.section_header} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Shared hobbies
        </Text>
        <Text
          className="font-sans-sb text-[13px] text-ink-mute"
          style={{ marginTop: PROFILE_META_GAP }}
        >
          Both of your answers, side by side
        </Text>
      </AnalyticsRegion>
      <View className="mt-3 gap-3">
        {rows.map((r) => (
          <View
            key={r.id}
            className="rounded-card border border-ink-line bg-surface px-3.5 py-3"
          >
            <Text className="mb-2 font-sans-b text-[14px] text-ink">
              {r.emoji ? `${r.emoji} ` : ''}
              {r.label}
            </Text>
            <View className="flex-row gap-2">
              <View className="min-w-0 flex-1 rounded-xl bg-green/15 px-2.5 py-2">
                <Text className="font-sans-b text-[10px] uppercase tracking-wide text-ink-mute">
                  You
                </Text>
                <Text className="mt-0.5 font-sans-sb text-[13px] text-ink">{r.yours}</Text>
              </View>
              <View className="min-w-0 flex-1 rounded-xl bg-blue/15 px-2.5 py-2">
                <Text className="font-sans-b text-[10px] uppercase tracking-wide text-ink-mute">
                  {theirName}
                </Text>
                <Text className="mt-0.5 font-sans-sb text-[13px] text-ink">{r.theirs}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
