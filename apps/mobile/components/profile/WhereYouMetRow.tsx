// ============================================
// WHAT THIS FILE DOES (plain English):
// Quiet line under Places on a friend profile when where-you-met was recorded
// (coarse, opt-in, mutual). Example: "RiNo, Denver · via Sam."
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { WhereMetView } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { PROFILE_SECTION_TITLE_SIZE, PROFILE_TITLE_TO_BODY } from './profileSpacing';

export function WhereYouMetRow({ whereMet }: { whereMet: WhereMetView }) {
  return (
    <View>
      <AnalyticsRegion analyticsId={PROFILE.card.where_met} interactive={false}>
        <Text
          className="font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          Where you met
        </Text>
        <Text
          className="font-sans-sb text-[14px] text-ink-soft"
          style={{ marginTop: PROFILE_TITLE_TO_BODY }}
        >
          {whereMet.label}
          {whereMet.via ? ` · via ${whereMet.via}` : ''}
        </Text>
      </AnalyticsRegion>
    </View>
  );
}
