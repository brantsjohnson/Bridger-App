// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op Greatest hits: up to 3 large photos that can sit between profile
// sections. Pure expression; each photo carries its own tier visibility.
// Assets are Bridger-hosted only (PROFILE-CUSTOMIZATION.md).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { PhotoBlock } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import {
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

export function GreatestHitsBlock({ photos }: { photos: PhotoBlock[] }) {
  if (photos.length === 0) return null;

  return (
    <View style={{ gap: PROFILE_TITLE_TO_BODY }}>
      <AnalyticsRegion analyticsId={PROFILE.card.greatest_hits} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Greatest hits
        </Text>
      </AnalyticsRegion>
      {photos.slice(0, 3).map((p) => (
        <View
          key={p.id}
          accessibilityRole="image"
          accessibilityLabel="Greatest hits photo"
          className="aspect-[4/3] w-full items-center justify-center rounded-card border border-ink-line bg-amber/20"
        >
          <Text className="font-sans-b text-[14px] text-ink-mute">Photo</Text>
        </View>
      ))}
    </View>
  );
}
