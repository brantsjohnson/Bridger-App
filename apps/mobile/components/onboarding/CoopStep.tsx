// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 12 — "Don't be the product, join the co-op." Ways in:
//   Option A — invite 3 friends and get free access (skipped or shown as
//              progress if they already invited some during contacts).
//   Option B — join directly, a paid membership ($6/mo).
// And there is always a limited free tier, so joining is never a wall.
//
// If they already invited all 3 on the contacts screen, Option A is hidden and
// they only see Join co-op + free tier.
//
// PAYMENT: membership is sold in-app. Soft-join stub for now (see COOP.md).
// ============================================
import React, { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { CreditCardIcon, UserPlusIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, AnalyticsRegion, ButtonPrimary, ButtonSecondary, PixelHeading, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

/** What membership unlocks, shown as bright, scannable cards. */
const PERKS: { emoji: string; label: string; accent: Accent }[] = [
  { emoji: '💸', label: 'Share the profits', accent: 'green' },
  { emoji: '🎨', label: 'A profile you decorate', accent: 'purple' },
  { emoji: '⭕', label: 'Bigger circles + groups', accent: 'pink' },
  { emoji: '🎥', label: 'Video updates + daily recaps', accent: 'teal' }
];

const INVITE_GOAL = 3;

export function CoopStep({
  step,
  total,
  invitesSent = 0,
  onInviteFree,
  onJoin,
  onUseFree,
  onRedeem,
  onBack
}: {
  step: number;
  total: number;
  /** How many of the 3 invite slots were already filled during contacts. */
  invitesSent?: number;
  /** Option A — invite remaining friends for free access. */
  onInviteFree: () => void | Promise<void>;
  /** Option B — join directly (soft IAP stub); method picks the pay button. */
  onJoin: (method: 'apple' | 'google' | 'card') => void;
  /** The always-there limited free tier. */
  onUseFree: () => void;
  /** Redeem an auth code for a free year. Resolves on success, throws on bad code. */
  onRedeem: (code: string) => Promise<void>;
  onBack: () => void;
}) {
  // Auth-code panel + pay-methods panel: hidden until asked for.
  const [showRedeem, setShowRedeem] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const clamped = Math.max(0, Math.min(INVITE_GOAL, invitesSent));
  const invitesComplete = clamped >= INVITE_GOAL;

  async function submitCode() {
    if (redeeming || !code.trim()) return;
    setRedeeming(true);
    try {
      await onRedeem(code);
    } catch (err) {
      Alert.alert('Code', err instanceof Error ? err.message : 'That code did not work.');
    } finally {
      setRedeeming(false);
    }
  }

  // THIS SECTION DOES: pick the invite CTA label from how many they already sent.
  const inviteLabel =
    clamped === 0
      ? 'Invite 3 friends, get free access'
      : `Invite 3 friends · ${clamped}/${INVITE_GOAL} already invited`;

  const footer = (
    <View className="gap-2.5">
      {/* OPTION A — only when they still need invites for free access. */}
      {!invitesComplete ? (
        <ButtonSecondary
          full
          size="lg"
          tone="solid"
          icon={<UserPlusIcon size={18} strokeWidth={2.5} color="#FFFFFF" />}
          analyticsId={ONBOARDING.coop.invite_free}
          analyticsProps={{ invites_sent: clamped }}
          onPress={() => void onInviteFree()}
          accessibilityLabel={inviteLabel}
        >
          {inviteLabel}
        </ButtonSecondary>
      ) : null}

      {/* OPTION B — join directly (paid). Reveals the pay buttons. */}
      {showPay ? (
        <View className="gap-2.5 rounded-card border border-ink-line bg-surface p-3">
          <ButtonSecondary
            full
            size="lg"
            tone="solid"
            analyticsId={ONBOARDING.coop.apple_pay}
            onPress={() => onJoin('apple')}
            accessibilityLabel="Join with Apple Pay"
          >
            Apple Pay
          </ButtonSecondary>
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <ButtonSecondary
                full
                size="lg"
                tone="outline"
                analyticsId={ONBOARDING.coop.google_pay}
                onPress={() => onJoin('google')}
                accessibilityLabel="Join with Google Pay"
              >
                Google Pay
              </ButtonSecondary>
            </View>
            <View className="flex-1">
              <ButtonSecondary
                full
                size="lg"
                tone="outline"
                icon={<CreditCardIcon size={16} strokeWidth={2.5} />}
                analyticsId={ONBOARDING.coop.card}
                onPress={() => onJoin('card')}
                accessibilityLabel="Join with a card"
              >
                Card
              </ButtonSecondary>
            </View>
          </View>
        </View>
      ) : (
        <ButtonSecondary
          full
          size="lg"
          tone={invitesComplete ? 'solid' : 'outline'}
          analyticsId={ONBOARDING.coop.join_paid}
          onPress={() => setShowPay(true)}
          accessibilityLabel="Join the co-op for six dollars a month"
        >
          Join the co-op, $6/mo
        </ButtonSecondary>
      )}

      {/* The always-there free tier. */}
      <ButtonSecondary
        full
        tone="ghost"
        onColorWash
        analyticsId={ONBOARDING.coop.use_free}
        onPress={onUseFree}
        accessibilityLabel="Get access with the free limited tier"
      >
        {invitesComplete ? 'Get access to free tier' : 'Use the free tier for now'}
      </ButtonSecondary>

      {/* Auth code: a free year without paying. Hidden until asked for. */}
      {showRedeem ? (
        <View className="mt-1 gap-2 rounded-card border border-ink-line bg-surface px-3.5 py-3">
          <Text className="font-sans-b text-[13px] text-ink">Enter your auth code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="BRIDGER-FREE-YEAR"
            placeholderTextColor="#8A8778"
            accessibilityLabel="Auth code"
            className="rounded-card border border-ink-line bg-canvas px-3 py-2.5 font-sans-sb text-[15px] text-ink"
          />
          <ButtonPrimary
            full
            size="sm"
            analyticsId={ONBOARDING.coop.redeem_submit}
            onPress={() => void submitCode()}
            loading={redeeming}
            accessibilityLabel="Redeem auth code for a free year"
          >
            Redeem free year
          </ButtonPrimary>
        </View>
      ) : (
        <ButtonSecondary
          full
          tone="ghost"
          onColorWash
          analyticsId={ONBOARDING.coop.redeem_open}
          onPress={() => setShowRedeem(true)}
          accessibilityLabel="I have an auth code"
        >
          Have an auth code?
        </ButtonSecondary>
      )}
    </View>
  );

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="A tool for you, not an ad machine."
      ask="Don't be the product, join the co-op"
      accent="coral"
      onBack={onBack}
      footer={footer}
    >
      <View className="gap-4">
        {/* the hook + the honest price. */}
        <View className="rounded-card bg-carbon px-5 py-5">
          <Text className="font-sans-b text-[15px] leading-snug text-white">
            Members get perks and share the profits. Not a member? There's always a free tier.
          </Text>
          <View className="mt-3 flex-row items-end gap-2">
            <PixelHeading size="lg" className="text-[34px] leading-none text-white">
              $6
            </PixelHeading>
            <Text className="mb-1 font-sans-b text-[14px] text-white/70">a month</Text>
          </View>
          <Text className="mt-1 font-sans-sb text-[12px] text-white/70">No ads. Never sold.</Text>
          {clamped > 0 ? (
            <Text className="mt-3 font-sans-sb text-[13px] text-teal">
              {invitesComplete
                ? 'You already invited 3 friends. Join the co-op or get free-tier access.'
                : `You've already invited ${clamped} of ${INVITE_GOAL} friends.`}
            </Text>
          ) : null}
        </View>

        {/* what you unlock. */}
        <AnalyticsRegion analyticsId={ONBOARDING.coop.perks_grid} interactive={false}>
          <View className="flex-row flex-wrap justify-between">
            {PERKS.map((p) => {
              const token = ACCENTS[p.accent];
              return (
                <View key={p.label} className="mb-2.5 w-[48.5%]">
                  <View className={cn('min-h-[84px] gap-2 rounded-card px-3.5 py-3.5', token.bg)}>
                    <Text className="text-[22px]" accessible={false}>
                      {p.emoji}
                    </Text>
                    <Text className={cn('font-sans-b text-[13px] leading-tight', token.text)}>
                      {p.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </AnalyticsRegion>
      </View>
    </OnboardingStep>
  );
}
