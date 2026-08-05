// ============================================
// WHAT THIS FILE DOES (plain English):
// Birthdays, your private date notes, and soft check-in nudges, in one strip.
// Every ROW uses the friend's circle color: green = Close, blue = Friends,
// orange = Acquaintances. Cake / flag / bell icons still tell you the kind.
// The countdown chip is the lighter version of the same color.
// Rows are soonest-first (now → Today → Friday → in 7 days).
//
// Tap opens that friend's profile page (not the Friends roster).
// Analytics: each row uses coming_up_card (no names/labels in event props).
// ============================================
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BellIcon, CakeIcon, FlagIcon } from 'lucide-react-native';
import { HOME, sortUpcomingItems, type UpcomingItem } from '@bridger/shared';
import { TIER_COLOR, ringToneForTier, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../data/people';

/** Card fill + chip from the friend's circle — every kind, including birthdays. */
function colorsFor(item: UpcomingItem) {
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
  // Soonest first so "now" and "Today" sit above later chips.
  const ordered = useMemo(() => sortUpcomingItems(items), [items]);

  return (
    <View className="gap-2">
      {ordered.map((item) => {
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
            ) : item.kind === 'check_in' ? (
              <BellIcon size={20} color={tone.onDeep} strokeWidth={2.4} />
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
            {/* Lighter chip of the same circle color — now / Today / Friday. */}
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
