// ============================================
// WHAT THIS FILE DOES (plain English):
// Bridger's wrapper around RevenueCat. It configures the SDK, checks whether
// someone has the co-op entitlement, opens the paywall (monthly + yearly),
// restores purchases, and opens the Customer Center so members can cancel or
// change plans. Demo / web stay out of the real store path.
//
// PAYMENT: Apple / Google subscriptions go through RevenueCat → StoreKit /
// Play Billing. Card (Stripe) is a separate path. Never put a RevenueCat
// *secret* key in the app; only the public SDK key belongs here.
// ============================================
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  PURCHASES_ERROR_CODE
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { isDemoMode } from './demo';

/** The entitlement id configured in RevenueCat for co-op membership. */
export const COOP_ENTITLEMENT_ID = 'social_bridger_app_pro';

/** Package identifiers expected in the current offering. */
export const COOP_PACKAGE_IDS = {
  monthly: 'monthly',
  yearly: 'yearly'
} as const;

export type CoopPackageId = (typeof COOP_PACKAGE_IDS)[keyof typeof COOP_PACKAGE_IDS];

export type PaywallOutcome =
  | { status: 'purchased'; customerInfo: CustomerInfo; method: 'apple' | 'google' }
  | { status: 'restored'; customerInfo: CustomerInfo; method: 'apple' | 'google' }
  | { status: 'cancelled' }
  | { status: 'not_presented' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

let configured = false;

/** Public SDK key from env (Test Store key works for local / preview testing). */
function publicApiKey(): string | null {
  const shared = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();
  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ||
      shared ||
      null
    );
  }
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() ||
      shared ||
      null
    );
  }
  // Web: native IAP is not available; Stripe / RC Billing would be separate.
  return shared || null;
}

/** True when this build can talk to the store (native + key present). */
export function purchasesAvailable(): boolean {
  if (isDemoMode()) return false;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  return Boolean(publicApiKey());
}

/**
 * Configure RevenueCat once per app launch, then log in as this Bridger user.
 * Call again when the signed-in user changes (login / logout).
 */
export async function configurePurchases(appUserId: string | null): Promise<void> {
  if (isDemoMode()) return;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const apiKey = publicApiKey();
  if (!apiKey) {
    console.warn(
      'RevenueCat: missing EXPO_PUBLIC_REVENUECAT_API_KEY (or platform key). Purchases disabled.'
    );
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    if (!configured) {
      // SECURITY: public SDK key only. Never a secret key in the client.
      Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined
      });
      configured = true;
    } else if (appUserId) {
      // Same device, different account: attach purchases to this Bridger user id.
      await Purchases.logIn(appUserId);
    } else {
      // Signed out: return to an anonymous RC id so the next login is clean.
      const info = await Purchases.getCustomerInfo();
      if (info.originalAppUserId && !info.originalAppUserId.startsWith('$RCAnonymousID:')) {
        await Purchases.logOut();
      }
    }
  } catch (err) {
    console.warn('RevenueCat configure / login failed.', err);
  }
}

/** Fresh CustomerInfo from RevenueCat (who they are + what they own). */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesAvailable() || !configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('RevenueCat getCustomerInfo failed.', err);
    return null;
  }
}

/** True when the co-op entitlement is active right now. */
export function hasCoopEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[COOP_ENTITLEMENT_ID]);
}

/** Ask RevenueCat whether this person currently has co-op. */
export async function checkCoopEntitlement(): Promise<boolean> {
  const info = await getCustomerInfo();
  return hasCoopEntitlement(info);
}

/** Current offering (holds monthly + yearly packages when configured). */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!purchasesAvailable() || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.warn('RevenueCat getOfferings failed.', err);
    return null;
  }
}

/** Find monthly / yearly packages on the current offering (by id or type). */
export async function getCoopPackages(): Promise<{
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
  offering: PurchasesOffering | null;
}> {
  const offering = await getCurrentOffering();
  if (!offering) return { monthly: null, yearly: null, offering: null };

  const byId = (id: string) =>
    offering.availablePackages.find((p) => p.identifier === id) ?? null;

  const monthly =
    byId(COOP_PACKAGE_IDS.monthly) ??
    offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ??
    null;
  const yearly =
    byId(COOP_PACKAGE_IDS.yearly) ??
    offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    null;

  return { monthly, yearly, offering };
}

/**
 * Buy the monthly or yearly co-op plan directly, without RevenueCat's own
 * paywall screen. We ask the current offering for that plan's package, then
 * run the native App Store / Play purchase. This is what powers our custom
 * paywall: our UI picks the plan, RevenueCat + the store handle the money.
 */
