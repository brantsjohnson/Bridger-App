// ============================================
// WHAT THIS FILE DOES (plain English):
// "Don't be the product, join the co-op." The LAST onboarding step (Old and
// New). New uses a simpler layout because they already heard the co-op story.
// Ways in:
//   Option A, invite 3 friends and get free access (progress shows if they
//             already invited some during contacts). Each tap opens contacts
//             (to text) or the system share sheet with a real Bridger invite
//             link. The 3rd successful invite finishes onboarding → Home.
//   Option B, join directly, a paid membership ($6/mo). Paying finishes too.
//   Auth code for a free year (quiet link: hold Join the co-op for 10 seconds
//   so join and invite stay the first things people see). Redeem finishes too.
// Free access is only via inviting 3 friends (no separate "use free tier"
// skip). There is no "You're in" screen after this; Home plays the welcome
// fireworks instead.
//
// LOOK: blue price panel (full-bleed under the title with a hard straight top
// edge; "$6 / mo" on the left of the hook copy so the text can use the width),
// then a Free vs Co-op table (Yes → green check, No → X). "See more" opens the
// full list. Then join / "or" / invite / auth actions. The body scrolls, with a
// fade and the system scroll bar so the list does not look done.
//
// PAYMENT: "Join the co-op" opens our own join sheet (JoinCoopSheet), where the
// person picks a pay method (App Store / Google Play / Card, by device) and then
// monthly or yearly. Apple / Google run through RevenueCat + In-App Purchase
// (entitlement social_bridger_app_pro); Card runs through Stripe Checkout on the
// web. Soft-join remains for demo. See COOP.md / PRIVACY.md.
// ============================================
import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { COOP_PLAN_COMPARISON, ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import {
  ContactInviteSheet,
  type ContactPick
} from '../invite/ContactInviteSheet';
import { JoinCoopSheet } from '../coop/JoinCoopSheet';
import {
  loadInviteContacts,
  sendInviteToContact,
  shareInviteForAccess
} from '../../lib/invite-from-contacts';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBCTA, OBField, OBHardShadow, OBSkipLink } from './onboarding-ui';

const INVITE_GOAL = 3;
/** Hold Join this long to reveal "Have an auth code?" (Easter egg, not a timer). */
const AUTH_CODE_HOLD_MS = 10_000;

/** Matches OnboardingStep PAGE_X so the blue price panel can bleed edge-to-edge. */
const COOP_PAGE_X = 24;

/**
 * Size the big "$6" so it fits beside the hook text and never clips its top.
 * Narrow phones get a smaller number; roomy phones stop growing past 48.
 */
