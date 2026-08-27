// ============================================
// WHAT THIS FILE DOES (plain English):
// The "Repeats" controls on Create event Details: weekly / monthly / yearly,
// which days, and when the series ends. Builds a small rule object the server
// stores; never logs the schedule text in analytics.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CREATE_EVENT,
  formatRecurrenceLabel,
  isoWeekday,
  type EventRecurrence
} from '@bridger/shared';
import { TextField, Toggle, cn, withAnalyticsPress } from '@bridger/ui';

const WEEKDAYS: Array<{ n: number; label: string }> = [
  { n: 1, label: 'M' },
  { n: 2, label: 'T' },
  { n: 3, label: 'W' },
  { n: 4, label: 'T' },
  { n: 5, label: 'F' },
  { n: 6, label: 'S' },
  { n: 7, label: 'S' }
];

const FREQS: Array<EventRecurrence['freq']> = ['weekly', 'monthly', 'yearly'];
const SETPOS: Array<{ v: number; label: string }> = [
  { v: 1, label: '1st' },
  { v: 2, label: '2nd' },
  { v: 3, label: '3rd' },
  { v: 4, label: '4th' },
  { v: -1, label: 'Last' }
];

type Ends = 'never' | 'until' | 'count';

function endsMode(r: EventRecurrence | null): Ends {
  if (!r) return 'never';
  if (r.until) return 'until';
  if (r.count != null) return 'count';
  return 'never';
}

function seedFromDay(dayIso: string): EventRecurrence {
  const d = new Date(`${dayIso}T12:00:00.000Z`);
  return {
    freq: 'weekly',
    interval: 1,
    byWeekday: [isoWeekday(d)]
  };
}

