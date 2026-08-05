// ============================================
// WHAT THIS FILE DOES (plain English):
// Colored co-op portal containers that are NOT plain rounded rectangles.
// Uses Magic Patterns ORGANIC corner shapes (soft / bold / flip / banner) plus
// full accent fills so text stays readable on the dark canvas. Pale tint washes
// were too dull — "tint" and "solid" both use the bright accent color now.
// Put titles/body in portalTitleClass / portalBodyClass so ink does not flip
// cream on a green or yellow card.
// ============================================
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, ORGANIC, cn } from '@bridger/ui';

export type PortalPanelShape = keyof typeof ORGANIC;

type Props = {
  children: React.ReactNode;
  /** Accent color family from DESIGN.md. */
  accent?: Accent;
  /**
   * solid | tint = full accent fill (same look; tint kept as an alias)
   * surface = white/raised with accent left stripe (for dense tables / forms)
   */
  fill?: 'solid' | 'tint' | 'surface';
  shape?: PortalPanelShape;
  className?: string;
  style?: ViewStyle;
};

const SHAPE_CYCLE: PortalPanelShape[] = ['soft', 'bold', 'flip', 'banner'];

/** Pick a repeating organic shape so lists do not look identical. */
export function portalShapeForIndex(index: number): PortalPanelShape {
  return SHAPE_CYCLE[index % SHAPE_CYCLE.length]!;
}

const ACCENT_CYCLE: Accent[] = [
  'teal',
  'purple',
  'amber',
  'coral',
  'blue',
  'pink',
  'green'
];

export function portalAccentForIndex(index: number): Accent {
  return ACCENT_CYCLE[index % ACCENT_CYCLE.length]!;
}

/** Title text color that stays readable on a solid accent panel. */
export function portalTitleClass(accent: Accent = 'teal') {
  return cn('font-sans-b', ACCENTS[accent].text);
}

/** Body / subtitle on a solid accent panel. */
export function portalBodyClass(accent: Accent = 'teal') {
  return cn('font-sans-sb', ACCENTS[accent].text);
}

export function PortalPanel({
  children,
  accent = 'teal',
  fill = 'solid',
  shape = 'soft',
  className,
  style
}: Props) {
  const token = ACCENTS[accent];
  const shapeStyle = ORGANIC[shape];

  // tint and solid are the same bright fill — pale washes were unreadable
  if (fill === 'solid' || fill === 'tint') {
    return (
      <View
        style={[shapeStyle, style]}
        className={cn('overflow-hidden p-5', token.bg, className)}
      >
        {children}
      </View>
    );
  }

  // Surface with a colored left edge — use for charts / inputs that need ink text
  return (
    <View
      style={[shapeStyle, style]}
      className={cn(
        'overflow-hidden border border-ink-line bg-surface p-5',
        className
      )}
    >
      <View
        pointerEvents="none"
        className={cn('absolute bottom-3 left-0 top-3 w-1.5 rounded-r-full', token.bg)}
      />
      <View className="pl-2">{children}</View>
    </View>
  );
}
