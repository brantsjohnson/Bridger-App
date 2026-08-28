// ============================================
// WHAT THIS FILE DOES (plain English):
// The News tab — dark "coming soon" page with the spinning pixel newspaper.
// Header (profile, title, messages) and the floating tab bar stay the app's
// normal chrome. The body is the infographic + COMING SOON copy until the
// real local updates feed ships.
// ============================================
import React, { useEffect } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnalyticsRegion,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { NEWS, openSurface } from '@bridger/shared';
import { NewsPaperGraphic } from '../../components/news/NewsPaperGraphic';

// Match ScreenHeader spacing so we center in the open canvas under the title.
const HEADER_TOP_PAD = 16;
const HEADER_BOTTOM_PAD = 8;
const GAP_BELOW_HEADER = 10;
const HEADER_ROW = 44;
/** Room for the floating tab bar so the block sits above it. */
const TAB_BAR_CLEARANCE = 120;

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Mark News as the active analytics surface when this tab opens.
  useEffect(() => {
    openSurface('news');
  }, []);

  // THIS SECTION DOES: fill the space under the header so paper + copy sit
  // in the vertical middle (not stuck under the title).
  const headerBlock =
    insets.top + HEADER_TOP_PAD + HEADER_ROW + HEADER_BOTTOM_PAD + GAP_BELOW_HEADER;
  const contentMinHeight = Math.max(
    windowHeight - headerBlock - TAB_BAR_CLEARANCE,
    420
  );

  return (
    <Screen tone="intro">
      <ScreenHeader title="News" analyticsSurface="news" />
      <ScreenBody>
        {/* Coming-soon body — non-interactive, so a tap here logs a dead_click. */}
        <AnalyticsRegion
          analyticsId={NEWS.feed.empty_body}
          interactive={false}
          accessibilityRole="text"
          accessibilityLabel="Local updates"
        >
          <View
            className="items-center justify-center px-6"
            style={{ minHeight: contentMinHeight }}
          >
            {/* THIS SECTION DOES: the spinning pixel newspaper (decoration only). */}
            <NewsPaperGraphic />

            {/* THIS SECTION DOES: the headline under the paper. */}
            <View className="mt-10 items-center">
              <Text
                className="font-pixel text-[18px] tracking-[0.22em] text-purple"
                style={{ color: '#6B2FEA', letterSpacing: 4 }}
              >
                COMING SOON
              </Text>
              <PixelHeading
                size="lg"
                className="mt-3.5 text-center text-[36px] leading-[1.05] text-white"
                style={{ color: '#FFFFFF' }}
              >
                Local updates!
              </PixelHeading>
            </View>
          </View>
        </AnalyticsRegion>
      </ScreenBody>
    </Screen>
  );
}
