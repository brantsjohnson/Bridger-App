// ============================================
// WHAT THIS FILE DOES (plain English):
// The Co-op benefits screen. Shows what is always free vs what members unlock,
// the price ($6/month or $60/year with 2 months free), and Join / Open portal.
// From Magic Patterns coop/index. Connecting is never behind a paywall.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckIcon } from 'lucide-react-native';
import {
  FREE_BENEFITS,
  HOME,
  MEMBER_BENEFITS,
  MEMBER_UNLOCKS
} from '@bridger/shared';
import { COOP } from '../../lib/analytics-ids';
import { purchasesAvailable } from '../../lib/purchases';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  ListRow,
  ORGANIC,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader,
  ACCENTS,
  cn
} from '@bridger/ui';
import { PortalPanel } from '../../components/coop/PortalPanel';
import { JoinCoopSheet } from '../../components/coop/JoinCoopSheet';
import { getMembership, joinCoop, redeemPromoCode } from '../../data/coop';

const ALWAYS_FREE = [
  'Meet people in Discover, including the reveal',
  'Add anyone, unlimited acquaintances',
  'Messages, Touch Grass, quizzes, Inside Jokes, Bucket list',
  'Answering any poll or question you are sent',
  'Post stories (photos, text, voice, stickers)',
  'Watch every story and video, view every profile',
  'Attend events, host up to 35',
  'Previous-week recap of stories'
];

// Member perk cards: shared list so onboarding matches this page.
const UNLOCKS = MEMBER_UNLOCKS;

const PORTAL_LINKS = [
  { label: 'Vote on what gets built', line: 'One member, one vote' },
  { label: 'Where the money goes', line: 'Open books, every quarter' },
  { label: 'Send feedback', line: 'Straight to the people building it' }
];

