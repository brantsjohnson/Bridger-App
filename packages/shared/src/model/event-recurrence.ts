// ============================================
// WHAT THIS FILE DOES (plain English):
// Helpers for repeating events: validate a small rule object, and turn it into
// a short human label like "Every Monday" for the UI. Weekdays use ISO numbers
// (1 = Monday … 7 = Sunday).
// ============================================

/** How an event repeats. Null/undefined on the event = one-off. */
export type EventRecurrence = {
  freq: 'weekly' | 'monthly' | 'yearly';
  /** Every N weeks/months/years. Default 1. */
  interval: number;
  /** ISO weekdays 1=Mon … 7=Sun. Weekly (and monthly-by-weekday). */
  byWeekday?: number[];
  /** 1–31 when monthly on calendar day. */
  byMonthday?: number;
  /** 1|2|3|4|-1 when monthly on Nth weekday. */
  bySetpos?: number;
  /** ISO date YYYY-MM-DD inclusive end. */
  until?: string;
  /** Stop after this many occurrences. */
  count?: number;
};

const WEEKDAY_NAMES = [
  '',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const SETPOS_LABELS: Record<number, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  [-1]: 'last'
};

/** Throw (or return) if the rule combo is invalid. */
export function assertRecurrence(rule: EventRecurrence): void {
  if (!['weekly', 'monthly', 'yearly'].includes(rule.freq)) {
    throw new Error('Invalid recurrence frequency');
  }
  const interval = Math.floor(rule.interval || 1);
  if (interval < 1 || interval > 52) {
    throw new Error('Recurrence interval must be 1–52');
  }
  if (rule.freq === 'weekly') {
    const days = rule.byWeekday ?? [];
    if (!days.length || days.some((d) => d < 1 || d > 7)) {
      throw new Error('Weekly recurrence needs weekdays 1–7');
    }
  }
  if (rule.freq === 'monthly') {
    const hasDay = typeof rule.byMonthday === 'number';
    const hasSetpos =
      typeof rule.bySetpos === 'number' && (rule.byWeekday?.length ?? 0) > 0;
    if (hasDay === hasSetpos) {
      throw new Error('Monthly recurrence needs day-of-month OR Nth weekday');
    }
    if (hasDay && (rule.byMonthday! < 1 || rule.byMonthday! > 31)) {
      throw new Error('Month day must be 1–31');
    }
    if (hasSetpos) {
      if (![1, 2, 3, 4, -1].includes(rule.bySetpos!)) {
        throw new Error('Invalid monthly setpos');
      }
    }
  }
  if (rule.until && !/^\d{4}-\d{2}-\d{2}$/.test(rule.until)) {
    throw new Error('until must be YYYY-MM-DD');
  }
  if (rule.count != null) {
    const c = Math.floor(rule.count);
    if (c < 2 || c > 100) throw new Error('count must be 2–100');
  }
  if (rule.until && rule.count != null) {
    throw new Error('Use until OR count, not both');
  }
}

/** Normalize interval/count and strip empty arrays. */
export function normalizeRecurrence(rule: EventRecurrence): EventRecurrence {
  assertRecurrence(rule);
  const next: EventRecurrence = {
    freq: rule.freq,
    interval: Math.max(1, Math.floor(rule.interval || 1))
  };
  if (rule.byWeekday?.length) {
    next.byWeekday = [...new Set(rule.byWeekday)].sort((a, b) => a - b);
  }
  if (typeof rule.byMonthday === 'number') next.byMonthday = rule.byMonthday;
  if (typeof rule.bySetpos === 'number') next.bySetpos = rule.bySetpos;
  if (rule.until) next.until = rule.until;
  if (rule.count != null) next.count = Math.floor(rule.count);
  return next;
}

/** Short UI label, e.g. "Every week on Monday · until Dec 2026". */
export function formatRecurrenceLabel(
  rule: EventRecurrence,
  _sampleStart?: Date
): string {
  const interval = Math.max(1, Math.floor(rule.interval || 1));
  let core = '';

  if (rule.freq === 'weekly') {
    const names = (rule.byWeekday ?? [])
      .map((d) => WEEKDAY_NAMES[d] ?? '')
      .filter(Boolean);
    const dayPart = names.length ? ` on ${names.join(', ')}` : '';
    core =
      interval === 1
        ? `Every week${dayPart}`
        : `Every ${interval} weeks${dayPart}`;
  } else if (rule.freq === 'monthly') {
    if (typeof rule.byMonthday === 'number') {
      core =
        interval === 1
          ? `Monthly on day ${rule.byMonthday}`
          : `Every ${interval} months on day ${rule.byMonthday}`;
    } else {
      const pos = SETPOS_LABELS[rule.bySetpos ?? 1] ?? 'first';
      const day = WEEKDAY_NAMES[rule.byWeekday?.[0] ?? 1] ?? 'Monday';
      core =
        interval === 1
          ? `Monthly on the ${pos} ${day}`
          : `Every ${interval} months on the ${pos} ${day}`;
    }
  } else {
    core = interval === 1 ? 'Every year' : `Every ${interval} years`;
  }

  if (rule.until) return `${core} · until ${rule.until}`;
  if (rule.count != null) return `${core} · ${rule.count} times`;
  return core;
}

/** ISO weekday 1=Mon … 7=Sun for a Date. */
export function isoWeekday(d: Date): number {
  const js = d.getUTCDay(); // 0=Sun
  return js === 0 ? 7 : js;
}
