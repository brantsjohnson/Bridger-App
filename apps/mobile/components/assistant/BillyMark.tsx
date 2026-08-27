// ============================================
// WHAT THIS FILE DOES (plain English):
// Billy's face mark: two logo wedges that read as eyes. The black pupils sit
// near the bottom of each white eye and glance around slowly (up, left, right).
// He also blinks. Under Reduce Motion the face stays still.
//
// ACCESSIBILITY: accessibilityLabel names the mood; motion respects reduce-motion.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ASSISTANT, HOME } from '@bridger/shared';
import { AnalyticsRegion, cn, useReduceMotion } from '@bridger/ui';
import { BILLY_PURPLE } from './billy-theme';

export type MarkMood =
  | 'resting'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'excited';

const SIZES = { xs: 20, sm: 28, md: 36, lg: 56, xl: 80 } as const;

/**
 * Home seat for each pupil inside one eye's local coordinates.
 * Low in the white wedge so the face reads as looking at you; motion then
 * walks the dots up / left / right without leaving the white.
 */
const PUPIL_HOME = { cx: 10, cy: 28 };
const PUPIL_R = 3.9;

type Props = {
  mood?: MarkMood;
  size?: keyof typeof SIZES;
  /**
   * When true, wraps the eyes in a solid purple tile so the face has a home
   * (never coral / orange). False only for rare bare uses.
   */
  tile?: boolean;
  className?: string;
  /** Where this mark lives for dead_click tagging. */
  surface?: 'home' | 'assistant' | 'island';
};

