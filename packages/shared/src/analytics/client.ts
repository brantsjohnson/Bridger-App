// ============================================
// WHAT THIS FILE DOES (plain English):
// The one place every screen and UI primitive talks to for analytics. It
// starts quiet until the app opts in for a signed-in session, keeps a light
// surface clock so we can stamp interaction order + hesitation, and forwards
// events to whatever sink you register (PostHog). PRIVACY: never put names,
// emails, message text, or other content in properties. Demo and logged-out
// stay off.
// ============================================
import { parseAnalyticsId } from './ids';
import { sanitizeAnalyticsProps } from './sanitize';
import type {
  AnalyticsBaseProps,
  AnalyticsProductEvent,
  AnalyticsSink,
  AnalyticsUiAction
} from './types';

type SurfaceState = {
  name: string;
  parent_screen?: string;
  openedAt: number;
  interactionIndex: number;
};

let sink: AnalyticsSink | null = null;
let consented = false;
let platform: string | undefined;
let appVersion: string | undefined;
let sessionId: string | undefined;
let userRef: string | undefined;

const surfaces = new Map<string, SurfaceState>();
let activeSurface: string | undefined;

/** Wire the PostHog (or other) SDK once at app boot. */
export function registerAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
  if (sink && consented) sink.optIn?.();
  if (sink && !consented) sink.optOut?.();
}

/** Set platform / app version / session once so every event carries them. */
export function configureAnalyticsContext(ctx: {
  platform?: string;
  app_version?: string;
  session_id?: string;
}): void {
  platform = ctx.platform ?? platform;
  appVersion = ctx.app_version ?? appVersion;
  sessionId = ctx.session_id ?? sessionId;
}

/**
 * PRIVACY: starts quiet. The app calls optInAnalytics for signed-in sessions
 * (product analytics is on by default while signed in; demo stays off).
 * We do not use Apple ATT: this is first-party product analytics, not
 * cross-app tracking.
 */
export function optInAnalytics(): void {
  consented = true;
  sink?.optIn?.();
}

export function optOutAnalytics(): void {
  consented = false;
  sink?.optOut?.();
  userRef = undefined;
  sink?.reset?.();
}

export function isAnalyticsConsented(): boolean {
  return consented;
}

/** Identify with an opaque user_ref only — never email/name/phone. */
export function identifyAnalyticsUser(ref: string | null): void {
  userRef = ref ?? undefined;
  if (consented && userRef) sink?.identify?.(userRef);
}

function stamp(extra?: AnalyticsBaseProps): AnalyticsBaseProps {
  const surface = extra?.surface ?? activeSurface;
  const state = surface ? surfaces.get(surface) : undefined;
  return {
    timestamp: new Date().toISOString(),
    platform,
    app_version: appVersion,
    session_id: sessionId,
    user_ref: consented ? userRef : undefined,
    surface,
    parent_screen: extra?.parent_screen ?? state?.parent_screen,
    duration_since_screen_load: state ? Date.now() - state.openedAt : undefined,
    ...extra
  };
}

function emit(event: string, properties: AnalyticsBaseProps): void {
  if (!consented || !sink) return;
  sink.capture(event, sanitizeAnalyticsProps(stamp(properties)));
}

/** Push any queued events (call this before opt-out so the last event lands). */
export async function flushAnalytics(): Promise<void> {
  await sink?.flush?.();
}

/** Mark a screen or sheet as the active surface (for interaction order). */
export function openSurface(surface: string, parent_screen?: string): void {
  const state: SurfaceState = {
    name: surface,
    parent_screen,
    openedAt: Date.now(),
    interactionIndex: 0
  };
  surfaces.set(surface, state);
  activeSurface = surface;
  emit('surface_opened', { surface, parent_screen, id: surface });
}

/** Close a sheet/surface without a completed action — records dwell time. */
export function dismissSurface(surface: string, extras?: AnalyticsBaseProps): void {
  const state = surfaces.get(surface);
  const dwell_ms = state ? Date.now() - state.openedAt : undefined;
  emit('surface_dismissed', {
    surface,
    parent_screen: state?.parent_screen,
    dwell_ms,
    id: surface,
    ...extras
  });
  surfaces.delete(surface);
  if (activeSurface === surface) activeSurface = state?.parent_screen;
}

function nextInteraction(surface?: string): {
  interaction_index: number;
  first_interaction: boolean;
} {
  const key = surface ?? activeSurface;
  if (!key) return { interaction_index: 1, first_interaction: true };
  const state = surfaces.get(key);
  if (!state) return { interaction_index: 1, first_interaction: true };
  state.interactionIndex += 1;
  return {
    interaction_index: state.interactionIndex,
    first_interaction: state.interactionIndex === 1
  };
}

/**
 * Emit a UI event. Event name = the action (click, dead_click…).
 * Pass analyticsId as screen.section.element — we split it into properties.
 */
export function trackUi(
  action: AnalyticsUiAction,
  analyticsId: string,
  extras?: AnalyticsBaseProps
): void {
  const parsed = parseAnalyticsId(analyticsId);
  const surface = extras?.surface ?? parsed.screen ?? activeSurface;
  const order = nextInteraction(surface);
  emit(action, {
    id: analyticsId,
    ...parsed,
    surface,
    ...order,
    ...extras
  });
}

/** Shortcut for a normal tap on an interactive element. */
export function trackClick(analyticsId: string, extras?: AnalyticsBaseProps): void {
  trackUi('click', analyticsId, extras);
}

/** Shortcut for a tap on a non-interactive region (dead_click). */
export function trackDeadClick(analyticsId: string, extras?: AnalyticsBaseProps): void {
  trackUi('dead_click', analyticsId, extras);
}

/** Named product outcome (quiz_completed, friend_retiered, …). */
export function trackProduct(
  event: AnalyticsProductEvent,
  properties?: AnalyticsBaseProps
): void {
  emit(event, properties ?? {});
}

/** Multi-step flow helpers (onboarding, touch_grass_send, create_event…). */
export function trackFlowStarted(flow: string, extras?: AnalyticsBaseProps): void {
  emit('flow_started', { flow, flow_step: 'start', ...extras });
}

export function trackFlowStep(
  flow: string,
  flow_step: string,
  extras?: AnalyticsBaseProps
): void {
  emit('flow_step', { flow, flow_step, ...extras });
}

export function trackFlowCompleted(
  flow: string,
  time_to_complete_ms: number,
  extras?: AnalyticsBaseProps
): void {
  emit('flow_completed', { flow, time_to_complete_ms, ...extras });
}

export function trackFlowAbandoned(
  flow: string,
  time_to_complete_ms: number,
  lastStep: string,
  extras?: AnalyticsBaseProps
): void {
  emit('flow_abandoned', {
    flow,
    time_to_complete_ms,
    flow_step: lastStep,
    ...extras
  });
}
