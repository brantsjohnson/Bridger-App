// ============================================
// WHAT THIS FILE DOES (plain English):
// One person on the Friends roster: avatar, name, mutuals (or "Birthday today"),
// and a chevron. On their birthday the row goes pink with a cake + sparkle.
// In Edit mode the chevron becomes a move handle and the tap opens TierPicker.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { CakeIcon, ChevronRightIcon, SparklesIcon } from 'lucide-react-native';
import type { Person } from '@bridger/shared';
import { Avatar, cn, useThemeColors } from '@bridger/ui';

/** Soft pastel washes on press — never a transparent grey (Magic Patterns). */
const ROW_WASH = [
  'border-purple/40 bg-[#EFE7FF]',
  'border-pink/40 bg-[#FFE4EE]',
  'border-amber/50 bg-[#FFF1D6]',
  'border-teal/40 bg-[#DCF3EA]'
];

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
  const c = useThemeColors();
  const birthday = !!person.birthdayToday;
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={
        birthday
          ? `${person.name}, birthday today`
          : `${person.name}, ${person.mutuals} mutual friends`
      }
      accessibilityHint={editing ? 'Opens move to circle' : 'Opens profile'}
      className={cn(
        'min-h-[44px] flex-row items-center gap-3 rounded-2xl border px-3.5 py-3',
        birthday ? 'border-pink/40 bg-[#FFC0D7]' : 'border-ink-line bg-surface',
        !birthday && pressed && !editing && ROW_WASH[index % ROW_WASH.length],
        editing && 'active:opacity-80'
      )}
    >
      <Avatar
        name={person.name}
        emoji={person.emoji}
        accent={person.accent}
        story={person.story}
        onStory={!editing && person.story ? onStory : undefined}
      />

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className={cn(
            'font-sans-b text-[15px] tracking-tight',
            birthday ? 'text-onaccent' : 'text-ink'
          )}
        >
          {person.name}
        </Text>
        <Text
          numberOfLines={1}
          className={cn('font-sans-sb text-[12px]', birthday ? 'text-onaccent/70' : 'text-ink-mute')}
        >
          {birthday ? 'Birthday today' : `${person.mutuals} mutual friends`}
        </Text>
      </View>

      {birthday && !editing ? <BirthdayDecor /> : null}

      {editing ? (
        <Text accessible={false} className="px-1 text-[16px] leading-none text-ink-mute">
          ⠿
        </Text>
      ) : (
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.5} />
      )}
    </Pressable>
  );
}

/** Cake + sparkle for birthday rows. Skips the pulse when Reduce Motion is on. */
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
      <SparklesIcon size={16} color="#FF3E8A" strokeWidth={2.4} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <CakeIcon size={20} color="#FF3E8A" strokeWidth={2.4} />
      </Animated.View>
    </View>
  );
}
