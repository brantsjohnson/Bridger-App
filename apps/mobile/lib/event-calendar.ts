// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds a calendar link for an event so "Add to calendar" opens Google /
// Apple with the title, time, and place already filled in. We never store
// calendar credentials — just hand the person a URL / .ics they can accept.
// ============================================
import { Linking, Platform, Share } from 'react-native';
import type { EventItem } from '@bridger/shared';

/** Best-effort parse of demo day strings like "Fri 31 Jul" into a Date this year. */
function parseEventStart(event: EventItem): Date {
  if (event.startsAt) return new Date(event.startsAt);

  const now = new Date();
  const [h, m] = (event.time || '18:00').split(':').map(Number);
  const hours = Number.isFinite(h) ? h! : 18;
  const mins = Number.isFinite(m) ? m! : 0;

  // Try "Fri 31 Jul" / "31 Jul" style
  const match = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.exec(
    event.day || ''
  );
  if (match) {
    const months = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec'
    ];
    const month = months.indexOf(match[2]!.toLowerCase());
    const day = Number(match[1]);
    if (month >= 0 && day > 0) {
      const d = new Date(now.getFullYear(), month, day, hours, mins, 0, 0);
      if (d.getTime() < now.getTime() - 86400000) {
        d.setFullYear(d.getFullYear() + 1);
      }
      return d;
    }
  }

  // YYYY-MM-DD from create flow
  if (/^\d{4}-\d{2}-\d{2}$/.test(event.day || '')) {
    const [y, mo, d] = event.day.split('-').map(Number);
    return new Date(y!, mo! - 1, d!, hours, mins, 0, 0);
  }

  const fallback = new Date(now.getTime() + 2 * 86400000);
  fallback.setHours(hours, mins, 0, 0);
  return fallback;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** UTC stamp like 20260731T183000Z for Google Calendar / ICS. */
function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/**
 * Open the platform calendar with this event prefilled.
 * iOS/Android: Google Calendar web template (works everywhere) + share ICS text
 * as a fallback path when the person wants Apple Calendar via the share sheet.
 */
export async function addEventToCalendar(event: EventItem): Promise<void> {
  const start = parseEventStart(event);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const startUtc = toUtcStamp(start);
  const endUtc = toUtcStamp(end);
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.bio || '');
  const location = encodeURIComponent(
    [event.place, event.address].filter(Boolean).join(', ')
  );

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}&dates=${startUtc}/${endUtc}` +
    `&details=${details}&location=${location}`;

  try {
    const can = await Linking.canOpenURL(googleUrl);
    if (can) {
      await Linking.openURL(googleUrl);
      return;
    }
  } catch {
    // Fall through to ICS share
  }

  // Fallback: share a tiny .ics body so Apple Calendar / other apps can import it
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.bio || '').replace(/\n/g, ' ')}`,
    `LOCATION:${[event.place, event.address].filter(Boolean).join(', ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  await Share.share({
    message: Platform.OS === 'ios' ? ics : `${event.title}\n${googleUrl}`,
    title: event.title,
    url: Platform.OS === 'ios' ? undefined : googleUrl
  });
}
