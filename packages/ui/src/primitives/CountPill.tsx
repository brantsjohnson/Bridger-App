// ============================================
// WHAT THIS FILE DOES (plain English):
// The small "1/4" pill on the capture and compose screens: how many photos or
// videos are on today's pages out of the daily limit. It is the only text
// allowed on the capture screen. It turns amber when the day is full. Tapping
// it does nothing (dead-click), which is measured on purpose.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion } from '../lib/analytics';
import { cn } from '../lib/cn';

type Props = {
  used: number;
  cap: number;
  /** `post_composer.capture.count_pill` */
  analyticsId?: string;
  className?: string;
};

export function CountPill({ used, cap, analyticsId, className }: Props) {
  const full = used >= cap;
  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel={`${used} of ${cap} photos on today's pages${full ? ', day is full' : ''}`}
      className={cn(
        'min-h-[28px] items-center justify-center rounded-full px-3',
        full ? 'bg-[#EF9F27]' : 'bg-white/15',
        className
      )}
    >
      <Text
        className={cn('font-sans-b text-[12px]', full ? 'text-[#1C1B16]' : 'text-white')}
        accessible={false}
      >
        {used}/{cap}
      </Text>
    </AnalyticsRegion>
  );
}
