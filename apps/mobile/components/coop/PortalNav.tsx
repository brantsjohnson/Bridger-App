// ============================================
// WHAT THIS FILE DOES (plain English):
// Horizontal chips for the co-op portal sections so every page feels like one
// place with multiple rooms (Overview, Mission, Model, Ideas, Vote, Cost).
// Active chip uses teal (not black) so CTAs and nav stay colorful.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import { COOP } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';

const TABS: { label: string; href: Href; id: string }[] = [
  { label: 'Overview', href: '/coop/portal', id: COOP.portal.nav_overview },
  { label: 'Mission', href: '/coop/portal/mission', id: COOP.mission.nav },
  { label: 'Model', href: '/coop/portal/model', id: COOP.model.nav },
  { label: 'Ideas', href: '/coop/portal/ideas', id: COOP.ideas.nav },
  { label: 'Vote', href: '/coop/portal/vote', id: COOP.vote.nav },
  { label: 'Cost', href: '/coop/portal/cost', id: COOP.cost.nav }
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/coop/portal') {
    return pathname === '/coop/portal' || pathname === '/coop/portal/';
  }
  return pathname.startsWith(href);
}

export function PortalNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-0"
      >
        {TABS.map((t) => {
          const active = isActive(pathname, String(t.href));
          return (
            <Pressable
              key={String(t.href)}
              onPress={withAnalyticsPress(t.id, () => router.push(t.href))}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t.label}
              className={cn(
                'rounded-full border px-3.5 py-2',
                active
                  ? 'border-teal bg-teal'
                  : 'border-ink-line bg-surface active:bg-[#E6F7F1]'
              )}
            >
              <Text
                className={cn(
                  'font-sans-b text-[12px]',
                  active ? 'text-onaccent' : 'text-ink'
                )}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
