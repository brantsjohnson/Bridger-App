// ============================================
// WHAT THIS FILE DOES (plain English):
// Mission principles — public to read. Members can support a principle;
// we never show how many people supported it. Titles open a short explainer.
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CoopMissionPrinciple } from '@bridger/shared';
import { COOP } from '../../../lib/analytics-ids';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  ACCENTS,
  cn
} from '@bridger/ui';
import { PortalNav } from '../../../components/coop/PortalNav';
import {
  PortalPanel,
  portalAccentForIndex,
  portalShapeForIndex
} from '../../../components/coop/PortalPanel';
import {
  getMembership,
  listMission,
  toggleMissionSupport
} from '../../../data/coop';

export default function CoopMissionScreen() {
  const router = useRouter();
  const [member, setMember] = useState(false);
  const [principles, setPrinciples] = useState<CoopMissionPrinciple[]>([]);

  const load = useCallback(async () => {
    const [m, list] = await Promise.all([getMembership(), listMission()]);
    setMember(m.member);
    setPrinciples(list);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function onSupport(id: string) {
    if (!member) {
      router.push('/coop');
      return;
    }
    const supported = await toggleMissionSupport(id);
    setPrinciples((prev) =>
      prev.map((p) => (p.id === id ? { ...p, supportedByMe: supported } : p))
    );
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Mission"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.mission.page_title}
      />
      <ScreenBody>
        <PortalNav />
        <SectionTitle
          title="What we stand for"
          description="These are the co-op's public principles. Members can stand behind them. We never show how many people supported each one."
          infoAnalyticsId={COOP.mission.info}
          parentScreen="coop"
          section="mission"
          className="mb-4"
        />

        <View className="mb-8 gap-3">
          {principles.map((p, i) => (
            <AnalyticsRegion
              key={p.id}
              analyticsId={COOP.mission.principle_card}
              interactive={false}
            >
              <PortalPanel
                accent={portalAccentForIndex(i)}
                fill="solid"
                shape={portalShapeForIndex(i)}
              >
                <Text
                  className={cn(
                    'font-sans-b text-[16px]',
                    ACCENTS[portalAccentForIndex(i)].text
                  )}
                >
                  {p.title}
                </Text>
                <Text
                  className={cn(
                    'mt-1.5 font-sans-sb text-[14px] leading-snug',
                    ACCENTS[portalAccentForIndex(i)].text
                  )}
                  style={{ opacity: 0.9 }}
                >
                  {p.body}
                </Text>
                <View className="mt-3">
                  {member && !p.supportedByMe ? (
                    <ButtonPrimary
                      size="sm"
                      analyticsId={COOP.mission.support}
                      onPress={() => void onSupport(p.id)}
                      accessibilityLabel="Support this principle"
                    >
                      I stand with this
                    </ButtonPrimary>
                  ) : (
                    <ButtonSecondary
                      size="sm"
                      tone={p.supportedByMe ? 'light' : 'outline'}
                      className={!p.supportedByMe ? 'border-white/50' : undefined}
                      analyticsId={COOP.mission.support}
                      onPress={() => void onSupport(p.id)}
                      accessibilityLabel={
                        p.supportedByMe
                          ? 'Remove support'
                          : 'Join to support this principle'
                      }
                    >
                      {member
                        ? p.supportedByMe
                          ? 'Standing with this'
                          : 'I stand with this'
                        : 'Join to support'}
                    </ButtonSecondary>
                  )}
                </View>
              </PortalPanel>
            </AnalyticsRegion>
          ))}
        </View>
      </ScreenBody>
    </Screen>
  );
}
