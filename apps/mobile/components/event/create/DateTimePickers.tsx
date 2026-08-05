// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny Google-Calendar-style pickers for Create event. Tap the date chip to
// open a month grid; tap the time chip to open a scrollable list of times.
// No extra packages — just React Native views.
// ============================================
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Times every 15 minutes from 07:00 through 23:30. */
export function timeSlots(): string[] {
  const out: string[] = [];
  for (let h = 7; h <= 23; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 30) continue;
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
}

/** Turn YYYY-MM-DD into a short readable label like "Fri, Jul 31". */
export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function padIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The date chip + month calendar popover. */
export function DatePickerChip({
  dayIso,
  dayLabel,
  onChange
}: {
  dayIso: string;
  dayLabel: string;
  onChange: (iso: string, label: string) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const initial = dayIso ? new Date(dayIso + 'T12:00:00') : new Date();
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth()
  });

  const cells = useMemo(() => {
    const firstDow = new Date(cursor.year, cursor.month, 1).getDay();
    const total = daysInMonth(cursor.year, cursor.month);
    const blanks = Array.from({ length: firstDow }, () => null as number | null);
    const days = Array.from({ length: total }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [cursor]);

  const monthTitle = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(cursor.year, cursor.month, 1));

  function pick(day: number) {
    const iso = padIso(cursor.year, cursor.month, day);
    onChange(iso, formatDayLabel(iso));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={withAnalyticsPress(CREATE_EVENT.details.date, () => setOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={`Date ${dayLabel}`}
        className="min-h-[44px] flex-1 justify-center rounded-full border border-ink-line bg-surface px-4"
      >
        <Text className="font-sans-b text-[13px] text-ink">{dayLabel || 'Pick a day'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={() => setOpen(false)}
          accessibilityLabel="Close calendar"
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            accessibilityRole="none"
            className="w-full max-w-sm rounded-card border border-ink-line bg-canvas p-4"
          >
            {/* --- MONTH HEADER --- */}
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                onPress={withAnalyticsPress(CREATE_EVENT.details.date_picker, () =>
                  setCursor((p) => {
                    const m = p.month - 1;
                    return m < 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: m };
                  })
                )}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <ChevronLeftIcon size={20} color={c.ink} strokeWidth={2.4} />
              </Pressable>
              <Text className="font-sans-b text-[15px] text-ink">{monthTitle}</Text>
              <Pressable
                onPress={withAnalyticsPress(CREATE_EVENT.details.date_picker, () =>
                  setCursor((p) => {
                    const m = p.month + 1;
                    return m > 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: m };
                  })
                )}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <ChevronRightIcon size={20} color={c.ink} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View className="mb-1 flex-row">
              {WEEKDAYS.map((w, i) => (
                <Text key={`${w}-${i}`} className="flex-1 text-center font-sans-b text-[11px] text-ink-mute">
                  {w}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {cells.map((day, i) => {
                if (day == null) {
                  return <View key={`b-${i}`} style={{ width: '14.28%', height: 40 }} />;
                }
                const iso = padIso(cursor.year, cursor.month, day);
                const on = iso === dayIso;
                return (
                  <Pressable
                    key={iso}
                    onPress={withAnalyticsPress(CREATE_EVENT.details.date_picker, () => pick(day))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={formatDayLabel(iso)}
                    style={{ width: '14.28%', height: 40 }}
                    className="items-center justify-center"
                  >
                    <View
                      className={cn(
                        'h-9 w-9 items-center justify-center rounded-full',
                        on && 'bg-blue'
                      )}
                    >
                      <Text className={cn('font-sans-b text-[13px]', on ? 'text-white' : 'text-ink')}>
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** The time chip + scrollable time list popover. */
export function TimePickerChip({
  time,
  onChange
}: {
  time: string;
  onChange: (time: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const slots = useMemo(() => timeSlots(), []);

  return (
    <>
      <Pressable
        onPress={withAnalyticsPress(CREATE_EVENT.details.time, () => setOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={`Time ${time}`}
        className="min-h-[44px] flex-1 justify-center rounded-full border border-ink-line bg-surface px-4"
      >
        <Text className="font-sans-b text-[13px] text-ink">{time || 'Pick a time'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={() => setOpen(false)}
          accessibilityLabel="Close time picker"
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            accessibilityRole="none"
            className="h-80 w-full max-w-sm overflow-hidden rounded-card border border-ink-line bg-canvas"
          >
            <Text className="border-b border-ink-line px-4 py-3 font-sans-b text-[15px] text-ink">
              Pick a time
            </Text>
            <ScrollView>
              {slots.map((t) => {
                const on = t === time;
                return (
                  <Pressable
                    key={t}
                    onPress={withAnalyticsPress(CREATE_EVENT.details.time_picker, () => {
                      onChange(t);
                      setOpen(false);
                    })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t}
                    className={cn(
                      'min-h-[44px] justify-center border-b border-ink-line px-4',
                      on && 'bg-green/15'
                    )}
                  >
                    <Text className={cn('font-sans-b text-[14px]', on ? 'text-green' : 'text-ink')}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
