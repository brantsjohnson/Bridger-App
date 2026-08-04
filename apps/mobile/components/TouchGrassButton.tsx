// ============================================
// WHAT THIS FILE DOES (plain English):
// The big green "TOUCH GRASS" button on Events. One tap opens the sheet where
// you pick who to tell and when. Matches Magic Patterns (organic banner shape).
// Analytics: EVENTS.touch_grass.send — the tap that opens the sheet.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SproutIcon } from 'lucide-react-native';
import { EVENTS } from '@bridger/shared';
import { Avatar, ORGANIC, cn, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../data/people';
import { GrassBurst } from './GrassBurst';

export function TouchGrassButton({
  live,
  inIds,
  onOpen
}: {
  live: boolean;
  inIds: string[];
  onOpen: () => void;
}) {
  return (
    <View className="relative">
      <GrassBurst play={live} />
      <Pressable
        onPress={withAnalyticsPress(EVENTS.touch_grass.send, onOpen)}
        accessibilityRole="button"
        accessibilityLabel={live ? "You're free. Open Touch Grass" : "Tell friends you're free"}
        style={ORGANIC.banner}
        className={cn(
          'w-full items-center gap-2 px-6 py-8 active:opacity-90',
          live ? 'bg-success' : 'bg-green'
        )}
      >
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
            <Text className="font-sans-sb text-[12px] text-ink-mute">No one yet</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
