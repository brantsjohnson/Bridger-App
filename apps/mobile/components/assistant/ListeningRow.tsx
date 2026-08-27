// ============================================
// WHAT THIS FILE DOES (plain English):
// The compact listening chrome used on Home and the full Billy room. Stop on
// the left; a fun gradient pill shows the live transcript (or "Listening…");
// a matching stop-square on the right ends the take and sends it.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { withAnalyticsPress } from '@bridger/ui';
import {
  BILLY_MIC_GRADIENT,
  BILLY_MIC_GRADIENT_LOCATIONS
} from './billy-theme';
import { VoiceWave } from './VoiceWave';

type Props = {
  /** Mic is open and metering says there is voice. */
  hearing: boolean;
  /** Live words while speaking (may be empty on native). */
  transcript?: string;
  /** Stop without sending (discard). */
  onCancel: () => void;
  /** Stop and send now. */
  onFinish: () => void;
  stopAnalyticsId: string;
  finishAnalyticsId: string;
};

export function ListeningRow({
  hearing,
  transcript = '',
  onCancel,
  onFinish,
  stopAnalyticsId,
  finishAnalyticsId
}: Props) {
  const line = transcript.trim() || 'Listening…';

  return (
    <View className="flex-row items-center gap-2">
      {/* THIS SECTION DOES: discard this take (do not send) */}
      <Pressable
        onPress={withAnalyticsPress(stopAnalyticsId, onCancel)}
        accessibilityRole="button"
        accessibilityLabel="Cancel listening"
        className="h-10 min-w-[72px] items-center justify-center rounded-full bg-white px-4"
      >
        <Text
          className="font-sans-b text-[13px] text-ink"
          style={{ textAlign: 'center', lineHeight: 16, includeFontPadding: false }}
        >
          Cancel
        </Text>
      </Pressable>

      {/* THIS SECTION DOES: wave + live words in the fun gradient pill */}
      <LinearGradient
        colors={[...BILLY_MIC_GRADIENT]}
        locations={[...BILLY_MIC_GRADIENT_LOCATIONS]}
        start={{ x: 0.05, y: 0.2 }}
        end={{ x: 0.95, y: 0.9 }}
        style={{
          flex: 1,
          minWidth: 0,
          height: 40,
          borderRadius: 999,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8
        }}
      >
        <VoiceWave
          active
          hearing={hearing}
          size="sm"
          bars={6}
          color="#FFFFFF"
          className="shrink-0"
        />
        <Text
          className="min-w-0 flex-1 font-sans-b text-[13px] text-white"
          numberOfLines={1}
        >
          {line}
        </Text>
      </LinearGradient>

      {/* THIS SECTION DOES: stop-square = end the take and send it */}
      <Pressable
        onPress={withAnalyticsPress(finishAnalyticsId, onFinish)}
        accessibilityRole="button"
        accessibilityLabel="Send what you said"
        accessibilityState={{ selected: true }}
      >
        <LinearGradient
          colors={[...BILLY_MIC_GRADIENT]}
          locations={[...BILLY_MIC_GRADIENT_LOCATIONS]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: '#FFFFFF'
            }}
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
