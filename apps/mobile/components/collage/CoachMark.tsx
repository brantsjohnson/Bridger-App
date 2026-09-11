// ============================================
// WHAT THIS FILE DOES (plain English):
// Five little tips for "Learn how to collage". Shown once, then stored on
// this phone. Always reachable from the editor menu.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLLAGE_EDITOR } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';

const STEPS = [
  { eyebrow: '1 of 5', title: 'Tap + to add something to the page' },
  { eyebrow: '2 of 5', title: 'Press a piece to lift it. Drag it down to throw it away' },
  { eyebrow: '3 of 5', title: 'Want to change the paper?' },
  { eyebrow: '4 of 5', title: 'Tap any empty space to see paper options' },
  { eyebrow: '5 of 5', title: 'You made that look easy!' }
];

export function CoachMark({
  step,
  onNext,
  onSkip
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  if (step < 1 || step > 5) return null;
  const copy = STEPS[step - 1]!;
  return (
    <View
      className="absolute bottom-24 left-4 right-4 rounded-[18px] bg-white px-4 py-3"
      accessibilityRole="alert"
      accessibilityLabel={copy.title}
    >
      <Text className="font-pixel text-[10px] uppercase tracking-widest text-ink/50">
        {copy.eyebrow}
      </Text>
      <Text className="mt-1 font-sans-md text-[17px] text-ink">{copy.title}</Text>
      <View className="mt-2 flex-row justify-end gap-3">
        <Pressable
          onPress={withAnalyticsPress(COLLAGE_EDITOR.menu.learn, onSkip)}
          accessibilityRole="button"
          accessibilityLabel="Skip tips"
          className="min-h-[44px] justify-center px-2"
        >
          <Text className="font-sans-md text-ink/55">Skip</Text>
        </Pressable>
        <Pressable
          onPress={withAnalyticsPress(COLLAGE_EDITOR.chrome.next, onNext)}
          accessibilityRole="button"
          accessibilityLabel="Next tip"
          className="min-h-[44px] justify-center px-2"
        >
          <Text className="font-sans-b text-[#1D6FE8]">Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
