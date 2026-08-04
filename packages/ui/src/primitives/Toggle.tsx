// ============================================
// WHAT THIS FILE DOES (plain English):
// An on/off switch used in Discover settings (Discoverable, quiz sources).
// Teal when on, quiet grey when off. Speaks its label to VoiceOver / TalkBack.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '../lib/cn';

export function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      className={cn(
        'h-7 w-12 shrink-0 justify-center rounded-full border',
        checked ? 'border-teal bg-teal' : 'border-ink-line bg-ink/10'
      )}
    >
      <View
        accessible={false}
        className={cn(
          'h-[22px] w-[22px] rounded-full border border-ink/10 bg-white',
          checked ? 'ml-[22px]' : 'ml-0.5'
        )}
      />
    </Pressable>
  );
}
