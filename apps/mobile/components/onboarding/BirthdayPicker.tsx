// ============================================
// WHAT THIS FILE DOES (plain English):
// The birthday picker, painted in the onboarding look (tan paper, white boxes
// with a hard navy outline, hot pink accents). It asks for one piece at a time,
// always anchored under the breadcrumb at the top: YEAR (5 square cells per
// row, grouped under sticky pink decade labels) then MONTH (a list of white
// rows) then DAY (7 square cells per row, like a calendar week). It is the same
// screen the whole time, the cells just swap to the next piece. A small caps
// breadcrumb at the top (Year then Month then Day) shows where you are and lets
// you tap back up to change a piece. Once the day is picked we show a white
// "Is this right?" panel with the full date, so nothing is saved until they say
// yes.
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { withAnalyticsPress, useThemeColors } from '@bridger/ui';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBHardShadow, OBKicker } from './onboarding-ui';

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

/** Group years into decades (2020s, 2010s and so on) with newest decades first. */
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
  onColorWash = false,
  analyticsId
}: {
  value: string;
  onChange: (value: string) => void;
  /** called only after they confirm "Is this right?" */
  onComplete?: () => void;
  /**
   * Kept so the step still compiles unchanged. Onboarding is one tan room now,
   * so the picker always uses the onboarding paint box instead of two variants.
   */
  onColorWash?: boolean;
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

  // Years from this year back 100 years, newest first, then grouped by decade.
  const thisYear = new Date().getFullYear();
  const decades = useMemo(() => {
    const years = Array.from({ length: 101 }, (_, i) => thisYear - i);
    return groupByDecade(years);
  }, [thisYear]);

  const pickYear = (year: number) => {
    // Changing the year can shrink the month's day count, so clamp the day.
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
    // Don't save yet, show the confirm step first.
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
    <View style={{ flex: 1, minHeight: 0, gap: 16 }}>
      {/* THE BREADCRUMB: Year then Month then Day in small caps. The piece you
          are on is bright, the others are faded. Tapping one jumps back to it. */}
      {stage !== 'confirm' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 }}>
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

      {/* THE YEAR: square cells, 5 to a row, under a pink decade label that
          sticks to the top of the list as you scroll. */}
      {stage === 'year' ? (
        <YearList
          decades={decades}
          selected={parts.year}
          analyticsId={analyticsId}
          onPick={pickYear}
        />
      ) : null}

      {/* THE MONTH: a straight list of white rows, one month each. Sits flush
          under the breadcrumb (not vertically centered) so the top area stays
          the anchor on every stage. */}
      {stage === 'month' ? (
        <View style={{ gap: 5 }}>
          {MONTHS.map((mo, i) => (
            <Cell
              key={mo}
              label={mo}
              align="left"
              selected={parts.monthIndex === i}
              analyticsId={analyticsId}
              onPress={() => pickMonth(i)}
            />
          ))}
        </View>
      ) : null}

      {/* THE DAY: square cells, 7 to a row so it reads like a calendar week.
          Anchored under the breadcrumb, same as year and month. */}
      {stage === 'day' && parts.year != null && parts.monthIndex != null ? (
        <CellGrid cols={7}>
          {Array.from({ length: daysInMonth(parts.year, parts.monthIndex) }, (_, i) => i + 1).map(
            (d) => (
              <Cell
                key={d}
                label={String(d)}
                // A screen reader hears the whole date, not just a bare number.
                accessibilityLabel={`${MONTHS[parts.monthIndex as number]} ${d}`}
                selected={parts.day === d}
                analyticsId={analyticsId}
                onPress={() => pickDay(d)}
              />
            )
          )}
        </CellGrid>
      ) : null}

      {/* THE CHECK: the white "Is this right?" panel. This is the only way
          forward on this step, which is why the screen hides Continue. */}
      {stage === 'confirm' && formatted ? (
        // Anchored at the top, the same place the year, month and day cells
        // start, so the panel never jumps around when the stage changes.
        <View>
          <OBHardShadow color={OB.periwinkle}>
            <View
              style={{
                backgroundColor: OB.paper,
                borderWidth: OB_BORDER,
                borderColor: OB.navy,
                padding: 18,
                gap: 6
              }}
            >
              <OBKicker>Is this right?</OBKicker>
              {/* THE DATE: clean bold sans, not the pixel heading. A date reads
                  clearer in the body font, and it keeps pixel type for questions. */}
              <Text
                accessibilityRole="header"
                className="font-sans-b text-[28px]"
                style={{ color: OB.blue, letterSpacing: -0.4, lineHeight: 34 }}
              >
                {formatted}
              </Text>
              {/* THIS SECTION DOES: the two answers, stacked full width. Side by
                  side, "No, change it" got squeezed into a three-line sliver. */}
              <View style={{ gap: 10, marginTop: 12 }}>
                <PanelButton
                  label="Yes, that is my birthday"
                  tone="pink"
                  analyticsId={analyticsId}
                  onPress={confirm}
                  accessibilityLabel={`Yes, ${formatted} is my birthday`}
                />
                <PanelButton
                  label="No, pick again"
                  tone="quiet"
                  analyticsId={analyticsId}
                  onPress={() => setStage('year')}
                  accessibilityLabel="Change birthday"
                />
              </View>
            </View>
          </OBHardShadow>
        </View>
      ) : null}
    </View>
  );
}

