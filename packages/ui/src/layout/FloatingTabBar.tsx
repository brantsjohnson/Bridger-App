// ============================================
// WHAT THIS FILE DOES (plain English):
// The bottom navigation — a detached, rounded PILL that floats inset from the
// screen edge (not a full-width bar), per DESIGN.md. Five destinations: Home,
// Friends, Messages, Events, Discover. Profile lives in the header avatar
// instead. Active tab = filled coral circle; inactive = muted icon. A small
// dot marks a tab with something new. Each tab press emits chrome.tab_bar.*
// analytics so we can see how people move around the app.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarIcon,
  CompassIcon,
  HouseIcon,
  SendIcon,
  UsersIcon
} from 'lucide-react-native';
import { CHROME } from '@bridger/shared';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';

export type TabKey = 'home' | 'friends' | 'messages' | 'events' | 'discover';

const TABS: Array<{
  key: TabKey;
  label: string;
  analyticsId: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = [
  { key: 'home', label: 'Home', analyticsId: CHROME.tab_bar.tab_home, Icon: HouseIcon },
  { key: 'friends', label: 'Friends', analyticsId: CHROME.tab_bar.tab_friends, Icon: UsersIcon },
  {
    key: 'messages',
    label: 'Messages',
    // Paper airplane = messages everywhere in the app (not the flag-like bubble).
    analyticsId: CHROME.tab_bar.tab_messages,
    Icon: SendIcon
  },
  { key: 'events', label: 'Events', analyticsId: CHROME.tab_bar.tab_events, Icon: CalendarIcon },
  {
    key: 'discover',
    label: 'Discover',
    analyticsId: CHROME.tab_bar.tab_discover,
    Icon: CompassIcon
  }
];

export function FloatingTabBar({
  value,
  onChange,
  badges = {}
}: {
  value: TabKey | string;
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
        {TABS.map(({ key, label, Icon, analyticsId }) => {
          const active = key === value;
          return (
            <Pressable
              key={key}
              onPress={withAnalyticsPress(analyticsId, () => onChange(key), {
                analyticsProps: { surface: String(value) }
              })}
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
