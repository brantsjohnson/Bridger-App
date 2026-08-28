// ============================================
// WHAT THIS FILE DOES (plain English):
// The join sheet for co-op membership. It is our own paywall (not RevenueCat's
// built-in screen). Two quick steps:
//   1) Pick how to pay. What shows depends on the device, so we stay inside
//      Apple's and Google's rules:
//        - iPhone/iPad: the App Store only (Apple requires In-App Purchase for
//          a digital membership; we must NOT show an outside card option here).
//        - Android: Google Play, plus Card.
//        - Web: Card only.
//   2) Pick monthly ($6/mo) or yearly ($60/yr, 2 months free).
// Then we hand back the chosen method + plan; the caller runs the real purchase
// (App Store / Play via RevenueCat, or Stripe Checkout for card).
//
// PAYMENT / COMPLIANCE: these are In-App Purchase methods, not the "Apple Pay" /
// "Google Pay" marks (those logos are only for physical goods). So the buttons
// say "the App Store" / "Google Play", never show the Pay logos.
//
// ACCESSIBILITY: every button is >=44pt tall, has a role + label, and the
// chosen state never relies on color alone (the yearly deal is labeled in text).
// ============================================
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Sheet, withAnalyticsPress } from '@bridger/ui';

/** How the person pays. 'soft' is demo only and never shown here. */
export type JoinMethod = 'apple' | 'google' | 'card';
/** Which billing period they picked. */
export type JoinPlan = 'monthly' | 'yearly';

/** Analytics element ids the caller passes so onboarding vs the co-op page
 *  read as different screens while reusing this one component. */
export type JoinSheetIds = {
  apple: string;
  google: string;
  card: string;
  planMonthly: string;
  planYearly: string;
};

export function JoinCoopSheet({
  open,
  onClose,
  onChoose,
  ids,
  busy = false,
  surface = 'coop_join_sheet',
  parentScreen = 'coop',
  monthlyLabel = '$6 / month',
  yearlyLabel = '$60 / year'
}: {
  open: boolean;
  onClose: () => void;
  /** Called once they pick a method AND a plan. Caller runs the purchase. */
  onChoose: (method: JoinMethod, plan: JoinPlan) => void | Promise<void>;
  ids: JoinSheetIds;
  /** True while a purchase / checkout is starting, so we disable the buttons. */
  busy?: boolean;
  surface?: string;
  parentScreen?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
}) {
  // THIS SECTION DOES: remember which method they tapped so step 2 (plan) knows
  // what to buy. Null means we are still on step 1 (choose method).
  const [method, setMethod] = useState<JoinMethod | null>(null);

  // Reset back to step 1 whenever the sheet closes, so it never reopens on plan.
  useEffect(() => {
    if (!open) setMethod(null);
  }, [open]);

  // THIS SECTION DOES: decide which pay methods this device is allowed to show.
  const methods: JoinMethod[] =
    Platform.OS === 'ios'
      ? ['apple']
      : Platform.OS === 'android'
        ? ['google', 'card']
        : ['card'];

  const methodLabel: Record<JoinMethod, string> = {
    apple: 'Continue with the App Store',
    google: 'Continue with Google Play',
    card: 'Pay with a card'
  };
  const methodId: Record<JoinMethod, string> = {
    apple: ids.apple,
    google: ids.google,
    card: ids.card
  };

  // Step 1: choose a payment method.
  const methodStep = (
    <View className="gap-3 pb-1">
      <Text className="font-sans-sb text-[13.5px] leading-5 text-ink-mute">
        Members get perks and share the profits. Pick how you would like to pay.
      </Text>
      {methods.map((m, i) => {
        const primary = i === 0;
        return (
          <Pressable
            key={m}
            onPress={withAnalyticsPress(methodId[m], () => setMethod(m))}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={methodLabel[m]}
            accessibilityState={{ disabled: busy }}
            style={{ minHeight: 52 }}
            className={
              primary
                ? 'items-center justify-center rounded-card bg-ink px-4 py-3 active:opacity-90'
                : 'items-center justify-center rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90'
            }
          >
            <Text
              className={
                primary
                  ? 'font-sans-b text-[15px] text-canvas'
                  : 'font-sans-b text-[15px] text-ink'
              }
            >
              {methodLabel[m]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // Step 2: choose monthly or yearly, then hand back to the caller.
  const planStep = (
    <View className="gap-3 pb-1">
      <Pressable
        onPress={() => setMethod(null)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Back to payment method"
        className="self-start py-1"
      >
        <Text className="font-sans-b text-[13px] text-ink-mute">‹ Back</Text>
      </Pressable>
      <Text className="font-sans-sb text-[13.5px] leading-5 text-ink-mute">
        Choose your plan. You can change or cancel anytime.
      </Text>

      {/* MONTHLY */}
      <Pressable
        onPress={withAnalyticsPress(ids.planMonthly, () => {
          if (method) void onChoose(method, 'monthly');
        })}
        disabled={busy || !method}
        accessibilityRole="button"
        accessibilityLabel={`Monthly plan, ${monthlyLabel}`}
        accessibilityState={{ disabled: busy }}
        style={{ minHeight: 60 }}
        className="flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
      >
        <View>
          <Text className="font-sans-b text-[16px] text-ink">Monthly</Text>
          <Text className="font-sans-sb text-[12px] text-ink-mute">Billed every month</Text>
        </View>
        <Text className="font-sans-b text-[16px] text-ink">{monthlyLabel}</Text>
      </Pressable>

      {/* YEARLY (best value: 2 months free) */}
      <Pressable
        onPress={withAnalyticsPress(ids.planYearly, () => {
          if (method) void onChoose(method, 'yearly');
        })}
        disabled={busy || !method}
        accessibilityRole="button"
        accessibilityLabel={`Yearly plan, ${yearlyLabel}, two months free`}
        accessibilityState={{ disabled: busy }}
        style={{ minHeight: 60 }}
        className="flex-row items-center justify-between rounded-card border-2 border-ink bg-surface px-4 py-3 active:opacity-90"
      >
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-b text-[16px] text-ink">Yearly</Text>
            <View className="rounded-full bg-ink px-2 py-0.5">
              <Text className="font-sans-b text-[10px] text-canvas">2 MONTHS FREE</Text>
            </View>
          </View>
          <Text className="font-sans-sb text-[12px] text-ink-mute">Billed once a year</Text>
        </View>
        <Text className="font-sans-b text-[16px] text-ink">{yearlyLabel}</Text>
      </Pressable>

      {busy ? (
        <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
          Starting your membership…
        </Text>
      ) : null}
    </View>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Join the co-op"
      surface={surface}
      parentScreen={parentScreen}
    >
      {method ? planStep : methodStep}
    </Sheet>
  );
}