export function RecurrenceFields({
  repeats,
  recurrence,
  dayIso,
  onChange
}: {
  repeats: boolean;
  recurrence: EventRecurrence | null;
  dayIso: string;
  onChange: (patch: {
    repeats?: boolean;
    recurrence?: EventRecurrence | null;
  }) => void;
}) {
  const rule = recurrence ?? seedFromDay(dayIso);
  const monthlyMode =
    typeof rule.byMonthday === 'number' ? 'day' : 'nth';
  const ends = endsMode(rule);

  function setRule(next: EventRecurrence) {
    onChange({ recurrence: next });
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between rounded-card border border-ink-line px-3.5 py-3">
        <Text className="font-sans-b text-[14px] text-ink">Repeats</Text>
        <Toggle
          checked={repeats}
          onChange={(v) =>
            onChange({
              repeats: v,
              recurrence: v ? seedFromDay(dayIso) : null
            })
          }
          label="Repeats"
          analyticsId={CREATE_EVENT.details.repeats_toggle}
        />
      </View>

      {repeats ? (
        <View className="gap-3 rounded-card border border-ink-line bg-surface p-3.5">
          {/* Frequency */}
          <View accessibilityRole="tablist" className="flex-row gap-2">
            {FREQS.map((f) => {
              const on = rule.freq === f;
              return (
                <Pressable
                  key={f}
                  onPress={withAnalyticsPress(CREATE_EVENT.details.repeats_freq, () => {
                    if (f === 'weekly') {
                      setRule({
                        freq: 'weekly',
                        interval: rule.interval || 1,
                        byWeekday: rule.byWeekday?.length
                          ? rule.byWeekday
                          : seedFromDay(dayIso).byWeekday,
                        until: rule.until,
                        count: rule.count
                      });
                    } else if (f === 'monthly') {
                      setRule({
                        freq: 'monthly',
                        interval: rule.interval || 1,
                        byMonthday: Number(dayIso.slice(8, 10)) || 1,
                        until: rule.until,
                        count: rule.count
                      });
                    } else {
                      setRule({
                        freq: 'yearly',
                        interval: rule.interval || 1,
                        until: rule.until,
                        count: rule.count
                      });
                    }
                  })}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={f}
                  className={cn(
                    'min-h-[40px] flex-1 items-center justify-center rounded-full px-2',
                    on ? 'bg-ink' : 'border border-ink-line'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[12px] capitalize',
                      on ? 'text-canvas' : 'text-ink'
                    )}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Interval */}
          <TextField
            label={
              rule.freq === 'weekly'
                ? 'Every N weeks'
                : rule.freq === 'monthly'
                  ? 'Every N months'
                  : 'Every N years'
            }
            value={String(rule.interval || 1)}
            onChange={(v) => {
              const n = Math.max(1, Math.min(52, parseInt(v.replace(/\D/g, ''), 10) || 1));
              setRule({ ...rule, interval: n });
            }}
            analyticsId={CREATE_EVENT.details.repeats_interval}
          />

          {rule.freq === 'weekly' ? (
            <View>
              <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">
                On these days
              </Text>
              <View className="flex-row gap-1.5">
                {WEEKDAYS.map((w) => {
                  const on = (rule.byWeekday ?? []).includes(w.n);
                  return (
                    <Pressable
                      key={w.n}
                      onPress={withAnalyticsPress(
                        CREATE_EVENT.details.repeats_weekday,
                        () => {
                          const cur = new Set(rule.byWeekday ?? []);
                          if (cur.has(w.n)) cur.delete(w.n);
                          else cur.add(w.n);
                          const next = [...cur].sort((a, b) => a - b);
                          setRule({
                            ...rule,
                            byWeekday: next.length ? next : [w.n]
                          });
                        }
                      )}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={w.label}
                      className={cn(
                        'h-9 w-9 items-center justify-center rounded-full',
                        on ? 'bg-ink' : 'border border-ink-line'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          on ? 'text-canvas' : 'text-ink'
                        )}
                      >
                        {w.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {rule.freq === 'monthly' ? (
            <View className="gap-2">
              <View className="flex-row gap-2">
                {(
                  [
                    ['day', 'On day'],
                    ['nth', 'On the']
                  ] as const
                ).map(([key, label]) => {
                  const on = monthlyMode === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={withAnalyticsPress(
                        CREATE_EVENT.details.repeats_monthly_mode,
                        () => {
                          if (key === 'day') {
                            setRule({
                              freq: 'monthly',
                              interval: rule.interval || 1,
                              byMonthday: Number(dayIso.slice(8, 10)) || 1,
                              until: rule.until,
                              count: rule.count
                            });
                          } else {
                            setRule({
                              freq: 'monthly',
                              interval: rule.interval || 1,
                              bySetpos: 1,
                              byWeekday: [
                                isoWeekday(new Date(`${dayIso}T12:00:00.000Z`))
                              ],
                              until: rule.until,
                              count: rule.count
                            });
                          }
                        }
                      )}
                      className={cn(
                        'min-h-[40px] flex-1 items-center justify-center rounded-full',
                        on ? 'bg-ink' : 'border border-ink-line'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          on ? 'text-canvas' : 'text-ink'
                        )}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {monthlyMode === 'day' ? (
                <TextField
                  label="Day of month"
                  value={String(rule.byMonthday ?? 1)}
                  onChange={(v) => {
                    const n = Math.max(
                      1,
                      Math.min(31, parseInt(v.replace(/\D/g, ''), 10) || 1)
                    );
                    setRule({
                      freq: 'monthly',
                      interval: rule.interval || 1,
                      byMonthday: n,
                      until: rule.until,
                      count: rule.count
                    });
                  }}
                  analyticsId={CREATE_EVENT.details.repeats_monthday}
                />
              ) : (
                <View className="gap-2">
                  <View className="flex-row flex-wrap gap-1.5">
                    {SETPOS.map((s) => {
                      const on = rule.bySetpos === s.v;
                      return (
                        <Pressable
                          key={s.v}
                          onPress={withAnalyticsPress(
                            CREATE_EVENT.details.repeats_setpos,
                            () =>
                              setRule({
                                ...rule,
                                freq: 'monthly',
                                bySetpos: s.v,
                                byWeekday: rule.byWeekday?.length
                                  ? rule.byWeekday
                                  : [1],
                                byMonthday: undefined
                              })
                          )}
                          className={cn(
                            'min-h-[36px] rounded-full px-3',
                            'items-center justify-center',
                            on ? 'bg-ink' : 'border border-ink-line'
                          )}
                        >
                          <Text
                            className={cn(
                              'font-sans-b text-[12px]',
                              on ? 'text-canvas' : 'text-ink'
                            )}
                          >
                            {s.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View className="flex-row gap-1.5">
                    {WEEKDAYS.map((w) => {
                      const on = (rule.byWeekday ?? [])[0] === w.n;
                      return (
                        <Pressable
                          key={w.n}
                          onPress={withAnalyticsPress(
                            CREATE_EVENT.details.repeats_weekday,
                            () =>
                              setRule({
                                ...rule,
                                freq: 'monthly',
                                bySetpos: rule.bySetpos ?? 1,
                                byWeekday: [w.n],
                                byMonthday: undefined
                              })
                          )}
                          className={cn(
                            'h-9 w-9 items-center justify-center rounded-full',
                            on ? 'bg-ink' : 'border border-ink-line'
                          )}
                        >
                          <Text
                            className={cn(
                              'font-sans-b text-[12px]',
                              on ? 'text-canvas' : 'text-ink'
                            )}
                          >
                            {w.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          ) : null}

          {/* Ends */}
          <View>
            <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Ends</Text>
            <View className="mb-2 flex-row gap-2">
              {(
                [
                  ['never', 'Never'],
                  ['until', 'On date'],
                  ['count', 'After']
                ] as const
              ).map(([key, label]) => {
                const on = ends === key;
                return (
                  <Pressable
                    key={key}
                    onPress={withAnalyticsPress(CREATE_EVENT.details.repeats_ends, () => {
                      if (key === 'never') {
                        const { until: _u, count: _c, ...rest } = rule;
                        setRule(rest);
                      } else if (key === 'until') {
                        const { count: _c, ...rest } = rule;
                        setRule({ ...rest, until: dayIso });
                      } else {
                        const { until: _u, ...rest } = rule;
                        setRule({ ...rest, count: 10 });
                      }
                    })}
                    className={cn(
                      'min-h-[36px] flex-1 items-center justify-center rounded-full',
                      on ? 'bg-ink' : 'border border-ink-line'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-sans-b text-[11px]',
                        on ? 'text-canvas' : 'text-ink'
                      )}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {ends === 'until' ? (
              <TextField
                label="End date (YYYY-MM-DD)"
                value={rule.until ?? ''}
                onChange={(until) => setRule({ ...rule, until, count: undefined })}
                analyticsId={CREATE_EVENT.details.repeats_until}
                placeholder={dayIso}
              />
            ) : null}
            {ends === 'count' ? (
              <TextField
                label="Number of times"
                value={String(rule.count ?? 10)}
                onChange={(v) => {
                  const n = Math.max(
                    2,
                    Math.min(100, parseInt(v.replace(/\D/g, ''), 10) || 10)
                  );
                  setRule({ ...rule, count: n, until: undefined });
                }}
                analyticsId={CREATE_EVENT.details.repeats_count}
              />
            ) : null}
          </View>

          <Text className="font-sans-sb text-[12px] text-ink-mute">
            {formatRecurrenceLabel(rule)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
