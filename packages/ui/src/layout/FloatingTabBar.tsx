// ============================================
// WHAT THIS FILE DOES (plain English):
// The bottom navigation — a detached, rounded PILL that floats inset from the
// screen edge (not a full-width bar), per DESIGN.md. Five destinations: Home,
// Friends, Events, Discover, Profile. The active tab is a filled coral circle;
// inactive tabs are muted icons. A small dot marks a tab with something new.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarIcon,
  CompassIcon,
  HouseIcon,
  UserIcon,
  UsersIcon
} from 'lucide-react-native';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';

export type TabKey = 'home' | 'friends' | 'events' | 'discover' | 'profile';

const TABS: Array<{
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = [
  { key: 'home', label: 'Home', Icon: HouseIcon },
  { key: 'friends', label: 'Friends', Icon: UsersIcon },
  { key: 'events', label: 'Events', Icon: CalendarIcon },
  { key: 'discover', label: 'Discover', Icon: CompassIcon },
  { key: 'profile', label: 'Profile', Icon: UserIcon }
];

export function FloatingTabBar({
  value,
  onChange,
  badges = {}
}: {
  value: TabKey;
  onChange: (key: TabKey) => void;
  badges?: Partial<Record<TabKey, boolean>>;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) }}
      className="items-center px-5"
    >
      <View className="flex-row items-center gap-1 rounded-full border border-ink-line bg-surface px-2 py-2">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === value;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              className={cn(
                'relative h-11 w-11 items-center justify-center rounded-full active:opacity-80',
                active && 'bg-coral'
              )}
            >
              <Icon size={19} color={active ? '#FFFFFF' : c.inkMute} strokeWidth={active ? 2.6 : 2} />
              {badges[key] && !active ? (
                <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
