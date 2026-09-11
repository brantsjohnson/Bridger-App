// ============================================
// WHAT THIS FILE DOES (plain English):
// The small pill on the capture and compose screens that shows how many
// photos or videos are on today's pages. It used to say "2/4", which looked
// like step progress, so it now says "2 photos" (and "4 photos" in amber
// when the day is full). Tapping it does nothing (dead-click), on purpose.
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
  const noun = used === 1 ? 'photo' : 'photos';
  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel={`${used} of ${cap} photos on today's pages${full ? ', day is full' : ''}`}
      className={cn(
        'min-h-[28px] max-w-[70%] items-center justify-center rounded-full px-3',
        full ? 'bg-[#EF9F27]' : 'bg-white/15',
        className
      )}
    >
      {/* THIS SECTION DOES: the visible words. Cap stays in the spoken label. */}
      <Text
        className={cn('font-sans-b text-[12px]', full ? 'text-[#1C1B16]' : 'text-white')}
        accessible={false}
        numberOfLines={1}
      >
        {used} {noun}
      </Text>
    </AnalyticsRegion>
  );
}
