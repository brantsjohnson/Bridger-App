// ============================================
// WHAT THIS FILE DOES (plain English):
// One quick re-check when a profile fact looks stale ("Still into beatboxing?").
// Yes / Not anymore / dismiss — never a chore. Magic Patterns FreshnessCard.
// Analytics: Yes = quick_check_yes; Not anymore = quick_check_edit.
// PRIVACY: never log the question text in analytics.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { HOME } from '@bridger/shared';
import { ButtonSecondary, ORGANIC, useThemeColors } from '@bridger/ui';

export function FreshnessCard({ question = 'Still into beatboxing?' }: { question?: string }) {
  const c = useThemeColors();
  const [state, setState] = useState<'ask' | 'kept' | 'gone'>('ask');

  if (state !== 'ask') {
    return (
      <View style={ORGANIC.soft} className="min-h-[124px] justify-center bg-green px-5 py-4">
        {/* onaccent = always-dark type. On a colored card we never use `text-ink`,
            because that flips to white in dark mode and vanishes. */}
        <Text className="font-sans-b text-[14px] text-onaccent">
          {state === 'kept' ? 'Kept it.' : 'Removed. Thanks for the update.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={ORGANIC.soft} className="relative min-h-[124px] bg-amber px-5 py-4">
      <Pressable
        onPress={() => setState('kept')}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-white/25"
      >
        {/* onaccent = always-dark type, which is what stays readable on the
            bright amber in both light and dark mode. */}
        <XIcon size={16} color="#1C1B16" strokeWidth={2.6} />
      </Pressable>

      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-onaccent/70">
        Quick check
      </Text>
      <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-onaccent">
        {question}
      </Text>

      <View className="mt-3 flex-row gap-2.5">
        <View className="flex-1">
          {/* Analytics: kept the fact as-is. */}
          <ButtonSecondary
            full
            size="sm"
            tone="positive"
            onPress={() => setState('kept')}
            analyticsId={HOME.announcements.quick_check_yes}
          >
            Yes
          </ButtonSecondary>
        </View>
        <View className="flex-1">
          {/* Analytics: edited / removed the stale fact. */}
          <ButtonSecondary
            full
            size="sm"
            onPress={() => setState('gone')}
            analyticsId={HOME.announcements.quick_check_edit}
          >
            Not anymore
          </ButtonSecondary>
        </View>
      </View>
    </View>
  );
}
