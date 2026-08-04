// ============================================
// WHAT THIS FILE DOES (plain English):
// A tiny "what is this?" bubble that floats just under a section title (over
// the content below, not pushing it down). On a phone you tap the title to
// open it; on a computer you can hover or click. The bubble is teal (same
// family as Hikes) with a light shadow, tucked up close to the title so it
// does not sit inline with the widget.
//
// IMPORTANT (web hover): we do NOT put a full-screen Modal under the mouse
// while hovering. A Modal steals the pointer from the title, which fires
// hover-out → close → hover-in → open in a rapid loop. Hover uses an
// absolutely positioned bubble; tap uses a Modal so you can dismiss outside.
// ============================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle
} from 'react-native';
import { trackClick, type AnalyticsBaseProps } from '@bridger/shared';
import { cn } from '../lib/cn';
import { AnalyticsRegion, SurfaceHost, withAnalyticsPress } from '../lib/analytics';
import { ACCENT_HEX } from '../tokens';

const SURFACE = 'section_info_tooltip';
const BUBBLE_MAX_WIDTH = 280;
/** Small delay so moving from the title onto the bubble does not flash-close it. */
const HOVER_CLOSE_MS = 120;
/** How far below the title the floating tip starts (kept tight so it sits near the header). */
const BUBBLE_GAP = 2;
const TEAL = ACCENT_HEX.teal;

type Anchor = { x: number; y: number; width: number; height: number };
type OpenMethod = 'hover' | 'tap';

