// ============================================
// WHAT THIS FILE DOES (plain English):
// The flat rounded container everything sits in. Two flavors:
//  - Card: a plain white (dark: raised) box with a hairline border, no shadow.
//  - ColorCard: the same box but filled with one of the playful accent colors
//    (or a pale "tint" version). This is how color enters the app — through
//    cards and chips, never the whole background (DESIGN.md).
// Pass onPress to make either one tappable. Pass analyticsId so the tap is
// measured (or interactive={false} for dead_click on non-action card bodies).
// ============================================
import React from 'react';
import { Pressable, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress, type AnalyticsProps } from '../lib/analytics';

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
} & AnalyticsProps;

/** Flat rounded container: opaque surface on the calm canvas. Hairline, never a shadow. */
export function Card({
  children,
  className,
  onPress,
  analyticsId,
  interactive,
  analyticsProps
}: BaseProps) {
  const classes = cn('rounded-card border border-ink-line bg-surface p-5', className);
  const isInteractive = interactive ?? Boolean(onPress);

  if (onPress || analyticsId) {
    return (
      <Pressable
        onPress={withAnalyticsPress(analyticsId, onPress, {
          interactive: isInteractive,
          analyticsProps
        })}
        className={cn(classes, onPress && 'active:opacity-90')}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={classes}>{children}</View>;
}

/** Solid color variant — the accent delivery vehicle. Tints are fully opaque. */
export function ColorCard({
  accent,
  children,
  className,
  onPress,
  tint = false,
  analyticsId,
  interactive,
  analyticsProps
}: BaseProps & { accent: Accent; tint?: boolean }) {
  const token = ACCENTS[accent];
  const classes = cn('rounded-card p-5', tint ? token.tintSolid : token.bg, className);
  const isInteractive = interactive ?? Boolean(onPress);

  if (onPress || analyticsId) {
    return (
      <Pressable
        onPress={withAnalyticsPress(analyticsId, onPress, {
          interactive: isInteractive,
          analyticsProps
        })}
        className={cn(classes, onPress && 'active:opacity-90')}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={classes}>{children}</View>;
}
