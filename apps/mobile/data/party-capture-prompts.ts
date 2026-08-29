// ============================================
// WHAT THIS FILE DOES (plain English):
// While you are at a party you said you are going to (or hosting), sends one
// surprise "capture the mems" notification at a random time mid-event — but
// only if you turned on BeReal-like reminders on the capture screen, and only
// if you still have room in your 3-posts-a-day quota. Demo mode schedules
// locally; live push will ship server-side later.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppNotification, EventItem } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { listEvents } from './events';
import { pushNotification } from './feed';
import { getNotificationPrefs } from './notification-prefs';
import { getPostQuota } from './stories';

/** Copy shown on the notification and in the Alerts list. */
export const PARTY_CAPTURE_MESSAGE = "📸 Don't forget to capture the mems";

/** Default party window when an event has no explicit end time (4 hours). */
export const PARTY_WINDOW_MS = 4 * 60 * 60 * 1000;

const NUDGED_KEY = '@bridger/party-capture-nudged';

/** In-memory timers so we do not double-schedule the same event. */
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** When the party window starts and ends (epoch ms). */
export function partyWindowForEvent(
  event: EventItem,
  now = Date.now()
): { start: number; end: number } | null {
  const start = event.startsAt;
  if (!start || !Number.isFinite(start)) return null;
  const end = start + PARTY_WINDOW_MS;
  if (now >= end) return null;
  return { start, end };
}

/** True when the event clock says the party is happening right now. */
export function isEventLive(event: EventItem, now = Date.now()): boolean {
  const window = partyWindowForEvent(event, now);
  if (!window) return false;
  return now >= window.start;
}

async function loadNudgedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NUDGED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

async function markNudged(eventId: string): Promise<void> {
  const ids = await loadNudgedIds();
  ids.add(eventId);
  await AsyncStorage.setItem(NUDGED_KEY, JSON.stringify([...ids]));
}

function clearTimers(): void {
  for (const timer of pendingTimers.values()) {
    clearTimeout(timer);
  }
  pendingTimers.clear();
}

/** Events you are hosting or going to that are live right now. */
export async function listLivePartyEvents(): Promise<EventItem[]> {
  const events = await listEvents();
  return events.filter(
    (e) => (e.role === 'going' || e.role === 'host') && isEventLive(e)
  );
}

function pickFireAt(event: EventItem, now = Date.now()): number | null {
  const window = partyWindowForEvent(event, now);
  if (!window) return null;

  const span = window.end - window.start;
  const midStart = window.start + span * 0.25;
  const midEnd = window.start + span * 0.75;

  if (isDemoMode()) {
    // Demo: fire soon so you can test without waiting hours.
    if (now < midStart) return now + randomBetween(8_000, 45_000);
    if (now <= midEnd) return now + randomBetween(5_000, 30_000);
    return now + randomBetween(3_000, 12_000);
  }

  if (now < midStart) return randomBetween(midStart, midEnd);
  if (now <= midEnd) return randomBetween(now, midEnd);
  return now + randomBetween(5_000, 60_000);
}

async function firePartyCapturePrompt(event: EventItem): Promise<void> {
  pendingTimers.delete(event.id);

  const prefs = await getNotificationPrefs();
  if (prefs.kinds.story_prompt !== true) return;

  const quota = await getPostQuota();
  if (quota.left <= 0) return;

  const nudged = await loadNudgedIds();
  if (nudged.has(event.id)) return;

  if (!isEventLive(event)) return;

  await markNudged(event.id);

  const item: AppNotification = {
    id: `party-capture-${event.id}-${Date.now()}`,
    kind: 'story_prompt',
    text: PARTY_CAPTURE_MESSAGE,
    time: 'Just now',
    unread: true,
    target: { eventId: event.id }
  };

  pushNotification(item);
}

/**
 * Reconcile timers for every live party. Call on app focus and on a slow poll.
 * Live mode: no-op until server push ships (client cannot background-schedule).
 */
export async function syncPartyCapturePrompts(): Promise<void> {
  if (!isDemoMode()) return;

  const prefs = await getNotificationPrefs();
  if (prefs.kinds.story_prompt !== true) {
    clearTimers();
    return;
  }

  const quota = await getPostQuota();
  if (quota.left <= 0) {
    clearTimers();
    return;
  }

  const [live, nudged] = await Promise.all([listLivePartyEvents(), loadNudgedIds()]);
  const liveIds = new Set(live.map((e) => e.id));

  for (const [eventId, timer] of [...pendingTimers.entries()]) {
    if (!liveIds.has(eventId)) {
      clearTimeout(timer);
      pendingTimers.delete(eventId);
    }
  }

  const now = Date.now();
  for (const event of live) {
    if (nudged.has(event.id) || pendingTimers.has(event.id)) continue;

    const fireAt = pickFireAt(event, now);
    if (!fireAt) continue;

    const delay = Math.max(0, fireAt - now);
    const timer = setTimeout(() => {
      void firePartyCapturePrompt(event);
    }, delay);
    pendingTimers.set(event.id, timer);
  }
}

/** Stop all pending party capture timers (e.g. on sign-out). */
export function stopPartyCapturePrompts(): void {
  clearTimers();
}
