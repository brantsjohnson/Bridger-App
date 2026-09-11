// ============================================
// WHAT THIS FILE DOES (plain English):
// Two colored pills under an onboarding field: Private (yellow) or Close
// friends only (green). Public / Everyone stays for Privacy settings later.
// Maps to DB tiers: Private = none, Close friends only = close.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tier } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';

/** Yellow = private (only you). Green = close friends. */
const PRIVATE_BG = '#F5D76E';
const CLOSE_BG = '#2FA85B';

export type PlacesPrivacyChoice = 'none' | 'close';

export function toPlacesPrivacy(tier: Tier | null | undefined): PlacesPrivacyChoice {
  return tier === 'close' ? 'close' : 'none';
}

/**
 * Compact Private / Close friends only picker for one field.
 * ACCESSIBILITY: labels + selected state; color is not the only cue (check mark).
 */
export function PrivateCloseToggle({
  value,
  onChange,
  analyticsId,
  fieldLabel
}: {
  value: PlacesPrivacyChoice;
  onChange: (next: PlacesPrivacyChoice) => void;
  analyticsId: string;
  /** Spoken with each option, e.g. "Hometown". */
  fieldLabel: string;
}) {
  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup">
      <Pressable
        onPress={withAnalyticsPress(analyticsId, () => onChange('none'), {
          analyticsProps: { method: 'private' }
        })}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'none' }}
        accessibilityLabel={`${fieldLabel}: Private`}
        className="min-h-[40px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full border-2 border-ink px-2 active:opacity-90"
        style={{ backgroundColor: value === 'none' ? PRIVATE_BG : 'transparent' }}
      >
        <Text className="font-sans-b text-[12px] text-ink">
          {value === 'none' ? '✓ Private' : 'Private'}
        </Text>
      </Pressable>
      <Pressable
        onPress={withAnalyticsPress(analyticsId, () => onChange('close'), {
          analyticsProps: { method: 'close' }
        })}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'close' }}
        accessibilityLabel={`${fieldLabel}: Close friends only`}
        className="min-h-[40px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full border-2 border-ink px-2 active:opacity-90"
        style={{
          backgroundColor: value === 'close' ? CLOSE_BG : 'transparent'
        }}
      >
        <Text
          className="font-sans-b text-[12px]"
          style={{ color: value === 'close' ? '#FFFFFF' : '#1C1B16' }}
        >
          {value === 'close' ? '✓ Close friends' : 'Close friends'}
        </Text>
      </Pressable>
    </View>
  );
}
