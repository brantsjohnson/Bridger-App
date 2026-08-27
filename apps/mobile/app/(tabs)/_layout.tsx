// ============================================
// WHAT THIS FILE DOES (plain English):
// Sets up the main tabs — Home, Friends, Events, Discover, News — and swaps the
// default bottom bar for Bridger's floating pill nav. Messages and Profile are
// still real screens here, but they are NOT in the pill: you open Profile from
// the header photo (left of the title) and Messages from the header paper-plane
// (top-right). The pill hides while you're on Profile (nothing would look
// selected).
// ============================================
import React, { useCallback, useEffect, useMemo } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar, ProfileLinkProvider, type TabKey } from '@bridger/ui';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { getMe } from '../../data/people';
import { getTabBadges } from '../../data/tab-badges';
import { isDemoMode } from '../../lib/demo';
import { loadPeople } from '../../lib/people-cache';

// Keep the app on Home when it first opens.
export const unstable_settings = {
  initialRouteName: 'home'
};

export default function TabsLayout() {
  const router = useRouter();
  const me = getMe();

  // Live: fill the people cache so personById / roster look-ups work sync.
  useEffect(() => {
    if (isDemoMode()) return;
    void loadPeople();
  }, []);

  // Header photo → your Profile page (not a bottom-tab destination).
  const openProfile = useCallback(() => {
    router.push('/(tabs)/profile');
  }, [router]);

  // Header paper-plane → your Messages inbox (moved off the bottom pill).
  const openMessages = useCallback(() => {
    router.push('/(tabs)/messages');
  }, [router]);

  const profile = useMemo(
    () => ({
      name: me.name,
      emoji: me.emoji,
      accent: me.accent,
      // Uses a dropped-in photo from assets/demo/profile-pics when present.
      photo: getProfilePhoto('me')
    }),
    [me.name, me.emoji, me.accent]
  );

  return (
    <ProfileLinkProvider profile={profile} open={openProfile} openMessages={openMessages}>
      <Tabs
        screenOptions={{ headerShown: false }}
        // --- THE NAV: Expo Router tab state → FloatingTabBar, and a pill tap
        //     back into real navigation. ---
        tabBar={({ state, navigation }) => {
          const current = state.routes[state.index]?.name as string;
          // Profile and Messages open from the header, not the pill — hide the
          // bar so nothing looks "half selected" while you're on those pages.
          if (current === 'profile' || current === 'messages') return null;
          return (
            <FloatingTabBar
              value={current}
              badges={getTabBadges()}
              onChange={(key: TabKey) => {
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