export function InfoPopover({
  description,
  title,
  infoAnalyticsId,
  dismissAnalyticsId,
  bodyAnalyticsId,
  parentScreen,
  section,
  analyticsProps,
  children,
  className
}: {
  /** The short explanation shown inside the bubble. */
  description: string;
  /** Used for the accessibility label ("About Stories"). */
  title: string;
  /** Taxonomy id for the open trigger (`*.*.info`). */
  infoAnalyticsId: string;
  /** Taxonomy id for dismissing the bubble. */
  dismissAnalyticsId: string;
  /** Taxonomy id for the bubble body (dead-click). */
  bodyAnalyticsId: string;
  /** Screen that launched this popover (home, friends, events, discover…). */
  parentScreen: string;
  /** Which section this tip is about (stamped on the click for slicing). */
  section?: string;
  /** Extra analytics properties (e.g. tier on Friends roster headers). */
  analyticsProps?: AnalyticsBaseProps;
  /** The tappable / hoverable title (or title + icon). */
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<OpenMethod | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const triggerRef = useRef<View>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  /** Mirrors `method` so hover-close timers always see the latest value. */
  const methodRef = useRef<OpenMethod | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovering = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      sub?.remove?.();
      if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    };
  }, []);

  // Fade the bubble in/out, skipped when the user prefers reduced motion.
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(opacity, {
      toValue: open ? 1 : 0,
      duration: open ? 140 : 100,
      useNativeDriver: true
    }).start();
  }, [open, opacity, reduceMotion]);

  const emitOpen = useCallback(
    (openMethod: OpenMethod) => {
      trackClick(infoAnalyticsId, {
        method: openMethod,
        section,
        parent_screen: parentScreen,
        surface: SURFACE,
        ...analyticsProps
      });
    },
    [analyticsProps, infoAnalyticsId, parentScreen, section]
  );

  const close = useCallback(() => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    hovering.current = false;
    methodRef.current = null;
    setOpen(false);
    setMethod(null);
  }, []);

  const dismiss = useCallback(() => {
    trackClick(dismissAnalyticsId, {
      surface: SURFACE,
      parent_screen: parentScreen,
      section
    });
    close();
  }, [close, dismissAnalyticsId, parentScreen, section]);

  /** Schedule a hover close; cancelled if the pointer comes back quickly. */
  const scheduleHoverClose = useCallback(() => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => {
      hoverCloseTimer.current = null;
      if (!hovering.current && methodRef.current !== 'tap') {
        close();
      }
    }, HOVER_CLOSE_MS);
  }, [close]);

  const openWith = useCallback(
    (openMethod: OpenMethod) => {
      if (hoverCloseTimer.current) {
        clearTimeout(hoverCloseTimer.current);
        hoverCloseTimer.current = null;
      }
      const finish = (a: Anchor) => {
        setAnchor(a);
        methodRef.current = openMethod;
        setMethod(openMethod);
        setOpen(true);
        emitOpen(openMethod);
      };
      const node = triggerRef.current;
      if (!node) {
        finish({ x: 0, y: 0, width: 0, height: 0 });
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        finish({ x, y, width, height });
      });
    },
    [emitOpen]
  );

  const onTap = withAnalyticsPress(undefined, () => {
    if (open && methodRef.current === 'tap') {
      dismiss();
      return;
    }
    openWith('tap');
  });

  // --- WEB HOVER: open on enter; delay-close on leave (title OR bubble) ---
  const keepHoverOpen = useCallback(() => {
    hovering.current = true;
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    if (!open) openWith('hover');
  }, [open, openWith]);

  const leaveHover = useCallback(() => {
    hovering.current = false;
    if (methodRef.current !== 'tap') scheduleHoverClose();
  }, [scheduleHoverClose]);

  const webHoverProps =
    Platform.OS === 'web'
      ? { onHoverIn: keepHoverOpen, onHoverOut: leaveHover }
      : {};

  const bubbleBody = (
    <AnalyticsRegion
      analyticsId={bodyAnalyticsId}
      interactive={false}
      accessibilityLabel={description}
      className="rounded-2xl border border-teal bg-[#E6F7F1] px-3.5 py-3 dark:bg-[#14352C]"
      style={BUBBLE_SHADOW}
    >
      <Text className="font-sans-sb text-[13px] leading-[18px] text-ink">
        {description}
      </Text>
    </AnalyticsRegion>
  );

  const fadeStyle = {
    opacity,
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [-4, 0]
            })
      }
    ]
  };

  return (
    <>
      {/* Relative wrapper: floating tip anchors under the title without a Modal on hover */}
      <View className={cn('relative', className)} {...webHoverProps}>
        <Pressable
          ref={triggerRef}
          onPress={onTap}
          accessibilityRole="button"
          accessibilityLabel={`About ${title}`}
          accessibilityHint="Shows a short explanation of this section"
          accessibilityState={{ expanded: open }}
          hitSlop={8}
          className="min-h-[44px] justify-center"
        >
          {children}
        </Pressable>

        {/* HOVER path: floats over the widget, tucked up close under the title */}
        {open && method === 'hover' ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              {
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: BUBBLE_GAP,
                maxWidth: BUBBLE_MAX_WIDTH,
                zIndex: 50
              } as ViewStyle,
              fadeStyle
            ]}
          >
            {bubbleBody}
          </Animated.View>
        ) : null}
      </View>

      <SurfaceHost surface={SURFACE} parentScreen={parentScreen} open={open}>
        {/* TAP path: Modal + outside tap to dismiss (phones + click) */}
        {method === 'tap' ? (
          <Modal
            visible={open}
            transparent
            animationType="none"
            onRequestClose={dismiss}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={withAnalyticsPress(dismissAnalyticsId, close, {
                interactive: true,
                analyticsProps: {
                  surface: SURFACE,
                  parent_screen: parentScreen,
                  section
                }
              })}
              className="absolute inset-0"
            />
            {anchor ? (
              <Animated.View
                pointerEvents="box-none"
                style={[
                  {
                    position: 'absolute',
                    top: anchor.y + anchor.height + BUBBLE_GAP,
                    left: Math.max(12, anchor.x),
                    maxWidth: BUBBLE_MAX_WIDTH,
                    zIndex: 50
                  },
                  fadeStyle
                ]}
              >
                {bubbleBody}
              </Animated.View>
            ) : null}
          </Modal>
        ) : null}
      </SurfaceHost>
    </>
  );
}

/** Soft lift so the tip reads as a card above the canvas (teal-tinted). */
const BUBBLE_SHADOW = Platform.select({
  ios: {
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6
  },
  android: {
    elevation: 3
  },
  default: {
    boxShadow: `0 2px 8px ${TEAL}33`
  }
});
