// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny colored pill for counts and status (e.g. "2" on Wants to connect).
// Never used for vanity metrics — only useful status the user needs.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/cn';

export type StatusTone = 'new' | 'matched' | 'nearby' | 'active' | 'neutral';

const tones: Record<StatusTone, string> = {
  new: 'bg-amber',
  matched: 'bg-purple',
  nearby: 'bg-blue',
  active: 'bg-teal',
  neutral: 'bg-ink/10'
};

const textTones: Record<StatusTone, string> = {
  new: 'text-ink',
  matched: 'text-white',
  nearby: 'text-white',
  active: 'text-white',
  neutral: 'text-ink-soft'
};

export function Badge({
  children,
  tone = 'neutral',
  dot
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  dot?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
        tones[tone]
      )}
    >
      {dot ? <View accessible={false} className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      <Text className={cn('font-sans-b text-[11px] tracking-tight', textTones[tone])}>
        {children}
      </Text>
    </View>
  );
}
