// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Move to…" sheet that replaces web drag-and-drop on native. Pick Close,
// Friends, or Acquaintances for the friend you tapped in Edit mode (or long-
// pressed). Writes through the friends data layer.
// Analytics: when the circle changes, emit friend_retiered with from/to only
// (never the friend's name).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tier } from '@bridger/shared';
import { TIER_LABEL, trackProduct } from '@bridger/shared';
import { Sheet, cn } from '@bridger/ui';
import { ROSTER_TIERS } from '../../data/friends';

export function TierPicker({
  open,
  onClose,
  personName,
  currentTier,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  personName: string;
  currentTier: Tier;
  onPick: (tier: Tier) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={`Move ${personName.split(' ')[0]}`}>
      <Text className="mb-3 font-sans-sb text-[13px] text-ink-mute">
        Choose a circle. This is the same tier that gates what they can see of you.
      </Text>
      <View className="gap-2">
        {ROSTER_TIERS.map((tier) => {
          const selected = tier === currentTier;
          return (
            <Pressable
              key={tier}
              onPress={() => {
                // Outcome event only when the circle actually changes. No names.
                if (tier !== currentTier) {
                  trackProduct('friend_retiered', {
                    from_tier: currentTier,
                    to_tier: tier
                  });
                }
                onPick(tier);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Move to ${TIER_LABEL[tier]}`}
              className={cn(
                'min-h-[44px] flex-row items-center justify-between rounded-2xl border px-4 py-3.5',
                selected
                  ? 'border-purple bg-[#EFE7FF]'
                  : 'border-ink-line bg-surface active:bg-[#F1ECFF]'
              )}
            >
              <Text className="font-sans-b text-[15px] text-ink">{TIER_LABEL[tier]}</Text>
              {selected ? (
                <Text className="font-sans-sb text-[12px] text-purple">Current</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
