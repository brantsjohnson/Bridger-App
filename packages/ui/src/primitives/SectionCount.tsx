// ============================================
// WHAT THIS FILE DOES (plain English):
// A small section header used on Friends: the tier name in the pixel font,
// with a live count next to it ("Close  3"). When a description is passed it
// becomes a SectionTitle (dashed underline + info bubble); otherwise it stays
// a plain label for call sites that have not opted in yet.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { PixelHeading } from './PixelHeading';
import { SectionTitle } from './SectionTitle';
import { cn } from '../lib/cn';

export function SectionCount({
  label,
  count,
  className,
  description,
  infoAnalyticsId,
  parentScreen,
  section
}: {
  label: string;
  count: number;
  className?: string;
  /** When set with infoAnalyticsId, the header becomes an info tooltip. */
  description?: string;
  infoAnalyticsId?: string;
  parentScreen?: string;
  section?: string;
}) {
  // Info-enabled path — dashed underline + popover via SectionTitle.
  if (description && infoAnalyticsId && parentScreen) {
    return (
      <SectionTitle
        title={label}
        description={description}
        infoAnalyticsId={infoAnalyticsId}
        parentScreen={parentScreen}
        section={section}
        count={count}
        className={className}
      />
    );
  }

  return (
    <View className={cn('flex-row items-baseline gap-2', className)}>
      <PixelHeading size="md">{label}</PixelHeading>
      <Text
        accessibilityLabel={`${count} ${count === 1 ? 'person' : 'people'}`}
        className="font-sans-b text-[12px] text-ink-mute"
      >
        {count}
      </Text>
    </View>
  );
}
