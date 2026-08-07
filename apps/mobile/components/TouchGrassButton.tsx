// ============================================
// WHAT THIS FILE DOES (plain English):
// The big green "TOUCH GRASS" button on Events. One tap opens the sheet where
// you pick who to tell and when. Stays the big button even while your signal
// is live (subtext flips to "you're free" + who's in). Optional X ends it.
// Matches Magic Patterns (organic banner shape).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SproutIcon, XIcon } from 'lucide-react-native';
import { EVENTS } from '@bridger/shared';
import { Avatar, ORGANIC, cn, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../data/people';
import { GrassBurst } from './GrassBurst';
import { GrassGrow } from './GrassGrow';

export function TouchGrassButton({
  live,
  inIds,
  onOpen,
  onEnd,
  analyticsId = EVENTS.touch_grass.send
}: {
  live: boolean;
  inIds: string[];
  onOpen: () => void;
  /** When live, show a small X under the button to end your signal. */
  onEnd?: () => void;
  /** Taxonomy id for the open tap. */
  analyticsId?: string;
}) {
  return (
    <View className="relative">
      <GrassBurst play={live} />
      <Pressable
        onPress={withAnalyticsPress(analyticsId, onOpen)}
        accessibilityRole="button"
        accessibilityLabel={
          live
            ? "You're free. Open Touch Grass"
            : 'Touch grass — tell friends you are free'
        }
        style={ORGANIC.banner}
        className={cn(
          'w-full items-center gap-2 overflow-hidden px-6 py-8 active:opacity-90',
          live ? 'bg-success' : 'bg-green'
        )}
      >
        {/* Grass keeps growing and sinking inside the button until you tap it.
            Once you're live it stops — the point has been made. */}
        <GrassGrow active={!live} />

        <SproutIcon size={32} color="#FFFFFF" strokeWidth={2.2} />
        <Text className="font-pixel text-[26px] leading-none text-white">TOUCH GRASS</Text>
        <Text className="font-sans-sb text-[13px] text-white/85">
          {live ? "you're free" : "tell friends you're free"}
        </Text>
      </Pressable>

      {live ? (
        <View className="mt-2.5 flex-row items-center gap-2 px-1">
          {inIds.length > 0 ? (
            <>
              <View className="flex-row items-center">
                {inIds.map((id, i) => {
                  const p = personById(id);
                  return (
                    <View key={id} className={cn('rounded-full', i > 0 && '-ml-1')}>
                      <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="xs" />
                    </View>
                  );
                })}
              </View>
              <Text className="font-sans-b text-[12px] text-ink-soft">{inIds.length} in</Text>
            </>
          ) : (
            <Text className="min-w-0 flex-1 font-sans-sb text-[12px] text-ink-mute">
              No one yet
            </Text>
          )}
          {onEnd ? (
            <Pressable
              onPress={withAnalyticsPress(EVENTS.touch_grass.end, onEnd)}
              accessibilityRole="button"
              accessibilityLabel="End your Touch Grass signal"
              className="ml-auto h-7 w-7 items-center justify-center rounded-full bg-ink/10 active:opacity-80"
            >
              <XIcon size={14} color="#1C1B16" strokeWidth={2.6} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
