// ============================================
// WHAT THIS FILE DOES (plain English):
// A birthday picker that drills down from the top: YEAR (grouped by decade,
// 5 per row) → MONTH (3 per row) → DAY (7 per row, like a calendar week).
// Same screen the whole time — the tiles just swap to the next level. After
// the day is picked, we ask "Is this right?" so they can confirm before we
// save. A breadcrumb at the top lets them jump back up to change a piece.
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ButtonPrimary, ButtonSecondary, cn, withAnalyticsPress } from '@bridger/ui';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Which level of the drill-down is showing. */
type Stage = 'year' | 'month' | 'day' | 'confirm';

type Parts = { year?: number; monthIndex?: number; day?: number };

type DecadeGroup = { label: string; years: number[] };

/** Turn "March 14, 1998" back into parts so re-editing resumes correctly. */
function parse(value: string): Parts {
  const m = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return {};
  const monthIndex = MONTHS.findIndex((mo) => mo.toLowerCase() === m[1].toLowerCase());
  return {
    year: Number(m[3]),
    monthIndex: monthIndex >= 0 ? monthIndex : undefined,
    day: Number(m[2])
  };
}

/** Build the display string once all three parts are known. */
function format(parts: Parts): string {
  if (parts.year == null || parts.monthIndex == null || parts.day == null) return '';
  return `${MONTHS[parts.monthIndex]} ${parts.day}, ${parts.year}`;
}

