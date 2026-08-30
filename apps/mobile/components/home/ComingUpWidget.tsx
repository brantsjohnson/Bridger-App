// ============================================
// WHAT THIS FILE DOES (plain English):
// Birthdays, your private date notes, and soft check-in nudges, in one strip.
// Every ROW uses the friend's circle color: green = Close, blue = Friends,
// orange = Acquaintances. Cake / flag / bell icons still tell you the kind.
// The countdown chip is the lighter version of the same color.
// Rows are soonest-first (now → Today → Friday → in 7 days).
//
// Empty (new account / nothing due yet): a blue teach row (same look as the
// real cards) that explains what lands here. X dismisses it for good.
//
// Tap opens that friend's profile page (not the Friends roster).
// Analytics: each row uses coming_up_card (no names/labels in event props).
// ============================================
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BellIcon, CakeIcon, CalendarDaysIcon, FlagIcon, XIcon } from 'lucide-react-native';
import { HOME, sortUpcomingItems, type UpcomingItem } from '@bridger/shared';
import {
  AnalyticsRegion,
  TIER_COLOR,
  ringToneForTier,
  withAnalyticsPress
} from '@bridger/ui';
import { personById } from '../../data/people';

/** Friends-circle blue — same tone as a real Coming up row for that tier. */
const EMPTY_TONE = TIER_COLOR.friend;

/** Card fill + chip from the friend's circle — every kind, including birthdays. */
function colorsFor(item: UpcomingItem) {
  const person = personById(item.personId);
  return TIER_COLOR[ringToneForTier(person.tier)];
}

export function ComingUpWidget({
  items,
  onOpenPerson,
  onDismissEmpty
}: {
  items: UpcomingItem[];
  onOpenPerson?: (id: string) => void;
  /** X on the empty teach card — Home hides this section until real items exist. */
  onDismissEmpty?: () => void;
}) {
  // Soonest first so "now" and "Today" sit above later chips.
  const ordered = useMemo(() => sortUpcomingItems(items), [items]);

  // THIS SECTION DOES: blue teach row when nothing is due yet (new accounts).
  // Same capsule look as real Coming up cards, with an X to close it.
  if (ordered.length === 0) {
    return (
      <View
        style={{ backgroundColor: EMPTY_TONE.deep }}
        className="relative w-full flex-row items-start gap-3 rounded-card px-4 py-3"
      >
        {/* THIS SECTION DOES: calendar icon so it reads like the other rows. */}
        <CalendarDaysIcon
          size={20}
          color={EMPTY_TONE.onDeep}
          strokeWidth={2.4}
          accessible={false}
          style={{ marginTop: 2 }}
        />

        <AnalyticsRegion
          analyticsId={HOME.coming_up.empty_body}
          interactive={false}
          accessibilityLabel="Anything important about your friends, like birthdays or custom dates you've saved, will show up here when it's coming up"
          className="min-w-0 flex-1 pr-7"
        >
          <Text
            style={{ color: EMPTY_TONE.onDeep }}
            className="font-sans-b text-[15px] leading-snug"
          >
            Anything important about your friends, like birthdays or custom
            dates you've saved, will show up here when it's coming up!
          </Text>
        </AnalyticsRegion>

        {/* THIS SECTION DOES: X closes the teach card for good. */}
        <Pressable
          onPress={withAnalyticsPress(HOME.coming_up.empty_dismiss, () =>
            onDismissEmpty?.()
          )}
          accessibilityRole="button"
          accessibilityLabel="Dismiss Coming up tip"
          hitSlop={8}
          className="absolute right-2.5 top-2.5 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-white/20"
        >
          <XIcon size={16} color={EMPTY_TONE.onDeep} strokeWidth={2.6} />
        </Pressable>
      </View>
    );
  }

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
