// ============================================
// WHAT THIS FILE DOES (plain English):
// How the co-op works: why a co-op, phase roadmap, and a simple comparison
// with other member-owned orgs. Column headers for Green Bay / REI / credit
// union open their sites in the browser. Chart rows have thin lines so the
// grid is easy to scan. Read-only.
// ============================================
import React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { COOP } from '@bridger/shared';
import {
  AnalyticsRegion,
  ORGANIC,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn
} from '@bridger/ui';
import { PortalNav } from '../../../components/coop/PortalNav';
import {
  PortalPanel,
  portalAccentForIndex,
  portalBodyClass,
  portalShapeForIndex,
  portalTitleClass
} from '../../../components/coop/PortalPanel';
import {
  COMPARE_COLUMNS,
  COMPARE_ROWS,
  PHASES,
  WHY_COOP,
  type CompareCell
} from '../../../data/fixtures/coop-governance';

const CELL: Record<
  CompareCell,
  { label: string; tone: 'success' | 'amber' | 'coral' | 'mute' }
> = {
  yes: { label: 'Yes', tone: 'success' },
  planned: { label: 'Planned', tone: 'amber' },
  limited: { label: 'Limited', tone: 'amber' },
  no: { label: 'No', tone: 'mute' }
};

export default function CoopModelScreen() {
  const router = useRouter();

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Co-op model"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.model.page_title}
      />
      <ScreenBody>
        <PortalNav />

        <SectionTitle
          title="Why a co-op"
          description="A short plain-language reason Bridger is member-owned: so the product cannot be sold out from under the people who use it."
          infoAnalyticsId={COOP.model.info}
          parentScreen="coop"
          section="model"
          className="mb-3"
        />
        <PortalPanel accent="purple" fill="solid" shape="banner" className="mb-6">
          <Text
            className={cn(portalBodyClass('purple'), 'text-[14px] leading-snug')}
            style={{ opacity: 0.92 }}
          >
            {WHY_COOP}
          </Text>
        </PortalPanel>

        <SectionTitle
          title="Roadmap"
          description="Phases from now (Phase 0) toward fuller legal and board structures. The teal card is where we are today."
          infoAnalyticsId={COOP.model.roadmap_info}
          parentScreen="coop"
          section="model"
          className="mb-3"
        />
        <View className="mb-6 gap-3">
          {PHASES.map((phase, i) => (
            <AnalyticsRegion
              key={phase.name}
              analyticsId={COOP.model.phase_card}
              interactive={false}
            >
              {phase.current ? (
                <View style={ORGANIC.bold} className="overflow-hidden bg-teal p-5">
                  <Text className="font-sans-b text-[11px] uppercase text-onaccent/80">
                    Current · {phase.cost}
                  </Text>
                  <Text className="mt-1 font-sans-b text-[16px] text-onaccent">
                    {phase.name}
                  </Text>
                  <Text className="mt-1.5 font-sans-sb text-[13px] text-onaccent/90">
                    {phase.description}
                  </Text>
                </View>
              ) : (
                <PortalPanel
                  accent={portalAccentForIndex(i + 1)}
                  fill="solid"
                  shape={portalShapeForIndex(i)}
                >
                  <Text
                    className={cn(
                      portalTitleClass(portalAccentForIndex(i + 1)),
                      'text-[11px] uppercase'
                    )}
                    style={{ opacity: 0.8 }}
                  >
                    {phase.cost}
                  </Text>
                  <Text
                    className={cn(
                      portalTitleClass(portalAccentForIndex(i + 1)),
                      'mt-1 text-[16px]'
                    )}
                  >
                    {phase.name}
                  </Text>
                  <Text
                    className={cn(
                      portalBodyClass(portalAccentForIndex(i + 1)),
                      'mt-1.5 text-[13px]'
                    )}
                    style={{ opacity: 0.9 }}
                  >
                    {phase.description}
                  </Text>
                  <View className="mt-2 gap-1">
                    {phase.includes.map((line) => (
                      <Text
                        key={line}
                        className={cn(
                          portalBodyClass(portalAccentForIndex(i + 1)),
                          'text-[12px]'
                        )}
                        style={{ opacity: 0.85 }}
                      >
                        · {line}
                      </Text>
                    ))}
                  </View>
                </PortalPanel>
              )}
            </AnalyticsRegion>
          ))}
        </View>

        <SectionTitle
          title="How we compare"
          description="A quick yes / planned / no grid against other member-owned orgs. Tap Green Bay, REI, or Credit Union to open their site. A No in Phase 0 does not mean never — participation unlocks in order."
          infoAnalyticsId={COOP.model.compare_info}
          parentScreen="coop"
          section="model"
          className="mb-3"
        />
        <AnalyticsRegion analyticsId={COOP.model.comparison} interactive={false}>
          {/* Surface + thin row rules so the dense grid stays scannable */}
          <PortalPanel accent="blue" fill="surface" shape="soft">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="min-w-[720px]">
                <View className="mb-0 flex-row gap-1 border-b border-ink pb-2.5">
                  <Text className="w-[140px] font-sans-b text-[11px] text-ink-mute">
                    Ability
                  </Text>
                  {COMPARE_COLUMNS.map((c) =>
                    c.href ? (
                      <Pressable
                        key={c.label}
                        onPress={() => void Linking.openURL(c.href!)}
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${c.label} website`}
                        className="w-[72px]"
                      >
                        <Text
                          className="font-sans-b text-[10px] text-blue underline"
                          numberOfLines={3}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        key={c.label}
                        className="w-[72px] font-sans-b text-[10px] text-ink-mute"
                        numberOfLines={2}
                      >
                        {c.label}
                      </Text>
                    )
                  )}
                </View>
                {COMPARE_ROWS.map((row) => (
                  <View
                    key={row.row}
                    className="flex-row items-center gap-1 border-b border-ink-line py-2.5"
                  >
                    <Text
                      className="w-[140px] font-sans-sb text-[11px] text-ink"
                      numberOfLines={3}
                    >
                      {row.row}
                    </Text>
                    {row.values.map((cell, i) => {
                      const meta = CELL[cell];
                      return (
                        <View key={`${row.row}-${i}`} className="w-[72px]">
                          <Text
                            className={cn(
                              'font-sans-b text-[11px]',
                              meta.tone === 'success' && 'text-success',
                              meta.tone === 'amber' && 'text-amber',
                              meta.tone === 'mute' && 'text-ink-mute'
                            )}
                          >
                            {meta.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </PortalPanel>
        </AnalyticsRegion>
        <View className="h-8" />
      </ScreenBody>
    </Screen>
  );
}
