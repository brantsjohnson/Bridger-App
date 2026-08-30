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
import Constants, { ExecutionEnvironment } from 'expo-constants';
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

// #region agent log
/** Debug ingest: localhost for sim/web, LAN for a physical phone on same Wi‑Fi. */
function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
): void {
  const body = JSON.stringify({
    sessionId: '1e6bf9',
    runId: 'pre-fix',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  });
  const headers = {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': '1e6bf9'
  };
  for (const host of ['127.0.0.1', '192.168.20.206']) {
    fetch(`http://${host}:7342/ingest/5893d51f-0bb0-4f73-ad67-eda076bc0ba4`, {
      method: 'POST',
      headers,
      body
    }).catch(() => {});
  }
}
// #endregion

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
/** Last Bridger user id we logged into RevenueCat as (for lazy re-configure). */
let lastAppUserId: string | null = null;

/** True when this binary is Expo Go (no custom native IAP modules). */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** Read a string from Expo extra (baked at EAS build time via app.config.js). */
function extraString(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const v = extra?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Raw public SDK key from env (Metro-inlined) or Expo extra (EAS config time).
 * Prefer the platform App Store / Play key when set.
 */
function rawPublicApiKey(): string | null {
  if (Platform.OS === 'ios') {
    const ios =
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ||
      extraString('revenueCatIosKey');
    if (ios) return ios;
  }
  if (Platform.OS === 'android') {
    const android =
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() ||
      extraString('revenueCatAndroidKey');
    if (android) return android;
  }
  const shared =
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() ||
    extraString('revenueCatApiKey');
  return shared || null;
}

/**
 * Keys we are allowed to hand to Purchases.configure.
 * PAYMENT: RevenueCat Test Store keys (`test_…`) force-quit release /
 * TestFlight / store-signed binaries with a "Wrong API Key" alert and close
 * the app. Never hand a test_ key to the SDK until a real `appl_` / `goog_`
 * key is ready (soft join stays available).
 */
function publicApiKey(): string | null {
  const key = rawPublicApiKey();
  if (!key) {
    // #region agent log
    agentLog('A', 'purchases.ts:publicApiKey', 'no revenuecat key present', {
      platform: Platform.OS,
      dev: typeof __DEV__ !== 'undefined' && __DEV__
    });
    // #endregion
    return null;
  }
  const prefix = key.slice(0, 5);
  if (key.startsWith('appl_') || key.startsWith('goog_')) {
    // #region agent log
    agentLog('A', 'purchases.ts:publicApiKey', 'allowing store key prefix', {
      prefix,
      platform: Platform.OS
    });
    // #endregion
    return key;
  }
  if (key.startsWith('test_')) {
    // #region agent log
    agentLog('A', 'purchases.ts:publicApiKey', 'blocking test_ key so SDK cannot force-quit', {
      prefix,
      platform: Platform.OS,
      dev: typeof __DEV__ !== 'undefined' && __DEV__
    });
    // #endregion
    console.warn(
      'RevenueCat: ignoring test_ key so the app does not force-quit. Soft join stays available until an appl_/goog_ key ships.'
    );
    return null;
  }
  // Unknown prefix: do not configure (safer than a native quit).
  // #region agent log
  agentLog('D', 'purchases.ts:publicApiKey', 'blocking unrecognized key prefix', {
    prefix,
    platform: Platform.OS
  });
  // #endregion
  console.warn('RevenueCat: unrecognized public SDK key prefix; purchases disabled.');
  return null;
}

/** Why purchases cannot run right now (plain English for alerts). */
export function purchasesUnavailableMessage(): string {
  if (isDemoMode()) {
    return 'Demo mode uses a free soft join. Leave demo to buy a real membership.';
  }
  if (Platform.OS === 'web') {
    return 'Join on the iOS or Android app to pay with the App Store or Google Play.';
  }
  if (isExpoGo()) {
    return 'In-app purchases need a development or TestFlight build (not Expo Go).';
  }
  if (!publicApiKey()) {
    return 'Membership purchases are not configured in this build yet. Ask the Bridger team to add the RevenueCat App Store key and ship a new build.';
  }
  if (!configured) {
    return 'Membership is still starting up. Wait a second and try again.';
  }
  return 'Membership purchases are not available right now. Try again in a moment.';
}

/** True when this build can talk to the store (native + usable key present). */
export function purchasesAvailable(): boolean {
  if (isDemoMode()) return false;
  if (isExpoGo()) return false;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  return Boolean(publicApiKey());
}

/**
 * Configure RevenueCat once per app launch, then log in as this Bridger user.
 * Call again when the signed-in user changes (login / logout). Safe to call
 * right before a purchase if configure had not finished yet.
 *
 * PAYMENT: never call Purchases.configure with a test_ key in TestFlight /
 * App Store binaries. That path shows "Wrong API Key" and kills the process.
 */
export async function configurePurchases(appUserId: string | null): Promise<void> {
  lastAppUserId = appUserId;
  // #region agent log
  agentLog('B', 'purchases.ts:configurePurchases:entry', 'configurePurchases called', {
    hasUserId: Boolean(appUserId),
    demo: isDemoMode(),
    expoGo: isExpoGo(),
    platform: Platform.OS,
    alreadyConfigured: configured
  });
  // #endregion
  if (isDemoMode()) return;
  if (isExpoGo()) return;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const apiKey = publicApiKey();
  if (!apiKey) {
    // #region agent log
    agentLog('A', 'purchases.ts:configurePurchases:skip', 'skip Purchases.configure (no usable key)', {
      platform: Platform.OS
    });
    // #endregion
    // Quiet on purpose: preview builds often ship without store keys yet.
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    if (!configured) {
      // #region agent log
      agentLog('C', 'purchases.ts:configurePurchases:configure', 'about to call Purchases.configure', {
        keyPrefix: apiKey.slice(0, 5),
        platform: Platform.OS
      });
      // #endregion
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

/** Make sure RevenueCat is configured before a buy / restore (handles slow boot). */
async function ensureConfigured(): Promise<boolean> {
  if (configured) return true;
  if (!purchasesAvailable()) return false;
  await configurePurchases(lastAppUserId);
  return configured;
}

/** Fresh CustomerInfo from RevenueCat (who they are + what they own). */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
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
  if (!(await ensureConfigured())) return null;
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
    // RevenueCat default package ids when the dashboard uses $rc_monthly.
    byId('$rc_monthly') ??
    null;
  const yearly =
    byId(COOP_PACKAGE_IDS.yearly) ??
    offering.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    byId('$rc_annual') ??
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
  if (!(await ensureConfigured())) {
    return {
      status: 'unavailable',
      message: purchasesUnavailableMessage()
    };
  }
  const { monthly, yearly } = await getCoopPackages();
  // Prefer the chosen plan; fall back to the other so a missing package never
  // dead-ends the person mid-join.
  const pkg = plan === 'yearly' ? yearly ?? monthly : monthly ?? yearly;
  if (!pkg) {
    return {
      status: 'unavailable',
      message:
        'Membership options are not ready in the store yet. Try again after the next app update, or ask the Bridger team.'
    };
  }
  return purchaseCoopPackage(pkg);
}

/** Purchase one package directly (when not using the RevenueCat Paywall UI). */
export async function purchaseCoopPackage(
  pkg: PurchasesPackage
): Promise<PaywallOutcome> {
  if (!(await ensureConfigured())) {
    return {
      status: 'unavailable',
      message: purchasesUnavailableMessage()
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
  if (!(await ensureConfigured())) {
    return {
      status: 'unavailable',
      message: purchasesUnavailableMessage()
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
  if (!(await ensureConfigured())) {
    return {
      status: 'unavailable',
      message: purchasesUnavailableMessage()
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
  if (!(await ensureConfigured())) {
    return {
      ok: false,
      message: purchasesUnavailableMessage()
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
