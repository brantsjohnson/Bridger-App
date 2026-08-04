// ============================================
// WHAT THIS FILE DOES (plain English):
// One quick re-check when a profile fact looks stale ("Still into beatboxing?").
// Yes / Not anymore / dismiss — never a chore. Magic Patterns FreshnessCard.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { ButtonSecondary, ORGANIC, useThemeColors } from '@bridger/ui';

export function FreshnessCard({ question = 'Still into beatboxing?' }: { question?: string }) {
  const c = useThemeColors();
  const [state, setState] = useState<'ask' | 'kept' | 'gone'>('ask');

  if (state !== 'ask') {
    return (
      <View style={ORGANIC.soft} className="min-h-[124px] justify-center bg-[#DFF3E4] px-5 py-4">
        <Text className="font-sans-b text-[14px] text-ink">
          {state === 'kept' ? 'Kept it.' : 'Removed. Thanks for the update.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={ORGANIC.soft} className="relative min-h-[124px] bg-[#FDEFD3] px-5 py-4">
      <Pressable
        onPress={() => setState('kept')}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-surface"
      >
        <XIcon size={16} color={c.inkMute} strokeWidth={2.6} />
      </Pressable>

      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">Quick check</Text>
      <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-ink">
        {question}
      </Text>

      <View className="mt-3 flex-row gap-2.5">
        <View className="flex-1">
          <ButtonSecondary full size="sm" tone="positive" onPress={() => setState('kept')}>
            Yes
          </ButtonSecondary>
        </View>
        <View className="flex-1">
          <ButtonSecondary full size="sm" onPress={() => setState('gone')}>
            Not anymore
          </ButtonSecondary>
        </View>
      </View>
    </View>
  );
}