export default function CoopBenefitsScreen() {
  const router = useRouter();
  const [member, setMember] = useState(false);
  const [since, setSince] = useState<string | undefined>();
  const [renews, setRenews] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  // Our custom paywall sheet (pick method, then monthly / yearly).
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  // Auth-code redeem panel (free year, no payment).
  const [showRedeem, setShowRedeem] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    void getMembership().then((m) => {
      setMember(m.member);
      setSince(m.since);
      setRenews(m.renews);
    });
  }, []);

  const caps = member ? MEMBER_BENEFITS : FREE_BENEFITS;

  // THIS SECTION DOES: open our own join sheet (pick method, then plan).
  function onJoin() {
    if (busy) return;
    setJoinSheetOpen(true);
  }

  // THIS SECTION DOES: run the real purchase after they pick method + plan.
  // Apple / Google go through the store (RevenueCat); Card opens Stripe. On
  // success we open the portal. A cancel just leaves the sheet open.
  async function handleChoose(
    method: 'apple' | 'google' | 'card',
    plan: 'monthly' | 'yearly'
  ) {
    if (busy) return;
    setBusy(true);
    try {
      const m = await joinCoop(method, plan);
      setMember(m.member);
      setSince(m.since);
      setRenews(m.renews);
      setJoinSheetOpen(false);
      if (m.member) router.push('/coop/portal');
    } catch (err) {
      const { PurchaseCancelledError } = await import('../../data/coop');
      if (err instanceof PurchaseCancelledError) return;
      Alert.alert(
        'Could not join',
        err instanceof Error ? err.message : 'Try again in a moment.'
      );
    } finally {
      setBusy(false);
    }
  }

  // THIS SECTION DOES: restore a prior App Store / Play purchase onto this account.
  async function onRestore() {
    if (busy) return;
    setBusy(true);
    try {
      const { restoreCoopPurchases } = await import('../../data/coop');
      const m = await restoreCoopPurchases();
      setMember(m.member);
      setSince(m.since);
      setRenews(m.renews);
      if (m.member) router.push('/coop/portal');
    } catch (err) {
      Alert.alert(
        'Restore',
        err instanceof Error ? err.message : 'Could not restore purchases.'
      );
    } finally {
      setBusy(false);
    }
  }

  // THIS SECTION DOES: redeem an auth code for a free year, then open the portal.
  async function onRedeem() {
    if (redeeming || !code.trim()) return;
    setRedeeming(true);
    try {
      const res = await redeemPromoCode(code);
      setMember(res.membership.member);
      setSince(res.membership.since);
      setRenews(res.membership.renews);
      setShowRedeem(false);
      setCode('');
      router.push('/coop/portal');
    } catch (err) {
      Alert.alert(
        'Code',
        err instanceof Error ? err.message : 'That code did not work.'
      );
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Co-op"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.benefits.page_title}
      />
      <ScreenBody>
        <AnalyticsRegion analyticsId={COOP.benefits.hero} interactive={false}>
          <View style={ORGANIC.banner} className="mb-4 overflow-hidden bg-teal p-5">
            <Text className="font-pixel text-[17px] leading-tight text-onaccent">
              You are not the product.
            </Text>
            <Text className="mt-1.5 font-sans-sb text-[14px] text-onaccent/80">
              {member
                ? `Member${since ? ` since ${since}` : ''}${renews ? ` · renews ${renews}` : ''}`
                : '$6/mo or $60/yr · members keep it running'}
            </Text>
          </View>
        </AnalyticsRegion>

        <View className="mb-5">
          <SectionTitle
            title="Always free"
            description="Connecting is never behind a paywall. Everyone can meet people, message friends, and use the core of Bridger without joining the co-op."
            infoAnalyticsId={COOP.benefits.free_info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <PortalPanel accent="green" fill="solid" shape="soft">
            <View className="gap-2">
              {ALWAYS_FREE.map((line) => (
                <View key={line} className="flex-row items-start gap-2.5">
                  <View className="mt-0.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/30">
                    <CheckIcon size={12} color="#1C1B16" strokeWidth={3.5} />
                  </View>
                  <Text className="flex-1 font-sans-sb text-[14px] text-onaccent">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </PortalPanel>
        </View>

        <View className="mb-5">
          <SectionTitle
            title="Members get"
            description="Member perks are about room to customize and host — never about who you are allowed to connect with."
            infoAnalyticsId={COOP.benefits.unlocks_info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <View className="flex-row flex-wrap gap-2.5">
            {UNLOCKS.map((u, i) => (
              <View key={u.key} className="w-[47%] min-w-[140px] flex-1">
                <PortalPanel
                  accent={u.accent}
                  fill="solid"
                  shape={i % 2 === 0 ? 'soft' : 'flip'}
                  className="p-4"
                >
                  <Text className="text-[18px]">{u.emoji}</Text>
                  <Text
                    className={cn(
                      'mt-2 font-sans-b text-[15px] leading-tight',
                      ACCENTS[u.accent].text
                    )}
                  >
                    {u.title}
                  </Text>
                  <Text
                    className={cn(
                      'mt-0.5 font-sans-sb text-[12px] leading-snug',
                      ACCENTS[u.accent].text
                    )}
                    style={{ opacity: 0.88 }}
                  >
                    {u.line}
                  </Text>
                </PortalPanel>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-5">
          <SectionTitle
            title="Your circles"
            description="Acquaintances stay unlimited for everyone. Free Lite is 5 Close and 30 Friends. Co-op is 25 Close and 125 Friends, plus named groups."
            infoAnalyticsId={COOP.benefits.info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />
          <PortalPanel accent="purple" fill="solid" shape="bold">
            {(
              [
                ['Close friends', caps.circleCaps.close],
                ['Friends', caps.circleCaps.friends],
                ['Acquaintances', 'Unlimited']
              ] as const
            ).map(([label, value]) => (
              <View
                key={String(label)}
                className="flex-row items-center justify-between py-1.5"
              >
                <Text className="font-sans-sb text-[14px] text-white">{label}</Text>
                <Text className="font-sans-b text-[14px] text-white/85">
                  {value === Infinity ? 'Unlimited' : value}
                </Text>
              </View>
            ))}
          </PortalPanel>
        </View>

        <PortalPanel accent="amber" fill="solid" shape="flip" className="mb-5">
          <Text className="font-sans-sb text-[13px] leading-snug text-onaccent/90">
            <Text className="font-sans-b text-onaccent">Always readable. </Text>
            Any profile can be switched to the plain view in one tap, however it
            is decorated.
          </Text>
        </PortalPanel>

        <View className="mb-8">
          <SectionTitle
            title="Member portal"
            description="The public governance hub: mission, model, ideas, beta votes, and open books. Anyone can read; members can participate."
            infoAnalyticsId={COOP.portal.info}
            parentScreen="coop"
            section="benefits"
            className="mb-3"
          />

          <View className="gap-2.5">
            {PORTAL_LINKS.map((l) => (
              <ListRow
                key={l.label}
                label={l.label}
                sublabel={l.line}
                trailing="chevron"
                onPress={() => router.push('/coop/portal')}
                analyticsId={HOME.coop.open_portal}
              />
            ))}

            {member ? (
              <ButtonPrimary
                full
                size="lg"
                analyticsId={COOP.benefits.open_portal}
                onPress={() => router.push('/coop/portal')}
                accessibilityLabel="Open the member portal"
              >
                Open the portal
              </ButtonPrimary>
            ) : (
              <>
                <PortalPanel accent="coral" fill="solid" shape="soft">
                  <Text className="font-sans-sb text-[13px] leading-snug text-onaccent/90">
                    <Text className="font-sans-b text-onaccent">Members only. </Text>
                    Joining opens the portal, where members vote on what gets
                    built and see where the money goes.
                  </Text>
                </PortalPanel>
                <ButtonPrimary
                  full
                  size="lg"
                  analyticsId={COOP.benefits.join}
                  onPress={() => void onJoin()}
                  loading={busy}
                  accessibilityLabel="Join the co-op. Opens monthly or yearly membership options."
                >
                  Join · from $6 a month
                </ButtonPrimary>
                {purchasesAvailable() ? (
                  <ButtonSecondary
                    full
                    tone="ghost"
                    analyticsId={COOP.benefits.restore}
                    onPress={() => void onRestore()}
                    accessibilityLabel="Restore a previous co-op purchase"
                  >
                    Restore purchases
                  </ButtonSecondary>
                ) : null}

                {/* Auth code: a free year without paying. Tucked below join. */}
                {showRedeem ? (
                  <PortalPanel accent="amber" fill="surface" shape="bold">
                    <Text className="font-sans-b text-[14px] text-ink">
                      Have an auth code?
                    </Text>
                    <Text className="mt-0.5 font-sans-sb text-[12px] text-ink-soft">
                      Enter it for a free year of the co-op.
                    </Text>
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      placeholder="BRIDGER-FREE-YEAR"
                      placeholderTextColor="#8A8778"
                      accessibilityLabel="Auth code"
                      className="mt-2 rounded-card border border-ink-line bg-surface px-3 py-2.5 font-sans-sb text-[15px] text-ink"
                    />
                    <View className="mt-3">
                      <ButtonPrimary
                        full
                        size="sm"
                        analyticsId={COOP.benefits.redeem_submit}
                        onPress={() => void onRedeem()}
                        loading={redeeming}
                        accessibilityLabel="Redeem auth code for a free year"
                      >
                        Redeem free year
                      </ButtonPrimary>
                    </View>
                  </PortalPanel>
                ) : (
                  <ButtonSecondary
                    full
                    tone="ghost"
                    analyticsId={COOP.benefits.redeem_open}
                    onPress={() => setShowRedeem(true)}
                    accessibilityLabel="I have an auth code"
                  >
                    Have an auth code?
                  </ButtonSecondary>
                )}
              </>
            )}
          </View>
        </View>

      </ScreenBody>

      {/* JOIN: our own paywall — pick method (App Store / Play / Card), then plan. */}
      <JoinCoopSheet
        open={joinSheetOpen}
        onClose={() => setJoinSheetOpen(false)}
        onChoose={handleChoose}
        busy={busy}
        surface="coop_join_sheet"
        parentScreen="coop"
        yearlyLabel="$60 / year"
        ids={{
          apple: COOP.benefits.apple_pay,
          google: COOP.benefits.google_pay,
          card: COOP.benefits.card,
          planMonthly: COOP.benefits.plan_monthly,
          planYearly: COOP.benefits.plan_yearly
        }}
      />
    </Screen>
  );
}