/** Days in a given month (handles leap-year February). */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Group years into decades (2020s, 2010s…) with newest decades first. */
function groupByDecade(years: number[]): DecadeGroup[] {
  const map = new Map<number, number[]>();
  for (const y of years) {
    const start = Math.floor(y / 10) * 10;
    const list = map.get(start) ?? [];
    list.push(y);
    map.set(start, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([start, ys]) => ({
      label: `${start}s`,
      years: ys.sort((a, b) => b - a)
    }));
}

export function BirthdayPicker({
  value,
  onChange,
  onComplete,
  analyticsId
}: {
  value: string;
  onChange: (value: string) => void;
  /** called only after they confirm "Is this right?" */
  onComplete?: () => void;
  analyticsId: string;
}) {
  const initial = useMemo(() => parse(value), [value]);
  const [parts, setParts] = useState<Parts>(initial);
  // If they already have a birthday saved, land on confirm so they can re-check.
  const [stage, setStage] = useState<Stage>(
    initial.year != null && initial.monthIndex != null && initial.day != null
      ? 'confirm'
      : 'year'
  );

  // Years from this year back 100 years — newest first, then grouped by decade.
  const thisYear = new Date().getFullYear();
  const decades = useMemo(() => {
    const years = Array.from({ length: 101 }, (_, i) => thisYear - i);
    return groupByDecade(years);
  }, [thisYear]);

  const pickYear = (year: number) => {
    // Changing the year can shrink the month's day count — clamp the day.
    setParts((p) => {
      const day =
        p.monthIndex != null && p.day != null
          ? Math.min(p.day, daysInMonth(year, p.monthIndex))
          : p.day;
      return { ...p, year, day };
    });
    setStage('month');
  };

  const pickMonth = (monthIndex: number) => {
    setParts((p) => {
      const day =
        p.year != null && p.day != null
          ? Math.min(p.day, daysInMonth(p.year, monthIndex))
          : p.day;
      return { ...p, monthIndex, day };
    });
    setStage('day');
  };

  const pickDay = (day: number) => {
    const next = { ...parts, day };
    setParts(next);
    // Don't save yet — show the confirm step first.
    setStage('confirm');
  };

  const confirm = () => {
    const text = format(parts);
    if (!text) return;
    onChange(text);
    onComplete?.();
  };

  const formatted = format(parts);

  return (
    <View className="gap-3">
      {/* Breadcrumb: shows what's chosen and lets you jump back up a level */}
      {stage !== 'confirm' ? (
        <View className="flex-row items-center gap-1.5">
          <Crumb
            label={parts.year != null ? String(parts.year) : 'Year'}
            active={stage === 'year'}
            onPress={() => setStage('year')}
          />
          <Sep />
          <Crumb
            label={parts.monthIndex != null ? MONTHS[parts.monthIndex] : 'Month'}
            active={stage === 'month'}
            disabled={parts.year == null}
            onPress={() => parts.year != null && setStage('month')}
          />
          <Sep />
          <Crumb
            label={parts.day != null ? String(parts.day) : 'Day'}
            active={stage === 'day'}
            disabled={parts.monthIndex == null}
            onPress={() => parts.monthIndex != null && setStage('day')}
          />
        </View>
      ) : null}

      {/* --- YEAR: decades, 5 tiles per row --- */}
      {stage === 'year' ? (
        <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            {decades.map((decade) => (
              <View key={decade.label} className="gap-2">
                <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                  {decade.label}
                </Text>
                <TileGrid cols={5}>
                  {decade.years.map((y) => (
                    <Tile
                      key={y}
                      label={String(y)}
                      selected={parts.year === y}
                      analyticsId={analyticsId}
                      onPress={() => pickYear(y)}
                    />
                  ))}
                </TileGrid>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {/* --- MONTH: 3 per row --- */}
      {stage === 'month' ? (
        <TileGrid cols={3}>
          {MONTHS.map((mo, i) => (
            <Tile
              key={mo}
              label={mo}
              selected={parts.monthIndex === i}
              analyticsId={analyticsId}
              onPress={() => pickMonth(i)}
            />
          ))}
        </TileGrid>
      ) : null}

      {/* --- DAY: 7 per row (week-style) --- */}
      {stage === 'day' && parts.year != null && parts.monthIndex != null ? (
        <TileGrid cols={7}>
          {Array.from({ length: daysInMonth(parts.year, parts.monthIndex) }, (_, i) => i + 1).map(
            (d) => (
              <Tile
                key={d}
                label={String(d)}
                selected={parts.day === d}
                analyticsId={analyticsId}
                onPress={() => pickDay(d)}
              />
            )
          )}
        </TileGrid>
      ) : null}

      {/* --- CONFIRM: "Is this right?" before we save and move on --- */}
      {stage === 'confirm' && formatted ? (
        <View className="gap-4 rounded-2xl border border-ink-line bg-surface px-5 py-6">
          <Text className="text-center font-sans-b text-[13px] text-ink-mute">Is this right?</Text>
          <Text
            accessibilityRole="header"
            className="text-center font-pixel text-[22px] text-ink"
          >
            {formatted}
          </Text>
          <View className="gap-2.5 pt-1">
            <ButtonPrimary
              full
              size="lg"
              analyticsId={analyticsId}
              onPress={confirm}
              accessibilityLabel={`Yes, ${formatted} is right`}
            >
              Yes, that's right
            </ButtonPrimary>
            <ButtonSecondary
              full
              tone="ghost"
              analyticsId={analyticsId}
              onPress={() => setStage('year')}
              accessibilityLabel="Change birthday"
            >
              No, change it
            </ButtonSecondary>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A fixed-column wrapping grid. Each child gets an equal slice of the row
 * (years = 5, months = 3, days = 7) with a small gap between tiles.
 */
function TileGrid({ cols, children }: { cols: number; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  // Padding on each cell so the gap between tiles is even without fighting
  // percentage widths against the parent's gap property.
  const pad = 4;
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -pad
      }}
    >
      {items.map((child, i) => (
        <View
          key={i}
          style={{
            width: `${100 / cols}%`,
            padding: pad
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

/** One tappable rectangle (a year, a month, or a day). */
function Tile({
  label,
  selected,
  analyticsId,
  onPress
}: {
  label: string;
  selected: boolean;
  analyticsId: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className={cn(
        'min-h-[44px] w-full items-center justify-center rounded-xl border px-1 py-2.5',
        selected ? 'border-teal bg-teal' : 'border-ink-line bg-surface active:border-teal/40'
      )}
    >
      <Text
        numberOfLines={1}
        className={cn('font-sans-b text-[13px]', selected ? 'text-white' : 'text-ink')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A breadcrumb chip; tapping jumps back to that level. */
function Crumb({
  label,
  active,
  disabled = false,
  onPress
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={label}
      className={cn(
        'rounded-full px-3 py-1',
        active ? 'bg-ink' : 'bg-ink/5',
        disabled && 'opacity-40'
      )}
    >
      {/* text-canvas stays opposite of bg-ink when the theme flips */}
      <Text className={cn('font-sans-b text-[12px]', active ? 'text-canvas' : 'text-ink-soft')}>
        {label}
      </Text>
    </Pressable>
  );
}

function Sep() {
  return <Text className="font-sans-b text-[12px] text-ink-mute">›</Text>;
}
