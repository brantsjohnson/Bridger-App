// ============================================
// WHAT THIS FILE DOES (plain English):
// Things two people share on a connection detail. One color per row; if both
// answered a hobby follow-up, their answers sit in a white panel underneath.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { StarIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, cn } from '@bridger/ui';
import type { Commonality } from '../../data/discover';

const ACCENT_CYCLE: Accent[] = ['amber', 'teal', 'pink', 'blue', 'purple', 'coral'];
const GLYPHS = ['🎤', '🗼', '🌅', '🎧', '🍜', '📚'];

export function CommonalityList({
  items,
  theirName = 'They'
}: {
  items: Commonality[];
  theirName?: string;
}) {
  return (
    <View className="gap-2.5" accessibilityRole="list">
      {items.map((c, i) => {
        const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
        const token = ACCENTS[accent];
        const paired = Boolean(c.yours && c.theirs);

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
                    color="#1C1B16"
                    strokeWidth={2.6}
                    fill="#1C1B16"
                  />
                ) : (
                  <Text className="text-[16px]">{GLYPHS[i % GLYPHS.length]}</Text>
                )}
              </View>
              <Text className="min-w-0 flex-1 font-sans-b text-[14px] leading-snug text-ink">
                {c.label}
              </Text>
            </View>

            {paired ? (
              <View className="mx-3 mb-3 gap-2 rounded-[14px] bg-surface px-3.5 py-3">
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
      <Text className="font-sans-sb text-[13px] leading-snug text-ink">{text}</Text>
    </View>
  );
}
