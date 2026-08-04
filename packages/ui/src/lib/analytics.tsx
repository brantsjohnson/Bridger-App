// ============================================
// WHAT THIS FILE DOES (plain English):
// Helpers so every Bridger UI primitive can auto-emit analytics. Pass an
// analyticsId (screen.section.element from the taxonomy). Interactive taps
// log click; regions tagged interactive={false} log dead_click when tapped.
// Sheets use SurfaceHost so open/dismiss + dwell_ms are recorded separately
// from the screen behind them.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Pressable, type GestureResponderEvent, type ViewProps } from 'react-native';
import {
  dismissSurface,
  openSurface,
  trackClick,
  trackDeadClick,
  type AnalyticsBaseProps
} from '@bridger/shared';

/** Props every interactive (or dead-click) primitive should accept. */
export type AnalyticsProps = {
  /** Canonical `screen.section.element` from ANALYTICS-TAXONOMY.md */
  analyticsId?: string;
  /**
   * false = this region is not meant to do anything; a tap logs dead_click.
   * Defaults to true when onPress is present, false when analyticsId alone.
   */
  interactive?: boolean;
  /** Extra properties (method, page_index, …) merged into the event. */
  analyticsProps?: AnalyticsBaseProps;
};

/**
 * Wrap an onPress so the click (or dead_click) fires through the shared
 * analytics module before the real handler runs.
 */
export function withAnalyticsPress(
  analyticsId: string | undefined,
  onPress: ((e?: GestureResponderEvent) => void) | undefined,
  options?: {
    interactive?: boolean;
    analyticsProps?: AnalyticsBaseProps;
  }
): ((e: GestureResponderEvent) => void) | undefined {
  if (!analyticsId && !onPress) return undefined;
  return (e: GestureResponderEvent) => {
    if (analyticsId) {
      const interactive = options?.interactive ?? true;
      if (interactive) {
        trackClick(analyticsId, options?.analyticsProps);
      } else {
        trackDeadClick(analyticsId, options?.analyticsProps);
      }
    }
    onPress?.(e);
  };
}

/**
 * A semantic region that is not a button but should still be measured.
 * Tap → dead_click. Use on headers, sticky-note bodies, About Me, empty states.
 */
export function AnalyticsRegion({
  analyticsId,
  interactive = false,
  analyticsProps,
  children,
  ...rest
}: AnalyticsProps &
  ViewProps & {
    children?: React.ReactNode;
    className?: string;
    accessibilityLabel?: string;
  }) {
  if (!analyticsId) {
    return <>{children}</>;
  }

  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, undefined, {
        interactive,
        analyticsProps
      })}
      accessibilityRole={interactive ? 'button' : 'text'}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/**
 * Mount inside a Sheet / modal. Emits surface_opened on mount and
 * surface_dismissed (with dwell_ms) when unmounted without actComplete.
 */
export function SurfaceHost({
  surface,
  parentScreen,
  open,
  children
}: {
  surface: string;
  parentScreen?: string;
  open: boolean;
  children?: React.ReactNode;
}) {
  const acted = useRef(false);

  useEffect(() => {
    if (!open) return;
    acted.current = false;
    openSurface(surface, parentScreen);
    return () => {
      if (!acted.current) {
        dismissSurface(surface);
      }
    };
  }, [open, surface, parentScreen]);

  // Expose a way for children to mark "we completed an action, don't count dismiss"
  return (
    <SurfaceActContext.Provider
      value={{
        markActed: () => {
          acted.current = true;
        }
      }}
    >
      {children}
    </SurfaceActContext.Provider>
  );
}

type SurfaceActValue = { markActed: () => void };
const SurfaceActContext = React.createContext<SurfaceActValue>({
  markActed: () => undefined
});

export function useSurfaceAct(): SurfaceActValue {
  return React.useContext(SurfaceActContext);
}