export async function purchaseCoopPlan(
  plan: 'monthly' | 'yearly'
): Promise<PaywallOutcome> {
  if (!purchasesAvailable() || !configured) {
    return {
      status: 'unavailable',
      message:
        Platform.OS === 'web'
          ? 'Join on the iOS or Android app to pay with the App Store or Google Play.'
          : 'In-app purchases need a development / TestFlight build (not Expo Go).'
    };
  }
  const { monthly, yearly } = await getCoopPackages();
  // Prefer the chosen plan; fall back to the other so a missing package never
  // dead-ends the person mid-join.
  const pkg = plan === 'yearly' ? yearly ?? monthly : monthly ?? yearly;
  if (!pkg) {
    return {
      status: 'unavailable',
      message: 'Membership options are not ready yet. Try again in a moment.'
    };
  }
  return purchaseCoopPackage(pkg);
}

/** Purchase one package directly (when not using the RevenueCat Paywall UI). */
export async function purchaseCoopPackage(
  pkg: PurchasesPackage
): Promise<PaywallOutcome> {
  if (!purchasesAvailable() || !configured) {
    return {
      status: 'unavailable',
      message: 'In-app purchases need a native build with RevenueCat configured.'
    };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (!hasCoopEntitlement(customerInfo)) {
      return {
        status: 'error',
        message: 'Purchase finished, but co-op access is not active yet. Try Restore.'
      };
    }
    return {
      status: 'purchased',
      customerInfo,
      method: Platform.OS === 'ios' ? 'apple' : 'google'
    };
  } catch (err) {
    return mapPurchaseError(err);
  }
}

/**
 * Present the RevenueCat Paywall (monthly + yearly from the current offering).
 * Uses presentPaywallIfNeeded so people who already have the entitlement skip it.
 */
export async function presentCoopPaywall(): Promise<PaywallOutcome> {
  if (!purchasesAvailable() || !configured) {
    return {
      status: 'unavailable',
      message:
        Platform.OS === 'web'
          ? 'Join on the iOS or Android app to pay with Apple Pay or Google Play.'
          : 'In-app purchases need a development / TestFlight build (not Expo Go).'
    };
  }

  try {
    // If they already own co-op, the paywall does not open.
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: COOP_ENTITLEMENT_ID,
      displayCloseButton: true
    });

    const method = Platform.OS === 'ios' ? 'apple' : 'google';

    switch (result) {
      case PAYWALL_RESULT.PURCHASED: {
        const customerInfo = await Purchases.getCustomerInfo();
        return { status: 'purchased', customerInfo, method };
      }
      case PAYWALL_RESULT.RESTORED: {
        const customerInfo = await Purchases.getCustomerInfo();
        return { status: 'restored', customerInfo, method };
      }
      case PAYWALL_RESULT.CANCELLED:
        return { status: 'cancelled' };
      case PAYWALL_RESULT.NOT_PRESENTED: {
        // Already entitled: treat as a successful restore / existing member.
        const customerInfo = await Purchases.getCustomerInfo();
        if (hasCoopEntitlement(customerInfo)) {
          return { status: 'restored', customerInfo, method };
        }
        return { status: 'not_presented' };
      }
      case PAYWALL_RESULT.ERROR:
      default:
        return {
          status: 'error',
          message: 'Something went wrong opening the membership paywall. Try again.'
        };
    }
  } catch (err) {
    return mapPurchaseError(err);
  }
}

/** Restore previous App Store / Play purchases onto this Bridger account. */
export async function restorePurchases(): Promise<PaywallOutcome> {
  if (!purchasesAvailable() || !configured) {
    return {
      status: 'unavailable',
      message: 'Restore only works in a native iOS or Android build.'
    };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    const method = Platform.OS === 'ios' ? 'apple' : 'google';
    if (hasCoopEntitlement(customerInfo)) {
      return { status: 'restored', customerInfo, method };
    }
    return {
      status: 'error',
      message: 'No active co-op membership found for this store account.'
    };
  } catch (err) {
    return mapPurchaseError(err);
  }
}

/**
 * Open RevenueCat Customer Center (cancel, change plan, restore, refunds on
 * iOS). Best place: Membership manage when they paid via the store.
 */
export async function presentCustomerCenter(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (!purchasesAvailable() || !configured) {
    return {
      ok: false,
      message: 'Membership management needs the iOS or Android app.'
    };
  }
  try {
    await RevenueCatUI.presentCustomerCenter();
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not open membership settings.';
    return { ok: false, message };
  }
}

/** Turn RevenueCat / store errors into a plain outcome (never crash the run). */
function mapPurchaseError(err: unknown): PaywallOutcome {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? (err as { code?: string }).code
      : undefined;
  if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return { status: 'cancelled' };
  }
  const message =
    err instanceof Error
      ? err.message
      : 'Could not complete the purchase. Try again in a moment.';
  return { status: 'error', message };
}
