// ============================================
// WHAT THIS FILE DOES (plain English):
// The bottom navigation — a detached, elongated capsule that floats inset
// from the screen edge (not a flush full-width bar), per DESIGN.md. Five
// destinations: Home, Friends, Events, Discover, News. Messages moved up
// to the header (top-right icon). Your Profile now lives here too: your face
// sits on the far-right of the pill (it used to be the header avatar). The
// selected tab is a stretched pill, same language as the long toggle thumb,
// not a tight circle.
//
// Each tab has its own accent (active fill + notification dot):
//   Home teal · Friends coral/orange · Events touch-grass green ·
//   Discover amber/yellow · News purple.
// Discover uses a globe (the "www"/world icon) and News uses Lucide's
// Newspaper icon. Inactive icons stay muted. A small matching-color dot
// marks something new. Each tab press emits chrome.tab_bar.* analytics.
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarIcon,
  GlobeIcon,
  HouseIcon,
  NewspaperIcon,
  UsersIcon
} from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';
import type { Accent } from '@bridger/shared';
import { CHROME } from '@bridger/shared';
import { ACCENT_HEX, useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';
import { Avatar } from '../primitives/Avatar';

export type TabKey = 'home' | 'friends' | 'events' | 'discover' | 'news';

/** Per-tab brand color — used for the selected pill and the badge dot. */
export const TAB_COLOR: Record<TabKey, string> = {
  home: ACCENT_HEX.teal,
  friends: ACCENT_HEX.coral,
  events: ACCENT_HEX.green,
  discover: ACCENT_HEX.amber,
  news: ACCENT_HEX.purple
};

const TABS: Array<{
  key: TabKey;
  label: string;
  analyticsId: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = [
  { key: 'home', label: 'Home', analyticsId: CHROME.tab_bar.tab_home, Icon: HouseIcon },
  { key: 'friends', label: 'Friends', analyticsId: CHROME.tab_bar.tab_friends, Icon: UsersIcon },
  { key: 'events', label: 'Events', analyticsId: CHROME.tab_bar.tab_events, Icon: CalendarIcon },
  {
    key: 'discover',
    // Globe = the "www"/world icon, replacing the old compass.
    label: 'Discover',
    analyticsId: CHROME.tab_bar.tab_discover,
    Icon: GlobeIcon
  },
  {
    key: 'news',
    label: 'News',
    analyticsId: CHROME.tab_bar.tab_news,
    Icon: NewspaperIcon
  }
];

/** Your face for the far-right profile button (mirrors the old header avatar). */
type NavProfile = {
  name: string;
  emoji?: string;
  accent?: Accent;
  photo?: ImageSourcePropType;
};

export function FloatingTabBar({
  value,
  onChange,
  badges = {},
  profile,
  onProfilePress
}: {
  value: TabKey | string;
  onChange: (key: TabKey) => void;
  /** When true for a tab, show that tab's colored notification dot. */
  badges?: Partial<Record<TabKey, boolean>>;
  /** Your face for the far-right profile button. Omit to hide it. */
  profile?: NavProfile;
  /** Tap the profile face → open your Profile page. */
  onProfilePress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  // THIS SECTION DOES: show your profile face on the far-right only when we know
  // who you are and where to send the tap (both come from the tabs layout).
  const showProfile = !!profile && !!onProfilePress;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) }}
      className="px-3"
    >
      {/* THIS SECTION DOES: the long capsule track. Tabs share the width evenly. */}
      <View className="w-full flex-row items-center rounded-full border border-ink-line bg-surface px-1.5 py-1.5">
        {TABS.map(({ key, label, Icon, analyticsId }) => {
          const active = key === value;
          const color = TAB_COLOR[key];
          const showDot = Boolean(badges[key]) && !active;
          return (
            <Pressable
              key={key}
              onPress={withAnalyticsPress(analyticsId, () => onChange(key), {
                analyticsProps: { surface: String(value) }
              })}
              accessibilityRole="button"
              accessibilityLabel={
                showDot ? `${label}, new activity` : label
              }
              accessibilityState={{ selected: active }}
              style={active ? { backgroundColor: color } : undefined}
              className="relative min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-full active:opacity-80"
            >
              <Icon
                size={20}
                color={active ? '#FFFFFF' : c.inkMute}
                strokeWidth={active ? 2.6 : 2}
              />
              {showDot ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{ backgroundColor: color }}
                  className="absolute right-3 top-2 h-2 w-2 rounded-full"
                />
              ) : null}
            </Pressable>
          );
        })}

        {/* THE PROFILE FACE: far-right of the pill; opens your Profile page.
            Fixed square hit target so a missing photo never collapses the slot.
            When you're ON Profile, a dark ring hugs the face so this pill spot
            reads as "selected" (like the filled tab pills do). */}
        {showProfile && profile ? (
          <Pressable
            onPress={withAnalyticsPress(CHROME.tab_bar.profile_icon, onProfilePress, {
              analyticsProps: { surface: String(value) }
            })}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            accessibilityState={{ selected: value === 'profile' }}
            className="relative min-h-[44px] min-w-[44px] items-center justify-center rounded-full active:opacity-80"
          >
            <View
              style={
                value === 'profile'
                  ? { borderWidth: 2, borderColor: c.ink, borderRadius: 999, padding: 1 }
                  : undefined
              }
            >
              <Avatar
                name={profile.name}
                emoji={profile.emoji}
                accent={profile.accent}
                photo={profile.photo}
                size="sm"
              />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
