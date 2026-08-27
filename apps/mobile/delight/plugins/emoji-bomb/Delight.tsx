// ============================================
// WHAT THIS FILE DOES (plain English):
// Gift wrapper around the shared emoji-rain effect: shows who sent it, then
// rains. Reduce Motion is handled inside EmojiRain (ACCESSIBILITY).
// ============================================
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DELIGHT } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { EmojiRain } from '../../effects/emoji-rain';
import type { DelightPluginProps } from '../../registry';

export default function EmojiBombDelight({
  attribution,
  onDone
}: DelightPluginProps) {
  const [active, setActive] = useState(true);

  // If rain never calls back (edge case), still clear the host after a while.
  useEffect(() => {
    const t = setTimeout(() => {
      setActive(false);
      onDone();
    }, 8000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <EmojiRain
        active={active}
        onDone={() => {
          setActive(false);
          onDone();
        }}
      />

      {attribution ? (
        <AnalyticsRegion
          analyticsId={DELIGHT.gift.attribution}
          interactive={false}
          style={styles.badge}
          accessibilityLiveRegion="polite"
          accessibilityLabel={attribution}
        >
          <Text style={styles.badgeText}>{attribution}</Text>
        </AnalyticsRegion>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    left: 24,
    right: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(20,20,20,0.82)',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  badgeText: {
    color: '#F7F4EF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  }
});
