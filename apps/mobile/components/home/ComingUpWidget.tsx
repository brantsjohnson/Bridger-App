// ============================================
// WHAT THIS FILE DOES (plain English):
// Birthdays and your private date notes, in one strip. The ROW color tells you
// which circle that person is in (green = Close, blue = Friends, orange =
// Acquaintances). Birthdays are the one exception — they stay pink, so a cake
// day always looks like a cake day. The "Today / Friday / in 1 week" chip is
// always the lighter version of the same color.
//
// Tap opens that friend's profile page (not the Friends roster).
// Analytics: each row uses coming_up_card (no names/labels in event props).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CakeIcon, FlagIcon } from 'lucide-react-native';
import { HOME, type UpcomingItem } from '@bridger/shared';
import { TIER_COLOR, ringToneForTier, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../data/people';

/** Birthdays keep their own pink so they never get mistaken for a tier color. */
const BIRTHDAY = {
  deep: '#FF3E8A',
  light: '#FFC0D7',
  onDeep: '#FFFFFF',
  onLight: '#1C1B16'
} as const;

/**
 * Pick the card fill (deep) and the countdown chip (light) for one row.
 * Birthday always wins over tier. Notes / other date reminders follow the
 * friend's circle.
 */
function colorsFor(item: UpcomingItem) {
  if (item.kind === 'birthday') return BIRTHDAY;
  const person = personById(item.personId);
  return TIER_COLOR[ringToneForTier(person.tier)];
}

export function ComingUpWidget({
  items,
  onOpenPerson
}: {
  items: UpcomingItem[];
  onOpenPerson?: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      {items.map((item) => {
        const birthday = item.kind === 'birthday';
        const tone = colorsFor(item);
        return (
          <Pressable
            key={item.id}
            onPress={withAnalyticsPress(HOME.announcements.coming_up_card, () =>
              onOpenPerson?.(item.personId)
            )}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={{ backgroundColor: tone.deep }}
            className="w-full flex-row items-center gap-3 rounded-card px-4 py-3 active:opacity-90"
          >
            {birthday ? (
              <CakeIcon size={20} color={tone.onDeep} strokeWidth={2.4} />
            ) : (
              <FlagIcon size={20} color={tone.onDeep} strokeWidth={2.4} />
            )}
            <Text
              numberOfLines={1}
              style={{ color: tone.onDeep }}
              className="min-w-0 flex-1 font-sans-b text-[15px]"
            >
              {item.label}
            </Text>
            {/* Lighter chip of the same color — Today / Friday / in 1 week. */}
            <View
              style={{ backgroundColor: tone.light }}
              className="shrink-0 rounded-full px-2.5 py-1"
            >
              <Text
                style={{ color: tone.onLight }}
                className="font-sans-b text-[12px]"
              >
                {item.when}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