function priceTypeForWidth(width: number): { fontSize: number; lineHeight: number } {
  const fontSize = Math.round(Math.min(48, Math.max(34, width * 0.1)));
  return { fontSize, lineHeight: Math.round(fontSize * 1.12) };
}

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
  // Link sits on the page canvas, so ink follows light/dark.
  const theme = useThemeColors();
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
        style={{ color: theme.ink, textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Pale-blue wash behind the Co-op column so it reads as the highlighted plan. */
const COOP_COL_TINT = OB.periwinkle;

/**
 * One Free / Co-op cell value. Plain Yes → green check, plain No → X, so the
 * table reads at a glance. Other values (1 vote, 30 days, …) stay as words.
 * ACCESSIBILITY: the spoken label is still Yes / No, not only the glyph.
 */
function CompareValue({
  value,
  emphasize
}: {
  value: string;
  /** Co-op column: stronger ink when it is not a check / X. */
  emphasize?: boolean;
}) {
  if (value === 'Yes') {
    return (
      <Text
        accessible
        accessibilityLabel="Yes"
        className="font-sans-b text-[18px]"
        style={{ color: OB.green, textAlign: 'center' }}
      >
        ✓
      </Text>
    );
  }
  if (value === 'No') {
    return (
      <Text
        accessible
        accessibilityLabel="No"
        className="font-sans-b text-[16px]"
        style={{ color: OB.inkFaint, textAlign: 'center' }}
      >
        ✕
      </Text>
    );
  }
  return (
    <Text
      className={emphasize ? 'font-sans-b text-[13px]' : 'font-sans-sb text-[13px]'}
      style={{
        color: emphasize ? OB.blue : OB.inkFaint,
        textAlign: 'center'
      }}
    >
      {value}
    </Text>
  );
}

/**
 * One row of the Free vs Co-op table: the feature name on the left, then the
 * free value and the co-op value in two cells. The co-op cell is tinted so the
 * better plan stands out.
 */
function CompareRow({
  label,
  free,
  member,
  last
}: {
  label: string;
  free: string;
  member: string;
  /** true on the final visible row, so we skip its bottom divider */
  last: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: OB.borderMuted
      }}
    >
      {/* Feature name. */}
      <View style={{ flex: 1.5, paddingVertical: 10, paddingHorizontal: 12, justifyContent: 'center' }}>
        <Text className="font-sans-b text-[14px]" style={{ color: OB.ink }}>
          {label}
        </Text>
      </View>
      {/* What free gets. */}
      <View
        style={{
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CompareValue value={free} />
      </View>
      {/* What a co-op member gets (highlighted column). */}
      <View
        style={{
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COOP_COL_TINT
        }}
      >
        <CompareValue value={member} emphasize />
      </View>
    </View>
  );
}

/**
 * The Free vs Co-op comparison. Shows the headline rows first; "See more"
 * reveals the full list so the person can see exactly what each plan gets.
 * The table itself is a read-only region (dead-click); only "See more" is
 * tappable.
 */
function PlanCompare({
  showAll,
  onToggle
}: {
  showAll: boolean;
  onToggle: () => void;
}) {
  const rows = showAll ? COOP_PLAN_COMPARISON : COOP_PLAN_COMPARISON.filter((r) => r.top);
  const hiddenCount = COOP_PLAN_COMPARISON.length - COOP_PLAN_COMPARISON.filter((r) => r.top).length;

  return (
    <View style={{ gap: 10 }}>
      <Text
        className="font-sans-b text-[12px]"
        style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: OB.blue }}
      >
        Free vs Co-op
      </Text>

      {/* THE TABLE: read-only, so a tap logs a dead-click, not a fake action. */}
      <AnalyticsRegion analyticsId={ONBOARDING.coop.plan_compare} interactive={false}>
        <View style={{ borderWidth: OB_BORDER, borderColor: OB.navy, backgroundColor: OB.paper }}>
          {/* Header: which column is which. Paper fill keeps Free-column ink
              readable when the page canvas is dark. */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: OB_BORDER,
              borderBottomColor: OB.navy
            }}
          >
            <View style={{ flex: 1.5, paddingVertical: 9, paddingHorizontal: 12 }} />
            <View style={{ flex: 1, paddingVertical: 9, alignItems: 'center' }}>
              <Text className="font-sans-b text-[12px]" style={{ color: OB.navy }}>
                Free
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: COOP_COL_TINT
              }}
            >
              <Text className="font-sans-b text-[12px]" style={{ color: OB.blue }}>
                Co-op
              </Text>
            </View>
          </View>

          {rows.map((r, i) => (
            <CompareRow
              key={r.key}
              label={r.label}
              free={r.free}
              member={r.member}
              last={i === rows.length - 1}
            />
          ))}
        </View>
      </AnalyticsRegion>

      {/* SEE MORE: the only tappable thing here; opens / closes the full list. */}
      <Pressable
        onPress={withAnalyticsPress(ONBOARDING.coop.see_more, onToggle, {
          analyticsProps: { expanded: !showAll }
        })}
        accessibilityRole="button"
        accessibilityState={{ expanded: showAll }}
        accessibilityLabel={showAll ? 'See fewer differences' : 'See everything you get'}
        hitSlop={8}
        style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}
      >
        <Text
          className="font-sans-b text-[14px]"
          style={{ color: OB.blue, textDecorationLine: 'underline' }}
        >
          {showAll ? 'See less' : `See more (${hiddenCount})`}
        </Text>
      </Pressable>
    </View>
  );
}

