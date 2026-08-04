// ============================================
// WHAT THIS FILE DOES (plain English):
// Sets up the 5 main tabs of the app — Home, Friends, Events, Discover, Profile
// — and swaps the default bottom bar for Bridger's floating pill nav from the
// design system. Each tab is its own file in this folder; this file just lists
// them in order and tells Expo Router to draw our custom nav instead of the
// standard one.
// ============================================
import { Tabs } from 'expo-router';
import { FloatingTabBar, type TabKey } from '@bridger/ui';

// Keep the app on Home when it first opens.
export const unstable_settings = {
  initialRouteName: 'home'
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      // --- THE NAV: translate Expo Router's tab state into our FloatingTabBar,
      //     and turn a tap on a pill back into a real navigation. ---
      tabBar={({ state, navigation }) => {
        const current = state.routes[state.index]?.name as TabKey;
        return (
          <FloatingTabBar
            value={current}
            badges={{ discover: true }}
            onChange={(key) => {
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
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
