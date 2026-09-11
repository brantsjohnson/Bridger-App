// ============================================
// WHAT THIS FILE DOES (plain English):
// Draws today's collage page so it always stays 8.5 x 11 (print size) but
// grows to fill whatever screen it is on. Home tiles, the calendar, the
// camera thumb, and the editor all use this same page.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { SCRAPBOOK_ASPECT_RATIO, type ScrapbookPage as ScrapbookPageModel } from '@bridger/shared';
import { ScrapbookPage, useResponsiveLayout, type ScrapbookPageAnalyticsIds } from '@bridger/ui';

export { ScrapbookPage };

/**
 * Fit an 8.5 x 11 sheet into a box. Uses the whole box without stretching
 * the paper (letterbox leftover stays around it).
 */
export function fitLetterPage(maxWidth: number, maxHeight: number): { width: number; height: number } {
  const ratio = SCRAPBOOK_ASPECT_RATIO;
  if (maxWidth <= 0 || maxHeight <= 0) return { width: 0, height: 0 };
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width, height };
}

type Props = {
  page: ScrapbookPageModel;
  width?: number;
  maxWidth?: number;
  maxHeight?: number;
  mode?: 'compose' | 'view';
  selectedElementId?: string | null;
  onPressElement?: React.ComponentProps<typeof ScrapbookPage>['onPressElement'];
  onPressCanvas?: () => void;
  renderMedia?: React.ComponentProps<typeof ScrapbookPage>['renderMedia'];
  onPressVoice?: React.ComponentProps<typeof ScrapbookPage>['onPressVoice'];
  analyticsIds?: ScrapbookPageAnalyticsIds;
  accessibilityLabel?: string;
  radius?: number;
};

/** The collage page, sized for the current screen. */
export function CollagePage({
  page,
  width,
  maxWidth,
  maxHeight,
  ...rest
}: Props) {
  const { width: winW, contentMaxWidth } = useResponsiveLayout();
  const cap = contentMaxWidth ?? winW;
  const w =
    width ??
    (maxWidth && maxHeight
      ? fitLetterPage(Math.min(maxWidth, cap), maxHeight).width
      : undefined);

  return (
    <View style={{ alignSelf: 'center', width: w ?? '100%', maxWidth: cap }}>
      <ScrapbookPage page={page} width={w} {...rest} />
    </View>
  );
}