/**
 * THE YEAR LIST: every decade becomes two stacked pieces, its pink label and
 * its grid of years. They are handed to the scroller as one flat list so the
 * label can stick to the top while you scroll through that decade.
 */
function YearList({
  decades,
  selected,
  analyticsId,
  onPick
}: {
  decades: DecadeGroup[];
  selected?: number;
  analyticsId: string;
  onPick: (year: number) => void;
}) {
  const rows: React.ReactNode[] = [];
  const stickyIndices: number[] = [];
  for (const decade of decades) {
    stickyIndices.push(rows.length);
    rows.push(
      <View key={`label-${decade.label}`} style={{ backgroundColor: OB.canvas, paddingTop: 4, paddingBottom: 8 }}>
        <Text
          className="font-sans-b text-[12px]"
          style={{ letterSpacing: 1.6, textTransform: 'uppercase', color: OB.pink }}
        >
          {decade.label}
        </Text>
      </View>
    );
    rows.push(
      <View key={`grid-${decade.label}`} style={{ paddingBottom: 14 }}>
        <CellGrid cols={5}>
          {decade.years.map((y) => (
            <Cell
              key={y}
              label={String(y)}
              selected={selected === y}
              analyticsId={analyticsId}
              onPress={() => onPick(y)}
            />
          ))}
        </CellGrid>
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={stickyIndices}
    >
      {rows}
    </ScrollView>
  );
}

/**
 * A fixed-column wrapping grid. Each cell gets an equal slice of the row
 * (years = 5, days = 7) with an even gap between them.
 */
function CellGrid({ cols, children }: { cols: number; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  // Padding on each slot so the gap stays even without fighting percentage
  // widths against the parent's gap property.
  const pad = 4;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -pad }}>
      {items.map((child, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, padding: pad }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/**
 * One tappable white box (a year, a month, or a day): flat, square, with a hard
 * navy outline. It fills periwinkle when it is the piece already chosen, so the
 * choice never depends on color alone next to the breadcrumb above.
 */
function Cell({
  label,
  selected,
  analyticsId,
  onPress,
  align = 'center',
  accessibilityLabel
}: {
  label: string;
  selected: boolean;
  analyticsId: string;
  onPress: () => void;
  align?: 'center' | 'left';
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        // minHeight, not height, so the box grows with larger text sizes.
        minHeight: 48,
        width: '100%',
        alignItems: align === 'left' ? 'flex-start' : 'center',
        justifyContent: 'center',
        paddingHorizontal: align === 'left' ? 13 : 4,
        paddingVertical: 10,
        backgroundColor: selected ? OB.periwinkle : OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      <Text className="font-sans-sb text-[15px]" style={{ color: OB.navy }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * One of the two buttons inside the "Is this right?" panel: the pink yes that
 * saves, and the quiet tan one that starts the picking over.
 */
function PanelButton({
  label,
  tone,
  analyticsId,
  onPress,
  accessibilityLabel
}: {
  label: string;
  tone: 'pink' | 'quiet';
  analyticsId: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const pink = tone === 'pink';
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: '100%',
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pink ? OB.pink : OB.canvas,
        borderWidth: OB_BORDER,
        borderColor: pink ? OB.pink : OB.navy
      }}
    >
      <Text
        className={pink ? 'font-sans-b text-[15px]' : 'font-sans-sb text-[15px]'}
        style={{ color: pink ? OB.onColor : OB.navy }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * One word in the breadcrumb. Small caps text, bright when it is the piece you
 * are on and faded otherwise. It is still tappable (that is how you go back up
 * a level), so it keeps a comfortable tap area.
 */
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
  // Inactive crumbs sit on the canvas; follow theme ink in dark mode.
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={label}
      hitSlop={12}
      style={{ minHeight: 44, justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <Text
        className="font-sans-b text-[14px]"
        style={{
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: active ? OB.blue : theme.inkMute
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** The little arrow between two breadcrumb words. Decoration only. */
function Sep() {
  const theme = useThemeColors();
  return (
    <Text
      className="font-sans-b text-[14px]"
      style={{ color: theme.inkMute }}
      accessible={false}
    >
      →
    </Text>
  );
}
