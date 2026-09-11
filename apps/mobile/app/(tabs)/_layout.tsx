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
import { Tabs, usePathname, useRouter } from 'expo-router';
import { FloatingTabBar, ProfileLinkProvider, type TabKey } from '@bridger/ui';
import { getMe } from '../../data/people';
import { acknowledgeTab } from '../../data/tab-badges';
import { useTabAttention } from '../../hooks/useTabAttention';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { isDemoMode } from '../../lib/demo';
import { setMessagesReturnTo } from '../../lib/messages-return';
import { getCachedMe, loadPeople, subscribePeople } from '../../lib/people-cache';
import {
  hydrateTabSnapshots,
  isTabSnapshotsReady,
  markTabEntersSettled
} from '../../lib/tab-snapshots';
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
  const pathname = usePathname();
  const { loading: authLoading, session } = useAuth();
  const demoMode = isDemoMode();
  const me = getMe();
  const ownerKey = demoMode ? 'demo' : session?.user?.id ?? '';
  // Wait one beat for last-seen tabs to load from the phone so the first
  // paint is already the saved Home / Friends / Events, not empty boxes.
  const [snapReady, setSnapReady] = useState(() =>
    ownerKey ? isTabSnapshotsReady(ownerKey) : false
  );
  // Rerender when the live people cache finishes so the header picks up
  // your real avatar URL (demo uses the local asset right away).
  const [peopleTick, setPeopleTick] = useState(0);
  // THIS SECTION DOES: keep the floating-nav dots in sync when you open a tab
  // (nav dot clears; section title dots stay on that page).
  const { badges } = useTabAttention();

  // THIS SECTION DOES: load last-seen tab pictures before the screens mount.
  useEffect(() => {
    if (!demoMode && (authLoading || !session)) return;
    if (!ownerKey) return;
    let cancelled = false;
    void hydrateTabSnapshots(ownerKey).finally(() => {
      if (!cancelled) setSnapReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, demoMode, ownerKey, session]);

  // After the first paint, remounts should not replay fade-ins.
  useEffect(() => {
    if (!snapReady) return;
    const t = setTimeout(() => markTabEntersSettled(), 700);
    return () => clearTimeout(t);
  }, [snapReady]);

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

  // Header paper-plane → Messages. Stash the current tab so Back can return.
  const openMessages = useCallback(() => {
    setMessagesReturnTo(pathname);
    router.push('/(tabs)/messages');
  }, [pathname, router]);

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
  if (!snapReady) return null;

  return (
    <ProfileLinkProvider profile={profile} open={openProfile} openMessages={openMessages}>
      <Tabs
        // Keep every tab built so a pill tap does not rebuild the page.
        // Freeze hidden tabs so they do not redo work until you come back.
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          lazy: false
        }}
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
