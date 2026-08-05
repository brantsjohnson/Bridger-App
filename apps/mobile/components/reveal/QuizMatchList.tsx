// ============================================
// WHAT THIS FILE DOES (plain English):
// The "how you line up" cards in the reveal. For each matching-only quiz
// (Humor, Values, …) it shows one number — how compatible the two of you are,
// like "95% in Humor" — with a little fill bar in that quiz's color.
// These live only in the connection reveal + In common flow, never on a
// profile card. PRIVACY: only the dimension + number are shown, no answers.
// Colors are fixed cream-on-dark because the reveal stays dark in dark mode.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ACCENTS } from '@bridger/ui';
import type { QuizMatch } from '../../data/discover';

/** Fixed cream on the dark reveal — theme tokens flip in dark mode. */
const ON_DARK = '#F5F0E6';
const ON_DARK_MUTE = 'rgba(245, 240, 230, 0.6)';
const TRACK = 'rgba(245, 240, 230, 0.14)';

export function QuizMatchList({ items }: { items: QuizMatch[] }) {
  if (items.length === 0) return null;

  return (
    <View className="gap-2.5" accessibilityRole="list">
      {items.map((q) => {
        const hex = ACCENTS[q.accent].hex;
        const pct = Math.max(0, Math.min(100, Math.round(q.score)));
        return (
          <View
            key={q.key}
            accessibilityRole="text"
            accessibilityLabel={`${pct} percent compatible in ${q.dimension}`}
            className="rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: 'rgba(245, 240, 230, 0.06)' }}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-[18px]" accessible={false}>
                {q.emoji}
              </Text>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-b text-[15px]" style={{ color: ON_DARK }}>
                  <Text style={{ color: hex }}>{pct}% compatible</Text>
                  <Text style={{ color: ON_DARK }}> in {q.dimension}</Text>
                </Text>
              </View>
            </View>

            {/* Fill bar in the quiz's color */}
            <View
              accessible={false}
              className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: TRACK }}
            >
              <View
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: hex }}
              />
            </View>
          </View>
        );
      })}
      <Text className="mt-0.5 text-center font-sans-md text-[11px]" style={{ color: ON_DARK_MUTE }}>
        From the quizzes you both took
      </Text>
    </View>
  );
}
