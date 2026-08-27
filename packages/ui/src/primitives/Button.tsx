// ============================================
// WHAT THIS FILE DOES (plain English):
// Bridger's two button styles:
//  - ButtonPrimary: the special 90s-metallic CTA — a SQUARE silver button with a
//    beveled border and a dotted focus frame, saved for key moments (Continue,
//    Join, Send). The bevel is the whole point, so it is never rounded.
//  - ButtonSecondary: everything else — a flat rounded pill, in a few tones
//    (outline / solid / ghost / positive).
// Both handle disabled + loading states and an optional leading icon.
// Pass analyticsId so taps auto-emit through the shared analytics module.
// ============================================
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ACCENTS, useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress, type AnalyticsProps } from '../lib/analytics';

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  /** ACCESSIBILITY: spoken label for VoiceOver / TalkBack */
  accessibilityLabel?: string;
} & AnalyticsProps;

const heights = {
  sm: 'h-9 px-4',
  md: 'h-11 px-5',
  lg: 'h-[52px] px-7'
};
const textSizes = {
  sm: 'text-[13px]',
  md: 'text-[14px]',
  lg: 'text-[15px]'
};

/** Primary CTA — old-Windows metallic. Always SQUARE: the bevel is the point.
 *  PRIVACY/DESIGN: the silver face + dark label stay light in dark mode on
 *  purpose — a dark metallic button disappears on the near-black canvas. */
export function ButtonPrimary({
  children,
  onPress,
  disabled,
  loading,
  full,
  size = 'lg',
  icon,
  className,
  accessibilityLabel,
  analyticsId,
  interactive = true,
  analyticsProps
}: ButtonProps) {
  const inert = disabled || loading;
  // Always dark ink on silver — never theme-flip to cream (unreadable on dark metal)
  const labelColor = '#1C1B16';
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { interactive, analyticsProps })}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      className={cn(
        'relative flex-row items-center justify-center gap-2',
        heights[size],
        full && 'w-full',
        inert
          ? 'rounded-none border-2 border-[#E4E2DA] bg-[#DEDCD2]/50'
          : // Hard-coded light bevel so dark mode cannot wash the CTA into the canvas
            'rounded-none border-2 border-t-white border-l-white border-b-[#A7A498] border-r-[#A7A498] bg-[#DEDCD2] active:bg-[#D3D1C7]',
        className
      )}
    >
      {/* the old-Windows dotted focus frame — always on for the metallic CTA */}
      <View
        pointerEvents="none"
        className={cn(
          'absolute inset-[3px] border border-dashed',
          inert ? 'border-[#1C1B16]/20' : 'border-[#1C1B16]/70'
        )}
      />
      {loading ? <ActivityIndicator size="small" color={labelColor} /> : icon}
      <Text
        className={cn('font-sans-b', textSizes[size])}
        style={{ color: inert ? '#8A877B' : labelColor }}
      >
        {loading ? 'Working' : children}
      </Text>
    </Pressable>
  );
}

/** Everything else stays flat and rounded. */
export function ButtonSecondary({
  children,
  onPress,
  disabled,
  loading,
  full,
  size = 'md',
  icon,
  tone = 'outline',
  className,
  accessibilityLabel,
  analyticsId,
  interactive = true,
  analyticsProps,
  /** Ghost on a pastel onboarding wash — label stays dark in dark mode. */
  onColorWash = false
}: ButtonProps & {
  tone?: 'outline' | 'solid' | 'ghost' | 'positive' | 'light' | 'destructive';
  onColorWash?: boolean;
}) {
  const inert = disabled || loading;
  const c = useThemeColors();

  // "light" = always white pill + near-black label (header chrome that must
  // stay readable in dark mode — text-ink alone flips to cream and vanishes).
  const toneBg =
    tone === 'outline'
      ? 'border border-ink-line bg-surface'
      : tone === 'solid'
        ? 'bg-carbon'
        : tone === 'positive'
          ? 'bg-success'
          : tone === 'destructive'
            ? 'border border-coral bg-surface'
            : tone === 'light'
              // Always-white pill — keep hard white so near-black label stays readable
              // in dark mode (bg-surface would go dark and the label would vanish).
              ? 'border border-ink-line bg-white'
              : ''; // ghost = no fill
  const toneText =
    tone === 'solid' || tone === 'positive'
      ? 'text-white'
      : tone === 'destructive'
        ? 'text-coral'
        : tone === 'light'
          ? 'text-[#1C1B16]'
          : tone === 'ghost' && onColorWash
            ? 'text-onaccent/75'
            : 'text-ink';
  const spinnerColor =
    tone === 'solid' || tone === 'positive'
      ? '#FFFFFF'
      : tone === 'destructive'
        ? ACCENTS.coral.hex
        : tone === 'light'
          ? '#1C1B16'
          : c.ink;

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { interactive, analyticsProps })}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-full',
        heights[size],
        full && 'w-full',
        toneBg,
        inert && 'opacity-40',
        'active:opacity-90',
        className
      )}
    >
      {loading ? <ActivityIndicator size="small" color={spinnerColor} /> : icon}
      <Text className={cn('font-sans-b', textSizes[size], toneText)}>{children}</Text>
    </Pressable>
  );
}
