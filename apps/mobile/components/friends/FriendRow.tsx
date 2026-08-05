// ============================================
// WHAT THIS FILE DOES (plain English):
// One person on the Friends roster: avatar, name, song of the week or the book
// they're reading (or "Birthday today"), and a chevron. Rows are color-coded by
// circle — Close = green, Friends = blue, Acquaintances = orange. Birthdays
// override to vibrant pink with a cake. Mutual counts stay on the profile
// (In common), not here. In Edit mode the chevron becomes a move handle.
// Analytics: normal tap = roster.row, birthday = birthday_row, edit = drag_handle.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { CakeIcon, ChevronRightIcon } from 'lucide-react-native';
import type { Person, Tier } from '@bridger/shared';
import { FRIENDS, personVibeLine } from '@bridger/shared';
import { Avatar, Sparkles, cn, withAnalyticsPress, type WashStoryRing } from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';

/** Near-black — always readable on the vibrant tier washes (even in dark mode). */
const ON_WASH = '#1C1B16';

/**
 * Vibrant fills by friendship circle. Birthday / special-date rows use pink
 * instead so they jump out of the list.
 */
const TIER_ROW: Record<Tier, string> = {
  close: 'border-green/50 bg-[#5FBF3A]',
  friend: 'border-blue/50 bg-[#1D6FE8]',
  acquaintance: 'border-coral/50 bg-[#FF8C42]',
  none: 'border-ink-line bg-surface'
};

const BIRTHDAY_ROW = 'border-pink/50 bg-[#FF3E8A]';

export type FriendRowPerson = Person & { birthdayToday?: boolean };

export function FriendRow({
  person,
  index = 0,
  editing = false,
  onPress,
  onStory,
  onLongPress
}: {
  person: FriendRowPerson;
  index?: number;
  editing?: boolean;
  onPress?: () => void;
  onStory?: () => void;
  onLongPress?: () => void;
}) {
  void index; // kept for call-site compatibility; wash is tier-based now
  const birthday = !!person.birthdayToday;
  const tier = person.tier ?? 'friend';
  const onWash = birthday || tier !== 'none';
  // Story ring always uses the person's CIRCLE color (green / blue / orange),
  // even on a birthday (pink) card — the ring means "they posted an update", so
  // it should read as their group, not the birthday pink. No story → no ring.
  const ringWash: WashStoryRing =
    tier === 'close' ? 'close' : tier === 'acquaintance' ? 'acquaintance' : 'friend';

  // Birthday rows, edit-mode handles, and normal rows each have their own id.
  const rowId = editing
    ? FRIENDS.roster.drag_handle
    : birthday
      ? FRIENDS.roster.birthday_row
      : FRIENDS.roster.row;

  const nameColor = onWash ? ON_WASH : undefined;
  const chevronColor = onWash ? ON_WASH : '#9A9688';
  // Song first, then book — never mutual counts on this list.
  const vibe = personVibeLine(person);
  const subtitle = birthday ? 'Birthday today' : vibe;

  return (
    /*
      Avatar sits outside the row press target so tapping a story ring opens
      their update, not their profile. The rest of the card still opens profile
      (or the edit handle).
    */
    <View
      className={cn(
        'min-h-[44px] flex-row items-center gap-3 rounded-2xl border px-3.5 py-3',
        birthday ? BIRTHDAY_ROW : TIER_ROW[tier]
      )}
    >
      <Avatar
        name={person.name}
        emoji={person.emoji}
        accent={person.accent}
        photo={getProfilePhoto(person.id)}
        story={person.story}
        ringWash={ringWash}
        onStory={!editing && person.story ? onStory : undefined}
      />

      <Pressable
        onPress={withAnalyticsPress(rowId, onPress)}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${person.name}, ${subtitle}` : person.name}
        accessibilityHint={editing ? 'Opens move to circle' : 'Opens profile'}
        className={cn(
          'min-h-[44px] min-w-0 flex-1 flex-row items-center gap-3 active:opacity-90',
          editing && 'active:opacity-80'
        )}
      >
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className={cn('font-sans-b text-[15px] tracking-tight', !onWash && 'text-ink')}
            style={nameColor ? { color: nameColor } : undefined}
          >
            {person.name}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              className={cn('font-sans-sb text-[12px]', !onWash && 'text-ink-mute')}
              style={nameColor ? { color: nameColor, opacity: 0.75 } : undefined}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Soft sparkle on birthday rows; cake icon is the main birthday cue. */}
        {birthday && !editing ? <Sparkles /> : null}
        {birthday && !editing ? <BirthdayDecor /> : null}

        {editing ? (
          <Text
            accessible={false}
            className={cn('px-1 text-[16px] leading-none', !onWash && 'text-ink-mute')}
            style={nameColor ? { color: nameColor } : undefined}
          >
            ⠿
          </Text>
        ) : (
          <ChevronRightIcon size={16} color={chevronColor} strokeWidth={2.5} />
        )}
      </Pressable>
    </View>
  );
}

/** Cake for birthday rows. Skips the pulse when Reduce Motion is on. */
function BirthdayDecor() {
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scale]);

  return (
    <View
      accessible={false}
      className="shrink-0 flex-row items-center gap-1"
      accessibilityElementsHidden
    >
      {/* White cake on the pink wash so it still pops */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <CakeIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
      </Animated.View>
    </View>
  );
}
