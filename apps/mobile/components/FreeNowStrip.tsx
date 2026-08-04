// ============================================
// WHAT THIS FILE DOES (plain English):
// The green strip that replaces the Touch Grass button while your signal is
// live — "YOU TOUCHED GRASS" plus who's already in. Tap X to end it.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SproutIcon, XIcon } from 'lucide-react-native';
import { Avatar, ORGANIC, cn } from '@bridger/ui';
import { personById } from '../data/people';

export function FreeNowStrip({
  when,
  inIds,
  onEnd
}: {
  when: string;
  inIds: string[];
  onEnd?: () => void;
}) {
  return (
    <View
      style={ORGANIC.bold}
      className="flex-row items-center gap-3 bg-success px-4 py-3"
    >
      <SproutIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
      <View className="min-w-0 flex-1">
        <Text className="font-pixel text-[14px] leading-none text-white">YOU TOUCHED GRASS</Text>
        <Text className="font-sans-sb text-[12px] text-white/80">{when}</Text>
      </View>

      {inIds.length > 0 ? (
        <View className="flex-row items-center">
          {inIds.map((id, i) => {
            const p = personById(id);
            return (
              <View key={id} className={cn('rounded-full', i > 0 && '-ml-2')}>
                <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
              </View>
            );
          })}
          <Text className="ml-2 font-sans-b text-[12px] text-white">{inIds.length} in</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel="End signal"
        className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
      >
        <XIcon size={16} color="#FFFFFF" strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
