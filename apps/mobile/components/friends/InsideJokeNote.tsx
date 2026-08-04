// ============================================
// WHAT THIS FILE DOES (plain English):
// One Inside Joke sticky note. Front shows the quote + whose words they are.
// Tap flips to the credits (who posted it, where, when). The folded corner is
// drawn with Views because React Native has no CSS sticky-note class.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { InsideJoke } from '@bridger/shared';
import { ACCENTS, Avatar, cn } from '@bridger/ui';
import { personById } from '../../data/people';

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'] as const;

export function InsideJokeNote({ joke, index = 0 }: { joke: InsideJoke; index?: number }) {
  const token = ACCENTS[joke.accent];
  const [meta, setMeta] = useState(false);
  const quoted = joke.quotedId ? personById(joke.quotedId) : null;
  const poster = joke.postedById ? personById(joke.postedById) : null;
  const tagged = joke.taggedIds?.length ?? 0;

  return (
    <View className={cn('relative w-full overflow-hidden p-4 pb-6', token.bg, TILTS[index % TILTS.length])}>
      {/* folded corner — visual only */}
      <View
        accessible={false}
        pointerEvents="none"
        className="absolute bottom-0 right-0 h-5 w-5 border-b-[10px] border-l-[10px] border-b-ink/10 border-l-transparent bg-white/40"
      />

      <Pressable
        onPress={() => setMeta((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: meta }}
        accessibilityLabel={meta ? 'Hide details' : 'Who posted this'}
        className="w-full"
      >
        {meta ? (
          <View className="gap-2">
            <Credit label="Said by" value={quoted?.name ?? joke.fromName} textClass={token.text} />
            {poster ? (
              <Credit
                label="Posted by"
                value={`${poster.id === 'me' ? 'You' : poster.name}${joke.postedAt ? ` · ${joke.postedAt}` : ''}`}
                textClass={token.text}
              />
            ) : null}
            {joke.eventName ? (
              <Credit label="Where" value={joke.eventName} textClass={token.text} />
            ) : null}
            {tagged > 0 ? (
              <Credit
                label="Also in it"
                value={`${tagged} ${tagged === 1 ? 'person' : 'people'}`}
                textClass={token.text}
              />
            ) : null}
          </View>
        ) : (
          <>
            <Text className={cn('font-sans-b text-[14px] leading-snug', token.text)}>
              “{joke.text}”
            </Text>
            <View className="mt-2.5 flex-row items-center gap-2 pr-5">
              {quoted ? (
                <Avatar
                  name={quoted.name}
                  emoji={quoted.emoji}
                  accent={quoted.accent}
                  size="xs"
                />
              ) : null}
              <Text numberOfLines={1} className={cn('flex-1 font-sans-b text-[11px] opacity-75', token.text)}>
                {joke.fromName}
                {joke.eventName ? ` · ${joke.eventName}` : ''}
              </Text>
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

function Credit({
  label,
  value,
  textClass
}: {
  label: string;
  value: string;
  textClass: string;
}) {
  return (
    <View>
      <Text className={cn('font-sans-b text-[11px] opacity-60', textClass)}>{label}</Text>
      <Text className={cn('font-sans-b text-[13px]', textClass)}>{value}</Text>
    </View>
  );
}

/**
 * The "+" tile that sits among the notes. An empty wall still reads as
 * something to fill in rather than a void.
 */
export function AddNoteTile({
  label = 'Add an Inside Joke',
  onPress,
  tall = false
}: {
  label?: string;
  onPress?: () => void;
  tall?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'w-full items-center justify-center gap-1.5 border-2 border-dashed border-ink-line bg-surface/60 p-4 active:bg-[#F1ECFF]',
        tall ? 'min-h-[132px]' : 'min-h-[104px]'
      )}
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-purple">
        <Text className="font-sans-b text-[18px] leading-none text-white">+</Text>
      </View>
      <Text className="text-center font-sans-b text-[13px] text-ink-soft">{label}</Text>
    </Pressable>
  );
}
