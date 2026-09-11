// ============================================
// WHAT THIS FILE DOES (plain English):
// "Who sees this" — the concentric audience picker used when you post an
// Update, contribute to an activity, or share anything. Picking a wider circle
// lights the tighter ones too (Close ⊂ Friends ⊂ Everyone). Named groups only
// show when the person actually has some. Tone "dark" is for the capture
// composer.
// PRIVACY: `allowOnlyMe` adds an "Only me" choice (Scrapbook pages). It maps
// to DB tier `none`, which can_view() already treats as owner-only.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { cn } from '../lib/cn';
import { withAnalyticsPress, type AnalyticsProps } from '../lib/analytics';
import { useThemeColors } from '../tokens';

export type AudienceLevel = 'only_me' | 'close' | 'friend' | 'everyone';

const LEVELS: Array<{ id: AudienceLevel; label: string }> = [
  { id: 'close', label: 'Close friends' },
  { id: 'friend', label: 'Friends' },
  { id: 'everyone', label: 'Everyone' }
];

/** The owner-only choice, shown first when a caller opts in. */
const ONLY_ME: { id: AudienceLevel; label: string } = { id: 'only_me', label: 'Only me' };

/** Concentric: picking a wider circle lights the tighter ones too. */
export function reachOf(level: AudienceLevel): AudienceLevel[] {
  if (level === 'only_me') return ['only_me'];
  if (level === 'close') return ['close'];
  if (level === 'friend') return ['close', 'friend'];
  return ['close', 'friend', 'everyone'];
}

type Props = {
  value: AudienceLevel;
  onChange: (v: AudienceLevel) => void;
  /** on a dark capture sheet, or on a normal surface */
  tone?: 'light' | 'dark';
  /** co-op custom groups, shown only when the person has at least one */
  groups?: string[];
  /** the selected custom group, which replaces the tier choice */
  group?: string | null;
  onGroupChange?: (g: string | null) => void;
  /** Show the "Only me" choice (Scrapbook pages). Off for shared activities. */
  allowOnlyMe?: boolean;
  className?: string;
  /** Optional per-level analytics ids (close / friends / everyone) */
  levelAnalyticsIds?: Partial<Record<AudienceLevel, string>>;
} & AnalyticsProps;

/**
 * One sharing control for everything you post: stories, polls, activity
 * contributions. Tiers are concentric and shown as multi-select so the reach
 * is always visible.
 */
export function AudiencePicker({
  value,
  onChange,
  tone = 'light',
  groups = [],
  group = null,
  onGroupChange,
  allowOnlyMe = false,
  className,
  levelAnalyticsIds
}: Props) {
  const c = useThemeColors();
  const lit = group ? [] : reachOf(value);
  const dark = tone === 'dark';
  const levels = allowOnlyMe ? [ONLY_ME, ...LEVELS] : LEVELS;

  return (
    <View className={className}>
      <Text
        className={cn(
          'mb-2 font-sans-b text-[11px] uppercase tracking-wide',
          dark ? 'text-white/60' : 'text-ink-mute'
        )}
      >
        Who sees this
      </Text>

      <View className="flex-row gap-2">
        {levels.map((l) => {
          const on = lit.includes(l.id);
          const selected = !group && value === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={withAnalyticsPress(levelAnalyticsIds?.[l.id], () => {
                onGroupChange?.(null);
                onChange(l.id);
              })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={l.label}
              className={cn(
                'min-h-[44px] flex-1 items-center justify-center rounded-2xl border px-2 py-2.5',
                dark
                  ? on
                    ? 'border-white bg-white/15'
                    : 'border-white/25'
                  : on
                    ? 'border-ink bg-green'
                    : 'border-ink-line bg-surface'
              )}
            >
              <View className="flex-row items-center gap-1.5">
                <View
                  className={cn(
                    'h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    on
                      ? dark
                        ? 'border-white bg-white'
                        : 'border-ink bg-ink'
                      : dark
                        ? 'border-white/40'
                        : 'border-ink-line'
                  )}
                >
                  {on ? (
                    <CheckIcon
                      size={10}
                      color={dark ? c.ink : '#FFFFFF'}
                      strokeWidth={4}
                    />
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  className={cn(
                    'font-sans-b text-[12px]',
                    dark ? (on ? 'text-white' : 'text-white/60') : on ? 'text-ink' : 'text-ink-mute'
                  )}
                >
                  {l.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Concentric reach: Friends lights Close too. One choice is stored. */}
      <Text
        className={cn(
          'mt-2 font-sans-sb text-[12px]',
          dark ? 'text-white/55' : 'text-ink-mute'
        )}
      >
        Wider circles include closer ones. Tap one choice.
      </Text>

      {/* Groups only when they have some. Empty = no "Or a group" section. */}
      {groups.length > 0 ? (
        <View>
          <Text
            className={cn(
              'mb-1.5 mt-3 font-sans-b text-[11px] uppercase tracking-wide',
              dark ? 'text-white/50' : 'text-ink-mute'
            )}
          >
            Or a group
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {groups.map((g) => {
              const on = group === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => onGroupChange?.(on ? null : g)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Group ${g}`}
                  className={cn(
                    'min-h-[36px] rounded-full border px-3 py-1.5',
                    on
                      ? dark
                        ? 'border-white bg-white'
                        : 'border-ink bg-green'
                      : dark
                        ? 'border-white/30'
                        : 'border-ink-line bg-surface'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[12px]',
                      on
                        ? 'text-ink'
                        : dark
                          ? 'text-white/75'
                          : 'text-ink-soft'
                    )}
                  >
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
