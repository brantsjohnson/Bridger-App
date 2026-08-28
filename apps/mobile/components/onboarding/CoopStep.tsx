// ============================================
// WHAT THIS FILE DOES (plain English):
// "Don't be the product, join the co-op." Ways in:
//   Option A, invite 3 friends and get free access (progress shows if they
//             already invited some during contacts).
//   Option B, join directly, a paid membership ($6/mo).
//   Auth code for a free year.
// Free access is only via inviting 3 friends (no separate "use free tier"
// skip). When those invites are done, Continue unlocks free access.
//
// LOOK: blue price panel, member perks as a bullet list (same copy as the
// Co-op page, including "No ads"), then join / invite / auth actions. The body
// scrolls, with a fade and the system scroll bar so the list does not look done.
//
// PAYMENT: membership is sold in-app. Soft-join stub for now (see COOP.md).
// ============================================
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { MEMBER_UNLOCKS, ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBCTA, OBField, OBHardShadow } from './onboarding-ui';

const INVITE_GOAL = 3;

/**
 * A secondary button: a square box with the hard navy outline. "solid" fills it
 * blue for the one step that needs a bit more weight (paying, redeeming).
 */
function CoopBox({
  label,
  onPress,
  analyticsId,
  analyticsProps,
  accessibilityLabel,
  solid = false,
  disabled = false
}: {
  label: string;
  onPress: () => void;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
  accessibilityLabel: string;
  solid?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { analyticsProps })}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={{
        minHeight: 48,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: solid ? OB.blue : OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <Text
        className="font-sans-b text-[15px]"
        style={{ color: solid ? OB.onColor : OB.blue }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A quiet underlined link (auth code opener). */
function CoopLink({
  label,
  onPress,
  analyticsId,
  accessibilityLabel
}: {
  label: string;
  onPress: () => void;
  analyticsId: string;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}
    >
      <Text
        className="font-sans-sb text-[14px]"
        style={{ color: OB.navy, textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CoopStep({
  step,
  total,
  invitesSent = 0,
  onInviteFree,
  onJoin,
  onInvitesComplete,
  onRedeem,
  onBack
}: {
  step: number;
  total: number;
  /** How many of the 3 invite slots were already filled during contacts. */
  invitesSent?: number;
  /** Option A, invite remaining friends for free access. */
  onInviteFree: () => void | Promise<void>;
  /** Option B, join directly (soft IAP stub); method picks the pay button. */
  onJoin: (method: 'apple' | 'google' | 'card') => void;
  /** After all 3 invite slots are filled: continue with free access. */
  onInvitesComplete: () => void;
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
    <View style={{ gap: 10 }}>
      {/* AUTH CODE: a free year without paying. Hidden until asked for. */}
      {showRedeem ? (
        <OBHardShadow color={OB.periwinkle}>
          <View
            style={{
              gap: 12,
              padding: 16,
              backgroundColor: OB.paper,
              borderWidth: OB_BORDER,
              borderColor: OB.navy
            }}
          >
            <OBField
              label="Enter your auth code"
              value={code}
              onChange={setCode}
              autoCapitalize="characters"
              placeholder="BRIDGER-FREE-YEAR"
            />
            <CoopBox
              solid
              label={redeeming ? 'Redeeming…' : 'Redeem free year'}
              analyticsId={ONBOARDING.coop.redeem_submit}
              onPress={() => void submitCode()}
              disabled={redeeming}
              accessibilityLabel="Redeem auth code for a free year"
            />
          </View>
        </OBHardShadow>
      ) : null}

      {/* OPTION B, join directly (paid). Tapping it reveals the pay buttons. */}
      {showPay ? (
        <View style={{ gap: 10 }}>
          <CoopBox
            solid
            label="Apple Pay"
            analyticsId={ONBOARDING.coop.apple_pay}
            onPress={() => onJoin('apple')}
            accessibilityLabel="Join with Apple Pay"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CoopBox
              label="Google Pay"
              analyticsId={ONBOARDING.coop.google_pay}
              onPress={() => onJoin('google')}
              accessibilityLabel="Join with Google Pay"
            />
            <CoopBox
              label="Card"
              analyticsId={ONBOARDING.coop.card}
              onPress={() => onJoin('card')}
              accessibilityLabel="Join with a card"
            />
          </View>
        </View>
      ) : (
        <OBCTA
          label="Join the co-op, $6/mo"
          analyticsId={ONBOARDING.coop.join_paid}
          onPress={() => setShowPay(true)}
          accessibilityLabel="Join the co-op for six dollars a month"
        />
      )}

      {/* OPTION A: invite path, or continue once invites unlock free access. */}
      {!invitesComplete ? (
        <View style={{ flexDirection: 'row' }}>
          <CoopBox
            label={inviteLabel}
            analyticsId={ONBOARDING.coop.invite_free}
            analyticsProps={{ invites_sent: clamped }}
            onPress={() => void onInviteFree()}
            accessibilityLabel={inviteLabel}
          />
        </View>
      ) : (
        <View style={{ flexDirection: 'row' }}>
          <CoopBox
            label="Continue with free access"
            analyticsId={ONBOARDING.coop.use_free}
            onPress={onInvitesComplete}
            accessibilityLabel="Continue with free access from your invites"
          />
        </View>
      )}

      {showRedeem ? null : (
        <CoopLink
          label="Have an auth code?"
          analyticsId={ONBOARDING.coop.redeem_open}
          onPress={() => setShowRedeem(true)}
          accessibilityLabel="I have an auth code"
        />
      )}
    </View>
  );

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="A tool for you, not an ad machine."
      ask="Don't be the product, join the co-op"
      smallAsk
      scrollBody
      onBack={onBack}
      footer={footer}
    >
      <View style={{ gap: 14 }}>
        {/* THE HOOK AND THE HONEST PRICE, on one solid blue panel. */}
        <View style={{ padding: 16, backgroundColor: OB.blue }}>
          <Text className="font-sans-sb text-[13.5px]" style={{ lineHeight: 20, color: OB.onColor }}>
            Members get perks and share the profits. Free access unlocks when you
            invite {INVITE_GOAL} friends.
          </Text>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Text
              className="font-display"
              style={{ fontSize: 56, lineHeight: 50, letterSpacing: -2, color: OB.amber }}
            >
              $6
            </Text>
            <Text className="font-sans-b text-[15px]" style={{ marginBottom: 6, color: OB.onColor }}>
              a month
            </Text>
          </View>
          {clamped > 0 ? (
            <Text className="font-sans-sb text-[13px]" style={{ marginTop: 12, color: OB.onColor }}>
              {invitesComplete
                ? 'You already invited 3 friends. Join the co-op or continue with free access.'
                : `You've already invited ${clamped} of ${INVITE_GOAL} friends.`}
            </Text>
          ) : null}
        </View>

        {/* MEMBER PERKS: same list as the Co-op page (shared MEMBER_UNLOCKS),
            including "No ads" as a normal bullet, not a separate box. */}
        <AnalyticsRegion analyticsId={ONBOARDING.coop.perks_grid} interactive={false}>
          <View style={{ gap: 10 }}>
            <Text
              className="font-sans-b text-[12px]"
              style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: OB.blue }}
            >
              What members get
            </Text>
            {MEMBER_UNLOCKS.map((u) => (
              <View key={u.key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text className="font-sans-b text-[16px]" style={{ lineHeight: 20, color: OB.blue }}>
                  •
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text className="font-sans-b text-[15px]" style={{ color: OB.ink }}>
                    {u.title}
                  </Text>
                  <Text className="font-sans-sb text-[13px]" style={{ lineHeight: 18, color: OB.navy }}>
                    {u.line}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AnalyticsRegion>
      </View>
    </OnboardingStep>
  );
}
