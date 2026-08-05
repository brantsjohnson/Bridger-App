// ============================================
// WHAT THIS FILE DOES (plain English):
// Co-op portal hub — public. Explains Phase 0 and links into Mission, Model,
// Ideas, Vote, and Cost. Cards use full accent color (not a dull wash) so
// titles and lines stay readable on the dark canvas.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { COOP } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  ORGANIC,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { PortalNav } from '../../../components/coop/PortalNav';
import { PortalPanel } from '../../../components/coop/PortalPanel';
import { getPortalOverview, type PortalOverview } from '../../../data/coop';

const GUIDES: {
  label: string;
  line: string;
  href: Href;
  accent: 'teal' | 'purple' | 'amber' | 'coral' | 'blue';
}[] = [
  {
    label: 'Mission',
    line: 'The principles members stand behind',
    href: '/coop/portal/mission',
    accent: 'teal'
  },
  {
    label: 'Co-op model',
    line: 'Phases, comparison, how governance grows',
    href: '/coop/portal/model',
    accent: 'purple'
  },
  {
    label: 'Ideas',
    line: 'What we should build next',
    href: '/coop/portal/ideas',
    accent: 'amber'
  },
  {
    label: 'Vote',
    line: 'Beta versions — approve, reject, or extend',
    href: '/coop/portal/vote',
    accent: 'coral'
  },
  {
    label: 'Cost',
    line: 'Open books and the sustainability simulator',
    href: '/coop/portal/cost',
    accent: 'blue'
  }
];

export default function CoopPortalHub() {
  const router = useRouter();
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  // Read once per render so a missing COOP export fails clearly (and Metro
  // picks up the named re-export from @bridger/shared).
  const portal = COOP.portal;

  useEffect(() => {
    void getPortalOverview()
      .then(setOverview)
      .catch(() =>
        setOverview({ member: false, members: 0, dues: '$24/year' })
      );
  }, []);

  const member = !!overview?.member;

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Co-op portal"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={portal.page_title}
      />
      <ScreenBody>
        <PortalNav />

        <AnalyticsRegion analyticsId={portal.hero} interactive={false}>
          <View style={ORGANIC.banner} className="mb-4 overflow-hidden bg-teal p-5">
            <Text className="font-pixel text-[17px] leading-tight text-onaccent">
              Phase 0 · Bridger Co-op
            </Text>
            <Text className="mt-1.5 font-sans-sb text-[14px] text-onaccent/90">
              Public to read. Members steer. Connecting is always free.
            </Text>
            {overview ? (
              <Text className="mt-3 border-t border-white/25 pt-3 font-sans-sb text-[13px] text-onaccent/90">
                {overview.members.toLocaleString()} members · {overview.dues}
                {overview.cancelAtPeriodEnd && overview.renews
                  ? ` · Cancels ${overview.renews}`
                  : member && overview.renews
                    ? ` · Renews ${overview.renews}`
                    : ''}
              </Text>
            ) : null}
          </View>
        </AnalyticsRegion>

        <View className="mb-6">
          <SectionTitle
            title="What you can do here"
            description="Tap any room below to read how the co-op works. Voting and supporting stay with members, and we never show tallies or people's names on this portal."
            infoAnalyticsId={portal.info}
            parentScreen="coop"
            section="portal"
            className="mb-3"
          />
          {/*
            One gap rhythm for every card (guides + Members participate) so Cost
            does not leave a weird empty band before the join pitch.
          */}
          <View className="gap-2.5">
            {GUIDES.map((g, i) => {
              const token = ACCENTS[g.accent];
              return (
                <Pressable
                  key={g.label}
                  onPress={withAnalyticsPress(portal.guide_card, () =>
                    router.push(g.href)
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={g.label}
                  accessibilityHint={g.line}
                >
                  {/* Solid accent — brighter than tint washes; onaccent text stays readable */}
                  <PortalPanel
                    accent={g.accent}
                    fill="solid"
                    shape={i % 2 === 0 ? 'soft' : 'flip'}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="min-w-0 flex-1">
                        <Text
                          className={cn('font-sans-b text-[16px]', token.text)}
                        >
                          {g.label}
                        </Text>
                        <Text
                          className={cn(
                            'mt-0.5 font-sans-sb text-[13px] leading-snug',
                            token.text
                          )}
                          style={{ opacity: 0.88 }}
                        >
                          {g.line}
                        </Text>
                      </View>
                      <Text
                        className={cn('font-sans-b text-[18px]', token.text)}
                        style={{ opacity: 0.75 }}
                      >
                        ›
                      </Text>
                    </View>
                  </PortalPanel>
                </Pressable>
              );
            })}

            {!member ? (
              <PortalPanel accent="purple" fill="solid" shape="bold">
                <Text
                  className="font-sans-sb text-[13px] leading-snug text-white"
                  style={{ opacity: 0.92 }}
                >
                  <Text className="font-sans-b text-white">Members participate. </Text>
                  Join to support ideas, stand behind principles, and vote on
                  beta versions. Reading stays open either way.
                </Text>
              </PortalPanel>
            ) : null}
          </View>

          {!member ? (
            <View className="mt-2.5">
              <ButtonPrimary
                full
                size="lg"
                analyticsId={portal.join_cta}
                onPress={() => router.push('/coop')}
                accessibilityLabel="Join the co-op"
              >
                Join · $24 a year
              </ButtonPrimary>
            </View>
          ) : (
            <View className="mt-2.5">
              <ButtonSecondary
                full
                tone="outline"
                analyticsId={COOP.manage.open}
                onPress={() => router.push('/coop/portal/manage')}
                accessibilityLabel="Membership settings"
              >
                Membership
              </ButtonSecondary>
            </View>
          )}
        </View>
      </ScreenBody>
    </Screen>
  );
}
