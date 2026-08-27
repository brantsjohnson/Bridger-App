// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the PostHog "mailbox" the rest of the app writes into. Capture
// starts off until the signed-in session opts in. Session replay, autocapture,
// geo-IP, and surveys stay off. Demo mode never sends. PRIVACY: only opaque
// ids + taxonomy fields.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';
import {
  sanitizeAnalyticsProps,
  type AnalyticsBaseProps,
  type AnalyticsSink
} from '@bridger/shared';
import { isDemoMode } from './demo';

const DEFAULT_HOST = 'https://us.i.posthog.com';

/** Public project key from env. Safe to ship in the app (write-only). */
export function posthogProjectKey(): string {
  return (process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '').trim();
}

/** Ingest host. US cloud by default; override for EU or self-host. */
export function posthogIngestHost(): string {
  const host = (process.env.EXPO_PUBLIC_POSTHOG_HOST ?? DEFAULT_HOST).trim();
  return host.replace(/\/$/, '') || DEFAULT_HOST;
}

/**
 * One PostHog client for the app. Created at load if a project key is set.
 * Stays null when EXPO_PUBLIC_POSTHOG_KEY is missing. Capture waits for the
 * signed-in session opt-in (always on for real accounts).
 */
export const posthogClient: PostHog | null = (() => {
  const apiKey = posthogProjectKey();
  if (!apiKey) return null;
  return new PostHog(apiKey, {
    host: posthogIngestHost(),
    defaultOptIn: false,
    disableGeoip: true,
    enableSessionReplay: false,
    captureAppLifecycleEvents: false,
    preloadFeatureFlags: false,
    sendFeatureFlagEvent: false,
    disableSurveys: true,
    personProfiles: 'identified_only',
    capturePushNotificationSubscriptions: false,
    capturePushNotificationOpened: false,
    customStorage: AsyncStorage,
    // Drop device name (too identifying). Keep coarse OS / app version.
    customAppProperties: (props) => ({
      ...props,
      $device_name: null
    })
  });
})();

/**
 * Create a PostHog sink backed by the shared client, or null when there is
 * no project key. The SDK stays opted out until optInAnalytics runs.
 */
export function createPosthogSink(): AnalyticsSink | null {
  if (!posthogClient) return null;

  const client = posthogClient;
  const skip = () => isDemoMode();

  return {
    capture(event: string, properties: AnalyticsBaseProps) {
      if (skip()) return;
      client.capture(event, {
        ...sanitizeAnalyticsProps(properties),
        $geoip_disable: true
      });
    },
    identify(userRef: string) {
      if (skip()) return;
      client.identify(userRef);
    },
    reset() {
      void client.reset();
    },
    optIn() {
      if (skip()) return;
      void client.optIn();
    },
    optOut() {
      void client.optOut();
    },
    async flush() {
      await client.flush();
    }
  };
}
