// ============================================
// WHAT THIS FILE DOES (plain English):
// Things two people share. One color per row; if both answered a hobby
// follow-up, their answers can sit in a dark panel underneath. Discover only
// shows the hobby titles (showAnswers=false); the reveal + In common flow show
// the actual answers (showAnswers=true, the default).
// Labels on the pastel cards stay near-black so they stay readable in dark mode.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { StarIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, cn } from '@bridger/ui';
import type { Commonality } from '../../data/discover';

const ACCENT_CYCLE: Accent[] = ['amber', 'teal', 'pink', 'blue', 'purple', 'coral'];
const GLYPHS = ['🎤', '🗼', '🌅', '🎧', '🍜', '📚'];

/** Near-black on pastel tint cards — text-ink goes cream in dark mode and vanishes. */
const ON_TINT = '#1C1B16';

export function CommonalityList({
  items,
  theirName = 'They',
  showAnswers = true
}: {
  items: Commonality[];
  theirName?: string;
  /** When false, only the hobby title shows (Discover). Reveal/In common pass true. */
  showAnswers?: boolean;
}) {
  return (
    <View className="gap-2.5" accessibilityRole="list">
      {items.map((c, i) => {
        const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
        const token = ACCENTS[accent];
        const paired = showAnswers && Boolean(c.yours && c.theirs);

        return (
          <View
            key={c.key}
            className={cn('overflow-hidden rounded-2xl border border-ink-line', token.tintSolid)}
          >
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <View
                accessible={false}
                className={cn(
                  'h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  token.bg
                )}
              >
                {c.strongest ? (
                  <StarIcon
                    size={16}
                    color={ON_TINT}
                    strokeWidth={2.6}
                    fill={ON_TINT}
                  />
                ) : (
                  <Text className="text-[16px]">{GLYPHS[i % GLYPHS.length]}</Text>
                )}
              </View>
              <Text
                className="min-w-0 flex-1 font-sans-b text-[14px] leading-snug"
                style={{ color: ON_TINT }}
              >
                {c.label}
              </Text>
            </View>

            {paired ? (
              <View className="mx-3 mb-3 gap-2 rounded-[14px] bg-[#1C1B16] px-3.5 py-3">
                <Answer who="You" text={c.yours!} hex={token.hex} />
                <Answer who={theirName} text={c.theirs!} hex={token.hex} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function Answer({ who, text, hex }: { who: string; text: string; hex: string }) {
  return (
    <View className="min-w-0">
      <Text
        className="font-sans-b text-[10px] uppercase tracking-wide"
        style={{ color: hex }}
      >
        {who}
      </Text>
      <Text className="font-sans-sb text-[13px] leading-snug text-white">{text}</Text>
    </View>
  );
}
