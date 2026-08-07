// ============================================
// WHAT THIS FILE DOES (plain English):
// After you confirm an Assistant calendar act, this asks the phone for
// calendar access (in context) and adds the date. If you say no, it opens
// a calendar handoff link instead. Never stores calendar credentials.
// ============================================
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { trackProduct } from '@bridger/shared';
import { addEventToCalendar } from './event-calendar';
import type { EventItem } from '@bridger/shared';

export type AssistantCalendarHandoff = {
  title?: string;
  date?: string;
  notes?: string;
};

// THIS SECTION DOES: turn a YYYY-MM-DD (or free text) into a start Date.
function parseDate(dateStr?: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y!, m! - 1, d!, 10, 0, 0, 0);
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

// THIS SECTION DOES: build a fake EventItem so the existing handoff helper works.
function asEventItem(h: AssistantCalendarHandoff): EventItem {
  const start = parseDate(h.date);
  const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return {
    id: 'assistant-calendar-handoff',
    title: h.title?.trim() || 'Reminder',
    emoji: '📅',
    accent: 'green',
    bio: h.notes?.trim() || '',
    day,
    time: '10:00',
    place: '',
    address: '',
    goingIds: [],
    hostId: '',
    role: 'host',
    startsAt: start.getTime()
  };
}

/**
 * Ask for calendar permission in context, then add the event.
 * On deny or unsupported platform, open the Google/ICS handoff.
 */
export async function addAssistantCalendarEntry(
  handoff: AssistantCalendarHandoff
): Promise<'added' | 'handoff' | 'unavailable'> {
  if (Platform.OS === 'web') {
    await addEventToCalendar(asEventItem(handoff));
    trackProduct('permission_result', {
      permission: 'calendar',
      outcome: 'dismissed',
      context: 'assistant_calendar'
    });
    return 'handoff';
  }

  const available = await Calendar.isAvailableAsync();
  if (!available) {
    await addEventToCalendar(asEventItem(handoff));
    return 'unavailable';
  }

  // ACCESSIBILITY / PRIVACY: ask only when the user confirmed the act.
  const perm = await Calendar.requestCalendarPermissionsAsync();
  trackProduct('permission_result', {
    permission: 'calendar',
    outcome: perm.granted ? 'granted' : 'denied',
    context: 'assistant_calendar'
  });

  if (!perm.granted) {
    await addEventToCalendar(asEventItem(handoff));
    return 'handoff';
  }

  try {
    let calendarId: string | undefined;
    if (Platform.OS === 'ios') {
      const def = await Calendar.getDefaultCalendarAsync();
      calendarId = def?.id;
    } else {
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable =
        cals.find((c) => c.allowsModifications && c.isPrimary) ??
        cals.find((c) => c.allowsModifications);
      calendarId = writable?.id;
    }
    if (!calendarId) {
      await addEventToCalendar(asEventItem(handoff));
      return 'handoff';
    }

    const start = parseDate(handoff.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await Calendar.createEventAsync(calendarId, {
      title: handoff.title?.trim() || 'Reminder',
      startDate: start,
      endDate: end,
      notes: handoff.notes?.trim() || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      allDay: false
    });
    return 'added';
  } catch {
    await addEventToCalendar(asEventItem(handoff));
    return 'handoff';
  }
}
