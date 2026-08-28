// ============================================
// WHAT THIS FILE DOES (plain English):
// Quiet membership manage page — renews date and period-end cancel. When the
// person paid through Apple / Google, "Manage in App Store / Play" opens the
// RevenueCat Customer Center (change plan, cancel in the store, restore).
// Bridger's own "Cancel membership" still schedules a quiet period-end cancel.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CoopMembership } from '@bridger/shared';
import { COOP } from '../../../lib/analytics-ids';
import {
  ButtonPrimary,
  ButtonSecondary,
  SectionTitle,
  Screen,
  ScreenBody,
  ScreenHeader
} from '@bridger/ui';
import { PortalPanel } from '../../../components/coop/PortalPanel';
import { cancelMembership, getMembership } from '../../../data/coop';
import { presentCustomerCenter, purchasesAvailable } from '../../../lib/purchases';

export default function CoopManageScreen() {
  const router = useRouter();
  const [m, setM] = useState<CoopMembership | null>(null);

  useEffect(() => {
    void getMembership().then((membership) => {
      if (!membership.member) {
        router.replace('/coop');
        return;
      }
      setM(membership);
    });
  }, [router]);

  function onCancel() {
    Alert.alert(
      'Cancel membership?',
      `You'll keep member perks until ${m?.renews ?? 'the end of your billing period'}. After that, free rolling storage applies (posts older than about a month roll off).`,
      [
        { text: 'Keep membership', style: 'cancel' },
        {
          text: 'Cancel at period end',
          style: 'destructive',
          onPress: () => {
            void cancelMembership()
              .then(setM)
              .catch((e) => Alert.alert('Could not cancel', String(e)));
          }
        }
      ]
    );
  }

  // THIS SECTION DOES: open RevenueCat Customer Center (change plan, cancel in
  // the store, restore, refund request on iOS). Prefer this when they paid via IAP.
  async function onOpenCustomerCenter() {
    const result = await presentCustomerCenter();
    if (!result.ok) {
      Alert.alert('Membership', result.message);
      return;
    }
    // Refresh Bridger membership after they may have cancelled in the store.
    try {
      setM(await getMembership());
    } catch {
      // ignore: screen already has last-known state
    }
  }

  if (!m) {
    return (
      <Screen tone="canvas">
        <ScreenHeader title="Membership" onBack={() => router.back()} hideProfile />
        <ScreenBody>
          <Text className="font-sans-sb text-ink-mute">Loading…</Text>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Membership"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="coop"
        titleAnalyticsId={COOP.manage.page_title}
      />
      <ScreenBody>
        <SectionTitle
          title="Your membership"
          description="See when your membership renews. Canceling is period-end only: you keep member perks until the paid-through date, then free rolling storage applies."
          infoAnalyticsId={COOP.manage.info}
          parentScreen="coop"
          section="manage"
          className="mb-3"
        />
        <PortalPanel
          accent={m.cancelAtPeriodEnd ? 'amber' : 'teal'}
          fill="solid"
          shape="banner"
          className="mb-5"
        >
          <Text className="font-sans-sb text-[14px] text-onaccent">
            {m.dues}
            {m.since ? ` · since ${m.since}` : ''}
          </Text>
          <Text className="mt-1 font-sans-sb text-[14px] text-onaccent/90">
            {m.cancelAtPeriodEnd
              ? `Cancels ${m.renews ?? 'at period end'} — perks stay until then.`
              : `Renews ${m.renews ?? '—'}`}
          </Text>
        </PortalPanel>

        {purchasesAvailable() ? (
          <View className="mb-3">
            <ButtonPrimary
              full
              analyticsId={COOP.manage.customer_center}
              onPress={() => void onOpenCustomerCenter()}
              accessibilityLabel="Open store membership settings"
            >
              Manage in App Store / Play
            </ButtonPrimary>
          </View>
        ) : null}

        {!m.cancelAtPeriodEnd ? (
          <ButtonSecondary
            full
            tone="destructive"
            analyticsId={COOP.manage.cancel}
            onPress={onCancel}
            accessibilityLabel="Cancel membership at period end"
          >
            Cancel membership
          </ButtonSecondary>
        ) : (
          <PortalPanel accent="amber" fill="surface" shape="soft">
            <Text className="font-sans-sb text-[13px] text-ink-mute">
              Cancellation is scheduled. Re-join anytime before then if you change
              your mind.
            </Text>
          </PortalPanel>
        )}
      </ScreenBody>
    </Screen>
  );
}