export function CoopStep({
  step,
  total,
  invitesSent = 0,
  onInviteRecorded,
  onJoin,
  onInvitesComplete,
  onRedeem,
  onBack,
  inviteMode = 'required',
  onContinueFree,
  layout = 'full'
}: {
  step: number;
  total: number;
  /** How many of the 3 invite slots were already filled during contacts. */
  invitesSent?: number;
  /**
   * Called after a share / SMS / clipboard invite actually went out, so the
   * parent can mark the next empty slot filled.
   */
  onInviteRecorded: (label: string) => void;
  /** Option B: join with the chosen method + plan (from the join sheet). */
  onJoin: (
    method: 'apple' | 'google' | 'card',
    plan: 'monthly' | 'yearly'
  ) => void | Promise<void>;
  /** After all 3 invite slots are filled: continue with free access. */
  onInvitesComplete: () => void;
  /** Redeem an auth code for a free year. Resolves on success, throws on bad code. */
  onRedeem: (code: string) => Promise<void>;
  onBack: () => void;
  /** required = invite 3 for Free Lite. hidden = pay or skip (unused now). */
  inviteMode?: 'required' | 'hidden';
  /** Unused skip path. Kept so older call sites still type-check. */
  onContinueFree?: () => void;
  /**
   * full = Old join (price + Free vs Co-op table).
   * simple = New last screen. They already learned the co-op, so just join
   * or invite friends.
   */
  layout?: 'full' | 'simple';
}) {
  // Auth-code panel: hidden until asked for. Join opens our own join sheet.
  const [showRedeem, setShowRedeem] = useState(false);
  const [joining, setJoining] = useState(false);
  // Our custom paywall sheet (pick method, then monthly / yearly).
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  // THIS SECTION DOES: keep "Have an auth code?" hidden until Join is held 10s.
  const [authLinkVisible, setAuthLinkVisible] = useState(false);
  // THIS SECTION DOES: whether the Free vs Co-op table shows the full list.
  const [showAllPerks, setShowAllPerks] = useState(false);
  // THIS SECTION DOES: size "$6" for this phone so the top of the glyph is not cut.
  const { width: windowWidth } = useWindowDimensions();
  const priceType = priceTypeForWidth(windowWidth);
  // "or" / invite notes sit on the canvas; follow theme ink in dark mode.
  const theme = useThemeColors();

  // Invite path: contacts picker + busy / status line so a failed share is never silent.
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactPick[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const clamped = Math.max(0, Math.min(INVITE_GOAL, invitesSent));
  const invitesComplete = clamped >= INVITE_GOAL;
  const nextSlot = clamped + 1;

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

  /** After a successful share: tell the parent, and explain clipboard on web. */
  function recordInvite(label: string, method: 'sms' | 'share' | 'clipboard', url?: string) {
    onInviteRecorded(label);
    if (method === 'clipboard' && url) {
      setInviteNote(`Invite link copied. Paste it to a friend (${clamped + 1}/${INVITE_GOAL}).`);
      Alert.alert('Link copied', 'Paste it into a text or email to invite a friend to Bridger.');
    } else {
      setInviteNote(`Invite ${clamped + 1} of ${INVITE_GOAL} sent.`);
    }
  }

  // THIS SECTION DOES: open contacts (phone) or the system share sheet with a
  // real Bridger invite link. Never silently fail.
  const handleInvitePress = () => {
    if (inviteBusy || invitesComplete) return;
    void (async () => {
      setInviteBusy(true);
      setInviteNote(null);
      try {
        // Prefer on-device contacts → text, same as the Contacts step.
        if (Platform.OS !== 'web') {
          const { contacts: list, permission } = await loadInviteContacts('onboarding');
          if (permission === 'granted' && list.length > 0) {
            setContacts(list);
            setSheetOpen(true);
            return;
          }
        }

        const result = await shareInviteForAccess('onboarding', { slot: nextSlot });
        if (result.ok) {
          recordInvite('Shared link', result.method, result.url);
        } else if (!result.cancelled) {
          setInviteNote(result.message);
          Alert.alert('Could not share invite', result.message);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not open the invite right now.';
        setInviteNote(message);
        Alert.alert('Could not share invite', message);
      } finally {
        setInviteBusy(false);
      }
    })();
  };

  // THIS SECTION DOES: text / share to the contact they tapped in the sheet.
  const handlePickContact = (contact: ContactPick) => {
    setSheetOpen(false);
    void (async () => {
      setInviteBusy(true);
      setInviteNote(null);
      try {
        const result = await sendInviteToContact(contact, 'onboarding', {
          slot: nextSlot
        });
        if (result.ok) {
          recordInvite(contact.name, result.method, result.url);
        } else if (!result.cancelled) {
          setInviteNote(result.message);
          Alert.alert('Could not send invite', result.message);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not send that invite right now.';
        setInviteNote(message);
        Alert.alert('Could not send invite', message);
      } finally {
        setInviteBusy(false);
      }
    })();
  };

  // THIS SECTION DOES: open our own join sheet, where they pick a pay method
  // (App Store / Google Play / Card by device) and then monthly or yearly.
  const handleJoinPress = () => {
    if (joining) return;
    setJoinSheetOpen(true);
  };

  // THIS SECTION DOES: run the real purchase after they pick method + plan in
  // the sheet. Keep the sheet open on cancel / error so they can try again.
  const handleChoose = (
    method: 'apple' | 'google' | 'card',
    plan: 'monthly' | 'yearly'
  ) => {
    if (joining) return;
    setJoining(true);
    void Promise.resolve(onJoin(method, plan))
      .then(() => {
        // Only close after a confirmed join; errors / cancels stay on the sheet.
        setJoinSheetOpen(false);
      })
      .catch(() => {
        // Parent already showed an alert (or cancel was quiet). Sheet stays open.
      })
      .finally(() => setJoining(false));
  };

  // THIS SECTION DOES: pick the invite CTA label from how many they already sent.
  const inviteLabel = inviteBusy
    ? 'Opening invite…'
    : clamped === 0
      ? 'Invite 3 friends, get free access'
      : `Invite friends · ${clamped}/${INVITE_GOAL} sent`;

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

      {/* OPTION B: open our join sheet (monthly / yearly). Hold 10s for auth code.
          celebrate={false}: do not open the emoji Modal first. iOS will not show
          the join sheet on top of that Modal, so Join looked like a dead tap. */}
      <OBCTA
        label={joining ? 'Opening membership…' : 'Join the co-op'}
        analyticsId={ONBOARDING.coop.join_paid}
        onPress={handleJoinPress}
        onLongPress={() => setAuthLinkVisible(true)}
        delayLongPress={AUTH_CODE_HOLD_MS}
        celebrate={false}
        disabled={joining}
        accessibilityLabel="Join the co-op. Opens payment options: monthly or yearly."
      />

      {inviteMode === 'hidden' ? null : (
        <Text
          className="font-sans-sb text-[14px]"
          style={{ color: theme.inkMute, textAlign: 'center', letterSpacing: 0.4 }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          or
        </Text>
      )}

      {/* OPTION A: invite path (Old), or a free skip (New). */}
      {inviteMode === 'hidden' ? (
        onContinueFree ? (
          <OBSkipLink
            label="Use Bridger free"
            analyticsId={ONBOARDING.coop.skip_to_product}
            onPress={onContinueFree}
          />
        ) : null
      ) : !invitesComplete ? (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row' }}>
            <CoopBox
              label={inviteLabel}
              analyticsId={ONBOARDING.coop.invite_free}
              analyticsProps={{ invites_sent: clamped }}
              onPress={handleInvitePress}
              disabled={inviteBusy}
              accessibilityLabel={inviteLabel}
            />
          </View>
          {inviteNote ? (
            <Text
              className="font-sans-sb text-[12px]"
              style={{ color: theme.ink, textAlign: 'center', lineHeight: 17 }}
            >
              {inviteNote}
            </Text>
          ) : null}
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

      {/* AUTH LINK: only after a 10s hold on Join, so join / invite come first. */}
      {showRedeem || !authLinkVisible ? null : (
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
    <>
      <OnboardingStep
        step={step}
        total={total}
        purpose={
          layout === 'simple'
            ? 'You already know what the co-op is.'
            : 'A tool for you, not an ad machine.'
        }
        ask={
          layout === 'simple'
            ? 'Join the co-op and don\'t be the product'
            : 'Don\'t be the product, join the co-op'
        }
        smallAsk
        scrollBody
        onBack={onBack}
        footer={footer}
      >
        <View style={{ gap: 14 }}>
          {/* THE HOOK + PRICE: full-bleed blue with a hard straight top edge
              (bleed cancels the page padding so the panel is not inset). Price
              sits on the left so the copy can use the rest of the width. */}
          <View
            style={{
              marginHorizontal: -COOP_PAGE_X,
              marginTop: -8,
              paddingVertical: 16,
              paddingHorizontal: COOP_PAGE_X,
              backgroundColor: OB.blue,
              // Straight seam under the italic title (no diagonal optical edge).
              borderTopWidth: OB_BORDER,
              borderTopColor: OB.navy
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14
              }}
            >
              {/* PRICE: compact stack on the left ($6 / a month). */}
              <View
                accessible
                accessibilityLabel="$6 a month"
                style={{
                  flexShrink: 0,
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  minWidth: 72,
                  paddingTop: 2
                }}
              >
                <Text
                  className="font-display"
                  style={{
                    fontSize: priceType.fontSize,
                    lineHeight: priceType.lineHeight,
                    letterSpacing: -2,
                    color: OB.amber,
                    includeFontPadding: false
                  }}
                >
                  $6
                </Text>
                <Text className="font-sans-b text-[13px]" style={{ color: OB.onColor, marginTop: -2 }}>
                  / mo
                </Text>
              </View>

              {/* HOOK COPY: takes the leftover width next to the price. */}
              <Text
                className="font-sans-sb text-[13.5px]"
                style={{ flex: 1, lineHeight: 20, color: OB.onColor, minWidth: 0 }}
              >
                {layout === 'simple'
                  ? 'Monthly or yearly. Apple Pay, Google Pay, or a card.'
                  : 'Members get perks and share the profits.'}
                {inviteMode === 'hidden'
                  ? ' You can also keep using Bridger for free.'
                  : ` Free access unlocks when you invite ${INVITE_GOAL} friends.`}
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

          {/* THE COMPARISON: Old join still shows Free vs Co-op. New skip it
              because the co-op story already covered the perks. */}
          {layout === 'simple' ? null : (
            <PlanCompare
              showAll={showAllPerks}
              onToggle={() => setShowAllPerks((v) => !v)}
            />
          )}
        </View>
      </OnboardingStep>

      {/* CONTACTS: pick someone to text the Bridger invite link (on-device only). */}
      <ContactInviteSheet
        open={sheetOpen}
        contacts={contacts}
        onPick={handlePickContact}
        onClose={() => setSheetOpen(false)}
        title="Pick a friend to invite"
        surface="onboarding_invite_contacts_sheet"
        parentScreen="onboarding"
        pickAnalyticsId={ONBOARDING.contacts.contact_row}
        cancelAnalyticsId={ONBOARDING.contacts.contacts_cancel}
      />

      {/* JOIN: our own paywall — pick method (App Store / Play / Card), then plan. */}
      <JoinCoopSheet
        open={joinSheetOpen}
        onClose={() => setJoinSheetOpen(false)}
        onChoose={handleChoose}
        busy={joining}
        surface="onboarding_coop_join_sheet"
        parentScreen="onboarding"
        ids={{
          apple: ONBOARDING.coop.apple_pay,
          google: ONBOARDING.coop.google_pay,
          card: ONBOARDING.coop.card,
          planMonthly: ONBOARDING.coop.plan_monthly,
          planYearly: ONBOARDING.coop.plan_yearly
        }}
      />
    </>
  );
}
