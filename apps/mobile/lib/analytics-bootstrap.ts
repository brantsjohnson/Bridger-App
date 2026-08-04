// ============================================
// WHAT THIS FILE DOES (plain English):
// Starts Bridger analytics when the app boots. Sets platform / session context
// and registers a sink. PRIVACY: capture stays opted-out until the user turns
// analytics on in Settings (optInAnalytics). In __DEV__ we log to the console
// only after consent, so local testing can see event shapes without shipping
// PostHog yet.
// ============================================
import { Platform } from 'react-native';
import {
  configureAnalyticsContext,
  registerAnalyticsSink,
  type AnalyticsBaseProps,
  type AnalyticsSink
} from '@bridger/shared';
import Constants from 'expo-constants';

/** Make a short opaque session id (not tied to the person). */
function makeSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Dev-only sink: prints events so we can verify taxonomy ids while building. */
const devConsoleSink: AnalyticsSink = {
  capture(event: string, properties: AnalyticsBaseProps) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, properties.id ?? '', {
      surface: properties.surface,
      method: properties.method,
      flow: properties.flow
    });
  },
  optIn() {
    // eslint-disable-next-line no-console
    console.log('[analytics] opted in');
  },
  optOut() {
    // eslint-disable-next-line no-console
    console.log('[analytics] opted out');
  }
};

let booted = false;

/** Call once from the root layout. Safe to call again (no-ops). */
export function bootstrapAnalytics(): void {
  if (booted) return;
  booted = true;

  configureAnalyticsContext({
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? '0.0.1',
    session_id: makeSessionId()
  });

  // PostHog SDK will replace this sink later. Until then, __DEV__ console only.
  if (__DEV__) {
    registerAnalyticsSink(devConsoleSink);
  }
}
