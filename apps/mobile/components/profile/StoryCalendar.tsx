// ============================================
// WHAT THIS FILE DOES (plain English):
// The Stories tab on your profile — a memory archive, not a content grid.
// A month calendar where each day you posted shows that story's emoji; tap a
// posted day to watch it again. Under it, the storage card: how full your
// free month is, with the co-op prompt only when it's actually full.
// Analytics: day / month_nav / storage_bar use PROFILE.stories_calendar.*.
// ============================================
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { PROFILE } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonSecondary,
  EmptyState,
  StorageBar,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import type { StorageState } from '../../data/profile';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/** Build YYYY-MM for "this month" in local time. */
export function currentArchiveMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y!, (m! - 1) + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function labelForMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[(m! - 1) % 12] ?? 'Month'} ${y}`;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m!, 0).getDate();
}

function startWeekday(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m! - 1, 1).getDay();
}

export function StoryCalendar({
  days,
  storage,
  empty = false,
  monthYm,
  onMonthChange,
  onOpenStory
}: {
  /** day of month -> story thumbnail emoji */
  days: Record<number, string>;
  storage: StorageState;
  empty?: boolean;
  /** Active month as YYYY-MM (drives arrows + day grid). */
  monthYm: string;
  /** Called when the person taps previous / next month. */
  onMonthChange?: (ym: string) => void;
  /** a posted day opens that day's story */
  onOpenStory?: (day: number) => void;
}) {
  const router = useRouter();
  const c = useThemeColors();
  const usedPct = empty ? 0 : storage.usedPct;
  const monthLabel = useMemo(() => labelForMonth(monthYm), [monthYm]);
  const totalDays = useMemo(() => daysInMonth(monthYm), [monthYm]);
  const padStart = useMemo(() => startWeekday(monthYm), [monthYm]);

  if (empty) {
    return (
      <EmptyState
        emoji="📸"
        line="No pages yet. Your collage pages land here as a monthly archive."
        action={
          <ButtonSecondary size="sm" tone="solid">
            Start your collage
          </ButtonSecondary>
        }
      />
    );
  }

  // THIS SECTION DOES: open that day's archived story in the player.
  const openStory = (day: number) => {
    if (onOpenStory) {
      onOpenStory(day);
      return;
    }
    // Fallback: open the catch-up story player for this archive day.
    router.push(`/story/me?catchup=1&from=profile&day=${day}&month=${monthYm}`);
  };

  return (
    <View className="gap-5">
      <View className="rounded-card border border-ink-line bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={withAnalyticsPress(PROFILE.stories_calendar.month_nav, () =>
              onMonthChange?.(shiftMonth(monthYm, -1))
            )}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-[#F1ECFF]"
          >
            <ChevronLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
          </Pressable>
          <Text className="font-pixel text-[16px] text-ink">{monthLabel}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={withAnalyticsPress(PROFILE.stories_calendar.month_nav, () =>
              onMonthChange?.(shiftMonth(monthYm, 1))
            )}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-[#F1ECFF]"
          >
            <ChevronRightIcon size={16} color={c.ink} strokeWidth={2.6} />
          </Pressable>
        </View>

        <Text className="mt-2 text-center font-sans-sb text-[11px] text-ink-mute">
          Tap a day to watch that story again.
        </Text>

        {/* 7-column grid: weekday labels, then real days for this month */}
        <View className="mt-3 flex-row flex-wrap">
          {DAY_LABELS.map((d, i) => (
            <View key={`${d}-${i}`} style={{ width: `${100 / 7}%` }} className="pb-1.5">
              <Text className="text-center font-sans-b text-[10px] text-ink-mute">{d}</Text>
            </View>
          ))}
          {Array.from({ length: padStart }).map((_, i) => (
            <View key={`pad-${i}`} style={{ width: `${100 / 7}%` }} className="p-[3px]" />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const thumb = days[day];
            return (
              <View key={day} style={{ width: `${100 / 7}%` }} className="p-[3px]">
                <Pressable
                  disabled={!thumb}
                  onPress={
                    thumb
                      ? withAnalyticsPress(PROFILE.stories_calendar.day, () => openStory(day))
                      : undefined
                  }
                  accessibilityRole={thumb ? 'button' : 'text'}
                  accessibilityLabel={
                    thumb ? `Open story from day ${day}` : `Day ${day}, no story`
                  }
                  className={cn(
                    'h-10 items-center justify-center rounded-md',
                    thumb ? 'bg-purple/15 active:opacity-80' : 'bg-transparent'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[12px]',
                      thumb ? 'text-ink' : 'text-ink-mute'
                    )}
                  >
                    {thumb ?? day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* THIS SECTION DOES: how full story storage is this month. */}
      <AnalyticsRegion
        analyticsId={PROFILE.stories_calendar.storage_bar}
        interactive={false}
        className="rounded-card border border-ink-line bg-surface p-4"
      >
        {storage.plan === 'coop' ? (
          <>
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-soft">
                Storage
              </Text>
              <Text
                className={cn(
                  'font-sans-b text-[12px]',
                  usedPct >= 100 ? 'text-coral' : 'text-ink-mute'
                )}
              >
                {storage.usedPct}% used
              </Text>
            </View>
            <Text className="mt-1 font-sans-b text-[15px] text-ink">
              {storage.label || 'Co-op included storage'}
            </Text>
            <View className="mt-2.5">
              <StorageBar usedPct={usedPct} showMeta={false} />
            </View>
            <Text className="mt-2 font-sans-md text-[12px] text-ink-mute">
              {storage.overagePriceLabel ??
                'No 30-day roll-off. Overage is opt-in with price shown first.'}
            </Text>
          </>
        ) : (
          <>
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-soft">
                Storage
              </Text>
              <Text
                className={cn(
                  'font-sans-b text-[12px]',
                  usedPct >= 100 ? 'text-coral' : 'text-ink-mute'
                )}
              >
                Free month · {usedPct}% used
              </Text>
            </View>
            <Text className="mt-1 font-sans-b text-[15px] text-ink">Story storage</Text>
            <View className="mt-2.5">
              <StorageBar usedPct={usedPct} showMeta={false} />
            </View>

            {usedPct >= 100 ? (
              <View className="mt-3">
                <Text className="font-sans-sb text-[13px] text-ink">
                  Your free month is full. Older posts will roll off.
                </Text>
                <View className="mt-3">
                  <ButtonSecondary
                    full
                    size="sm"
                    tone="solid"
                    analyticsId={PROFILE.settings.coop}
                    onPress={() => router.push('/coop')}
                    accessibilityLabel="Join the co-op"
                  >
                    Join the co-op
                  </ButtonSecondary>
                </View>
              </View>
            ) : (
              <Text className="mt-2 font-sans-md text-[12px] text-ink-mute">
                Story media older than 30 days rolls off.
              </Text>
            )}
          </>
        )}
      </AnalyticsRegion>
    </View>
  );
}
