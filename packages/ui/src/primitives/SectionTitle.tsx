// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared section header used across Home, Friends, Events, and Discover.
// It draws the pixel title with a subtle teal dashed underline (so people can
// tell it is tappable), and opens a short "what is this section?" bubble that
// floats just under the title. An optional count sits next to the title.
// Optional action controls (e.g. "+") sit BESIDE the tip trigger — never inside
// it — so we do not nest buttons on web (HTML forbids button-in-button).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { SECTION_INFO_TOOLTIP, type AnalyticsBaseProps } from '@bridger/shared';
import { cn } from '../lib/cn';
import { InfoPopover } from './InfoPopover';
import { PixelHeading } from './PixelHeading';

type Size = 'lg' | 'md' | 'sm';

export function SectionTitle({
  title,
  description,
  infoAnalyticsId,
  parentScreen,
  section,
  analyticsProps,
  size = 'md',
  count,
  leading,
  numberOfLines,
  className,
  action
}: {
  /** Pixel heading text shown to the user. */
  title: string;
  /** One or two sentences shown in the info bubble. */
  description: string;
  /** Taxonomy id for the info trigger (`screen.section.info`). */
  infoAnalyticsId: string;
  /** Screen this title lives on (home, friends, events, discover…). */
  parentScreen: string;
  /** Section name stamped on analytics (announcements, stories_row…). */
  section?: string;
  /** Extra analytics properties (e.g. tier on Friends roster headers). */
  analyticsProps?: AnalyticsBaseProps;
  size?: Size;
  /** Optional live count next to the title (Friends tiers). */
  count?: number;
  /** Optional icon to the left of the title (e.g. megaphone). */
  leading?: React.ReactNode;
  numberOfLines?: number;
  className?: string;
  /** Optional control on the right (e.g. the "+" next to Inside jokes). */
  action?: React.ReactNode;
}) {
  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      {/* Only the title is the tip trigger — action stays outside to avoid nested <button> */}
      <InfoPopover
        description={description}
        title={title}
        infoAnalyticsId={infoAnalyticsId}
        dismissAnalyticsId={SECTION_INFO_TOOLTIP.chrome.dismiss}
        bodyAnalyticsId={SECTION_INFO_TOOLTIP.body.body}
        parentScreen={parentScreen}
        section={section}
        analyticsProps={analyticsProps}
        className="min-w-0 flex-1"
      >
        <View className="flex-row items-center gap-2">
          {leading}
          <View className="min-w-0 flex-row items-baseline gap-2">
            {/* Teal dashed underline = "tap / hover me for a short explanation" */}
            <View className="border-b border-dashed border-teal/70 pb-0.5">
              <PixelHeading size={size} numberOfLines={numberOfLines}>
                {title}
              </PixelHeading>
            </View>
            {count != null ? (
              <Text
                accessibilityLabel={`${count} ${count === 1 ? 'person' : 'people'}`}
                className="font-sans-b text-[12px] text-ink-mute"
              >
                {count}
              </Text>
            ) : null}
          </View>
        </View>
      </InfoPopover>
      {action}
    </View>
  );
}
