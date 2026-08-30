// ============================================
// WHAT THIS FILE DOES (plain English):
// Sets up the main tabs — Home, Friends, Events, Discover, News — and swaps the
// default bottom bar for Bridger's floating pill nav. Messages and Profile are
// still real screens here, but they are NOT in the pill: you open Profile from
// the header photo (left of the title) and Messages from the header paper-plane
// (top-right). The pill hides while you're on Profile (nothing would look
// selected).
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar, ProfileLinkProvider, type TabKey } from '@bridger/ui';
import { getMe } from '../../data/people';
import { acknowledgeTab } from '../../data/tab-badges';
import { useTabAttention } from '../../hooks/useTabAttention';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { isDemoMode } from '../../lib/demo';
import { getCachedMe, loadPeople, subscribePeople } from '../../lib/people-cache';
import { useAuth } from '../../providers/auth-provider';

const TAB_KEYS = new Set<TabKey>(['home', 'friends', 'events', 'discover', 'news']);

function isTabKey(name: string): name is TabKey {
  return TAB_KEYS.has(name as TabKey);
}

// Keep the app on Home when it first opens.
export const unstable_settings = {
  initialRouteName: 'home'
};

export default function TabsLayout() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const demoMode = isDemoMode();
  const me = getMe();
  // Rerender when the live people cache finishes so the header picks up
  // your real avatar URL (demo uses the local asset right away).
  const [peopleTick, setPeopleTick] = useState(0);
  // THIS SECTION DOES: keep the floating-nav dots in sync when you open a tab
  // (nav dot clears; section title dots stay on that page).
  const { badges } = useTabAttention();

  // Live: fill the people cache so personById / roster look-ups work sync.
  useEffect(() => {
    if (demoMode || authLoading || !session) return;
    void loadPeople().then(() => setPeopleTick((n) => n + 1));
  }, [authLoading, demoMode, session]);

  // THIS SECTION DOES: re-render the header whenever loadPeople refreshes your face
  // (e.g. right after onboarding, or when Home focuses and reloads /me).
  useEffect(() => {
    if (demoMode) return;
    return subscribePeople(() => setPeopleTick((n) => n + 1));
  }, [demoMode]);

  // Header photo → your Profile page (not a bottom-tab destination).
  const openProfile = useCallback(() => {
    router.push('/(tabs)/profile');
  }, [router]);

  // Header paper-plane → your Messages inbox (moved off the bottom pill).
  const openMessages = useCallback(() => {
    router.push('/(tabs)/messages');
  }, [router]);

  const profile = useMemo(() => {
    const live = getCachedMe();
    return {
      name: live?.name || me.name,
      emoji: me.emoji,
      accent: me.accent,
      // Live signed photo, or demo fixture for "me". Emoji circle if none yet.
      photo: avatarPhotoFor('me', live?.avatarUrl)
    };
  }, [me.name, me.emoji, me.accent, me.avatarUrl, peopleTick, demoMode]);

  // SECURITY: signed-out people never mount private tabs or start private API calls.
  if (!demoMode && (authLoading || !session)) return null;

  return (
    <ProfileLinkProvider profile={profile} open={openProfile} openMessages={openMessages}>
      <Tabs
        screenOptions={{ headerShown: false }}
        // --- THE NAV: Expo Router tab state → FloatingTabBar, and a pill tap
        //     back into real navigation. ---
        tabBar={({ state, navigation }) => {
          const current = state.routes[state.index]?.name as string;
          // Messages opens from the header, not the pill — hide the bar there so
          // nothing looks "half selected". Profile lives ON the pill (single-person
          // icon on the far-right), so the bar STAYS on Profile.
          if (current === 'messages') return null;
          return (
            <TabBarWithAcknowledge
              current={current}
              badges={badges}
              onProfilePress={openProfile}
              onNavigate={(key: TabKey) => {
                const route = state.routes.find((r) => r.name === key);
                if (!route) return;
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(route.name as never);
                }
              }}
            />
          );
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="friends" />
        <Tabs.Screen name="events" />
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="news" />
        {/* Messages stays routable from the header paper-plane, but off the pill */}
        <Tabs.Screen name="messages" options={{ href: null }} />
        {/* Profile stays routable from the header avatar, but off the pill */}
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </ProfileLinkProvider>
  );
}

/**
 * Floating pill plus "you opened this tab" ack so the nav-bar dot clears while
 * section title dots on the page still point at the unread source.
 */
function TabBarWithAcknowledge({
  current,
  badges,
  onProfilePress,
  onNavigate
}: {
  current: string;
  badges: Partial<Record<TabKey, boolean>>;
  onProfilePress: () => void;
  onNavigate: (key: TabKey) => void;
}) {
  // THIS SECTION DOES: clear the nav-bar dot the moment this tab is showing.
  useEffect(() => {
    if (isTabKey(current)) acknowledgeTab(current);
  }, [current]);

  return (
    <FloatingTabBar
      value={current}
      badges={badges}
      onProfilePress={onProfilePress}
      onChange={(key: TabKey) => {
        acknowledgeTab(key);
        onNavigate(key);
      }}
    />
  );
}