export function BillyMark({
  mood = 'resting',
  size = 'md',
  tile = true,
  className,
  surface = 'assistant'
}: Props) {
  const reduce = useReduceMotion();
  const px = SIZES[size];
  const blink = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  // THIS SECTION DOES: how far the pupils slide from their bottom home seat (px)
  const pupilX = useRef(new Animated.Value(0)).current;
  const pupilY = useRef(new Animated.Value(0)).current;

  const svgW = px * 0.72;
  const svgH = px * 0.66;
  const scaleX = svgW / 44;
  const scaleY = svgH / 40;

  // THIS SECTION DOES: calm blink + rare glances (never a panic dart)
  useEffect(() => {
    if (reduce) {
      blink.setValue(1);
      bounce.setValue(0);
      pupilX.setValue(0);
      pupilY.setValue(0);
      return;
    }
    const anims: Animated.CompositeAnimation[] = [];
    const ease = Easing.inOut(Easing.quad);
    const look = (x: number, y: number, duration: number) =>
      Animated.parallel([
        Animated.timing(pupilX, {
          toValue: x * scaleX,
          duration,
          easing: ease,
          useNativeDriver: true
        }),
        Animated.timing(pupilY, {
          toValue: y * scaleY,
          duration,
          easing: ease,
          useNativeDriver: true
        })
      ]);

    // Blink every few seconds in every mood so he never stares forever
    anims.push(
      Animated.loop(
        Animated.sequence([
          Animated.delay(mood === 'thinking' ? 2800 : 3600),
          Animated.timing(blink, {
            toValue: 0.12,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true
          }),
          // Occasional double-blink
          Animated.delay(80),
          Animated.timing(blink, {
            toValue: 0.12,
            duration: 90,
            useNativeDriver: true
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true
          }),
          Animated.delay(mood === 'excited' ? 1800 : 4200)
        ])
      )
    );

    if (mood === 'excited') {
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounce, {
              toValue: -1.6,
              duration: 520,
              easing: ease,
              useNativeDriver: true
            }),
            Animated.timing(bounce, {
              toValue: 0,
              duration: 520,
              useNativeDriver: true
            }),
            Animated.delay(900)
          ])
        )
      );
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(1400),
            look(1.6, -4, 900),
            look(0, 0, 1000),
            Animated.delay(2200)
          ])
        )
      );
    } else if (mood === 'thinking') {
      // Slow search up, then rest — not a constant dart
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(800),
            look(1.8, -12, 1400),
            Animated.delay(600),
            look(-1.6, -14, 1600),
            Animated.delay(500),
            look(0, -8, 1200),
            Animated.delay(400),
            look(0, 0, 1400),
            Animated.delay(2800)
          ])
        )
      );
    } else if (mood === 'listening') {
      // Almost still: tiny track toward you, long pauses
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(1600),
            look(0.8, -2, 1200),
            look(0, 0, 1400),
            Animated.delay(3200),
            look(-0.8, -1.5, 1200),
            look(0, 0, 1400),
            Animated.delay(4000)
          ])
        )
      );
    } else if (mood === 'speaking') {
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounce, {
              toValue: -0.6,
              duration: 600,
              useNativeDriver: true
            }),
            Animated.timing(bounce, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true
            }),
            Animated.delay(400)
          ])
        )
      );
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(2000),
            look(1, -2, 1000),
            look(0, 0, 1100),
            Animated.delay(3000)
          ])
        )
      );
    } else {
      // Resting: long still stretches, then a soft glance
      anims.push(
        Animated.loop(
          Animated.sequence([
            Animated.delay(4500),
            look(1.8, -1.2, 1400),
            look(0, 0, 1200),
            Animated.delay(5000),
            look(-1.8, -1.2, 1400),
            look(0, 0, 1200),
            Animated.delay(6000),
            look(1, -7, 1600),
            look(0, 0, 1400),
            Animated.delay(4000)
          ])
        )
      );
    }

    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
      pupilX.setValue(0);
      pupilY.setValue(0);
      blink.setValue(1);
      bounce.setValue(0);
    };
  }, [mood, reduce, blink, bounce, pupilX, pupilY, scaleX, scaleY]);

  const eyeFill = '#FFFFFF';
  const analyticsId =
    surface === 'home'
      ? HOME.assistant.mark
      : surface === 'island'
        ? ASSISTANT.island.mark
        : ASSISTANT.chat.mark;

  const pupilPx = PUPIL_R * 2 * scaleX;
  const leftHomeX = (2 + PUPIL_HOME.cx) * scaleX - pupilPx / 2;
  const rightHomeX = (24 + PUPIL_HOME.cx) * scaleX - pupilPx / 2;
  const homeY = PUPIL_HOME.cy * scaleY - pupilPx / 2;

  return (
    <AnalyticsRegion analyticsId={analyticsId} interactive={false}>
      <Animated.View
        accessibilityRole="image"
        accessibilityLabel={`Billy, ${mood}`}
        style={{
          width: px,
          height: px,
          transform: [{ translateY: bounce }],
          borderRadius: px * 0.28,
          backgroundColor: tile ? BILLY_PURPLE : 'transparent',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className={cn('shrink-0', className)}
      >
        <Animated.View style={{ transform: [{ scaleY: blink }] }}>
          <Animated.View style={{ width: svgW, height: svgH }}>
            <Svg width={svgW} height={svgH} viewBox="0 0 44 40">
              <Path
                d="M0.6 4.2C0.6 2.1 2.2 0.4 4.3 0.3 8.1 0.1 11.9 0.1 15.7 0.3c2.1 0.1 3.7 1.8 3.7 3.9 0 9.6-0.4 19.1-1.2 28.7-0.2 2-1.9 3.6-4 3.6h-8.7c-2.1 0-3.8-1.6-4-3.6C0.7 23.3 0.3 13.8 0.6 4.2Z"
                fill={eyeFill}
                transform="translate(2 0)"
              />
              <Path
                d="M0.6 4.2C0.6 2.1 2.2 0.4 4.3 0.3 8.1 0.1 11.9 0.1 15.7 0.3c2.1 0.1 3.7 1.8 3.7 3.9 0 9.6-0.4 19.1-1.2 28.7-0.2 2-1.9 3.6-4 3.6h-8.7c-2.1 0-3.8-1.6-4-3.6C0.7 23.3 0.3 13.8 0.6 4.2Z"
                fill={eyeFill}
                transform="translate(24 0)"
              />
              {reduce ? (
                <>
                  <Circle
                    cx={2 + PUPIL_HOME.cx}
                    cy={PUPIL_HOME.cy}
                    r={PUPIL_R}
                    fill="#1C1B16"
                  />
                  <Circle
                    cx={24 + PUPIL_HOME.cx}
                    cy={PUPIL_HOME.cy}
                    r={PUPIL_R}
                    fill="#1C1B16"
                  />
                </>
              ) : null}
            </Svg>
            {!reduce ? (
              <>
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: leftHomeX,
                    top: homeY,
                    width: pupilPx,
                    height: pupilPx,
                    borderRadius: pupilPx / 2,
                    backgroundColor: '#1C1B16',
                    transform: [{ translateX: pupilX }, { translateY: pupilY }]
                  }}
                />
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: rightHomeX,
                    top: homeY,
                    width: pupilPx,
                    height: pupilPx,
                    borderRadius: pupilPx / 2,
                    backgroundColor: '#1C1B16',
                    transform: [{ translateX: pupilX }, { translateY: pupilY }]
                  }}
                />
              </>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </AnalyticsRegion>
  );
}
