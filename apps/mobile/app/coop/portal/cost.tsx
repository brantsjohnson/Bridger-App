// ============================================
// WHAT THIS FILE DOES (plain English):
// Open books + full cost simulator + volunteer roles. Section titles open
// short explainers. Containers use organic shapes and accent color.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CoopEconomicsRow, CoopRole } from '@bridger/shared';
import {
  COOP,
  DEFAULT_COST_INPUTS,
  computeCosts,
  type CostModelInputs
} from '@bridger/shared';
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
import { listEconomics, listRoles } from '../../../data/coop';

function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  max,
  suffix = ''
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="flex-1 font-sans-sb text-[13px] text-ink">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() =>
            onChange(Math.max(min, Math.round((value - step) * 1000) / 1000))
          }
          className="h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-surface"
        >
          <Text className="font-sans-b text-[16px] text-ink">−</Text>
        </Pressable>
        <Text className="min-w-[72px] text-center font-sans-b text-[14px] text-ink">
          {step < 1
            ? `${Math.round(value * 100)}%`
            : suffix === '$'
              ? `$${value}`
              : `${value.toLocaleString()}${suffix}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() =>
            onChange(Math.min(max, Math.round((value + step) * 1000) / 1000))
          }
          className="h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-surface"
        >
          <Text className="font-sans-b text-[16px] text-ink">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CoopCostScreen() {
  const router = useRouter();
  const [inputs, setInputs] = useState<CostModelInputs>({
    ...DEFAULT_COST_INPUTS,
    annualDues: 24
  });
  const [books, setBooks] = useState<CoopEconomicsRow[]>([]);
  const [roles, setRoles] = useState<CoopRole[]>([]);
  const [openRole, setOpenRole] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([listEconomics(), listRoles()]).then(([e, r]) => {
      setBooks(e);
      setRoles(r);
    });
  }, []);

  const result = useMemo(() => computeCosts(inputs), [inputs]);
  const booksTotal = books.reduce((s, b) => s + b.monthlyCents, 0) || 1;

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Cost"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.cost.page_title}
      />
      <ScreenBody>
        <PortalNav />

        <SectionTitle
          title="Open books"
          description="Planning assumptions for hosting and operations, shown monthly. Live accounting expands when dues are collected for real."
          infoAnalyticsId={COOP.cost.books_info}
          parentScreen="coop"
          section="cost"
          className="mb-3"
        />
        <AnalyticsRegion analyticsId={COOP.cost.books} interactive={false}>
          <PortalPanel accent="blue" fill="solid" shape="banner" className="mb-5">
            {books.map((b) => (
              <View
                key={b.id}
                className="mb-2 flex-row items-center justify-between"
              >
                <Text className="flex-1 font-sans-sb text-[13px] text-white">
                  {b.label}
                </Text>
                <Text className="font-sans-b text-[13px] text-white/85">
                  ${Math.round(b.monthlyCents / 100).toLocaleString()}/mo
                </Text>
              </View>
            ))}
            <View className="mt-2 h-2.5 flex-row overflow-hidden rounded-full bg-white/25">
              {books.map((b, i) => (
                <View
                  key={b.id}
                  className={cn(
                    'h-full',
                    ['bg-purple', 'bg-teal', 'bg-amber', 'bg-coral', 'bg-white'][
                      i % 5
                    ]
                  )}
                  style={{ width: `${(b.monthlyCents / booksTotal) * 100}%` }}
                />
              ))}
            </View>
          </PortalPanel>
        </AnalyticsRegion>

        <SectionTitle
          title="Sustainability simulator"
          description="Play with member count, dues, and usage to see break-even. Default dues are $24/year. This is a planning tool, not a vote."
          infoAnalyticsId={COOP.cost.sim_info}
          parentScreen="coop"
          section="cost"
          className="mb-3"
        />
        <AnalyticsRegion analyticsId={COOP.cost.slider} interactive={false}>
          <PortalPanel accent="teal" fill="surface" shape="bold" className="mb-4">
            <Stepper
              label="Members"
              value={inputs.members}
              min={50}
              max={100000}
              step={50}
              onChange={(members) => setInputs((s) => ({ ...s, members }))}
            />
            <Stepper
              label="Annual dues"
              value={inputs.annualDues}
              min={0}
              max={120}
              step={1}
              suffix="$"
              onChange={(annualDues) => setInputs((s) => ({ ...s, annualDues }))}
            />
            <Stepper
              label="Paying share"
              value={inputs.payingRate}
              min={0.01}
              max={1}
              step={0.01}
              onChange={(payingRate) => setInputs((s) => ({ ...s, payingRate }))}
            />
            <Stepper
              label="Monthly active"
              value={inputs.monthlyActiveRate}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(monthlyActiveRate) =>
                setInputs((s) => ({ ...s, monthlyActiveRate }))
              }
            />
            <ButtonSecondary
              size="sm"
              tone="outline"
              analyticsId={COOP.cost.reset}
              onPress={() =>
                setInputs({ ...DEFAULT_COST_INPUTS, annualDues: 24 })
              }
            >
              Reset defaults
            </ButtonSecondary>
          </PortalPanel>
        </AnalyticsRegion>

        <PortalPanel accent="green" fill="solid" shape="soft" className="mb-5">
          <Text className="font-sans-b text-[14px] text-onaccent">
            Annual costs: ${Math.round(result.annualCosts).toLocaleString()}
          </Text>
          <Text className="mt-1 font-sans-b text-[14px] text-onaccent">
            Annual revenue: ${Math.round(result.annualRevenue).toLocaleString()}
          </Text>
          <Text className="mt-1 font-sans-sb text-[13px] text-onaccent/85">
            Break-even members:{' '}
            {result.breakEvenMembers == null
              ? '—'
              : result.breakEvenMembers.toLocaleString()}
          </Text>
          <Text className="mt-2 font-sans-sb text-[12px] text-onaccent/70">
            Storage pressure ~{result.effectiveStorageGb.toFixed(1)} GB with
            backups · egress ~{result.monthlyEgressGb.toFixed(1)} GB/mo
          </Text>
        </PortalPanel>

        <SectionTitle
          title="Volunteer roles"
          description="Work does not disappear — someone is doing it. Tap a role to see responsibilities and risks. Hours are estimates."
          infoAnalyticsId={COOP.cost.roles_info}
          parentScreen="coop"
          section="cost"
          className="mb-3"
        />
        <View className="mb-8 gap-2.5">
          {roles.map((r, i) => {
            const open = openRole === r.id;
            return (
              <AnalyticsRegion
                key={r.id}
                analyticsId={COOP.cost.role_card}
                interactive={false}
              >
                <PortalPanel
                  accent={portalAccentForIndex(i)}
                  fill="solid"
                  shape={portalShapeForIndex(i)}
                >
                  <Pressable
                    onPress={() => setOpenRole(open ? null : r.id)}
                    accessibilityRole="button"
                    accessibilityLabel={r.title}
                  >
                    <Text
                      className={cn(
                        'font-sans-b text-[15px]',
                        ACCENTS[portalAccentForIndex(i)].text
                      )}
                    >
                      {r.title}
                    </Text>
                    <Text
                      className={cn(
                        'mt-0.5 font-sans-sb text-[12px]',
                        ACCENTS[portalAccentForIndex(i)].text
                      )}
                      style={{ opacity: 0.8 }}
                    >
                      {r.hoursWeek ? `${r.hoursWeek} hrs/week · ` : ''}
                      Volunteer
                    </Text>
                  </Pressable>
                  {open && r.responsibilities ? (
                    <Text
                      className={cn(
                        'mt-2 font-sans-sb text-[13px] leading-snug',
                        ACCENTS[portalAccentForIndex(i)].text
                      )}
                      style={{ opacity: 0.9 }}
                    >
                      {r.responsibilities}
                    </Text>
                  ) : null}
                  {open && r.risks ? (
                    <Text
                      className={cn(
                        'mt-2 font-sans-sb text-[12px]',
                        ACCENTS[portalAccentForIndex(i)].text
                      )}
                      style={{ opacity: 0.85 }}
                    >
                      Risks:{'\n'}
                      {r.risks}
                    </Text>
                  ) : null}
                  {!open ? (
                    <View className="mt-2">
                      <ButtonPrimary
                        size="sm"
                        onPress={() => setOpenRole(r.id)}
                      >
                        Details
                      </ButtonPrimary>
                    </View>
                  ) : null}
                </PortalPanel>
              </AnalyticsRegion>
            );
          })}
        </View>
      </ScreenBody>
    </Screen>
  );
}
