// ============================================
// WHAT THIS FILE DOES (plain English):
// Starts Bridger analytics when the app boots. Sets platform / session context
// and registers sinks. PRIVACY: capture stays off until a signed-in session
// opts in (always on for real accounts; demo stays quiet). PostHog is the
// real mailbox. In __DEV__ we also print events to the console so you can
// check names without opening PostHog.
// ============================================
import { Platform } from 'react-native';
import {
  configureAnalyticsContext,
  registerAnalyticsSink,
  type AnalyticsBaseProps,
  type AnalyticsSink
} from '@bridger/shared';
import Constants from 'expo-constants';
import { createPosthogSink } from './posthog-sink';

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

/** Send the same event to every sink (PostHog + optional console). */
function composeSinks(sinks: AnalyticsSink[]): AnalyticsSink {
  return {
    capture(event, properties) {
      for (const sink of sinks) sink.capture(event, properties);
    },
    identify(userRef) {
      for (const sink of sinks) sink.identify?.(userRef);
    },
    reset() {
      for (const sink of sinks) sink.reset?.();
    },
    optIn() {
      for (const sink of sinks) sink.optIn?.();
    },
    optOut() {
      for (const sink of sinks) sink.optOut?.();
    },
    async flush() {
      for (const sink of sinks) await sink.flush?.();
    }
  };
}

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

  const sinks: AnalyticsSink[] = [];
  const posthog = createPosthogSink();
  if (posthog) sinks.push(posthog);
  if (__DEV__) sinks.push(devConsoleSink);
  if (sinks.length > 0) {
    registerAnalyticsSink(composeSinks(sinks));
  }
}
