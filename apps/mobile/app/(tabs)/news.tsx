// ============================================
// WHAT THIS FILE DOES (plain English):
// The News tab — dark "coming soon" page with the spinning pixel newspaper.
// Header (profile, title, messages) and the floating tab bar stay the app's
// normal chrome. The body is the infographic + COMING SOON copy, centered
// between the header and the tab bar, until the real local updates feed ships.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  AnalyticsRegion,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { NEWS, openSurface } from '@bridger/shared';
import {
  NEWS_PAPER_SIZE,
  NewsPaperGraphic
} from '../../components/news/NewsPaperGraphic';

export default function NewsScreen() {
  // Mark News as the active analytics surface when this tab opens.
  useEffect(() => {
    openSurface('news');
  }, []);

  return (
    <Screen tone="intro">
      <ScreenHeader title="News" analyticsSurface="news" />
      {/* Center the coming-soon block between the header and the tab bar. */}
      <ScreenBody centerContent>
        {/* Coming-soon body — non-interactive, so a tap here logs a dead_click. */}
        <AnalyticsRegion
          analyticsId={NEWS.feed.empty_body}
          interactive={false}
          accessibilityRole="text"
          accessibilityLabel="Local updates"
        >
          {/* THIS SECTION DOES: newspaper + copy, vertically centered in the body. */}
          <View className="items-center">
            <View
              accessible={false}
              style={{
                width: NEWS_PAPER_SIZE.width,
                height: NEWS_PAPER_SIZE.height
              }}
              className="items-center justify-center"
            >
              <NewsPaperGraphic />
            </View>

            {/* THIS SECTION DOES: the headline under the paper. */}
            <View className="mt-10 items-center px-2">
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
