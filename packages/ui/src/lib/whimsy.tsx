// ============================================
// WHAT THIS FILE DOES (plain English):
// Bridger's little bits of life. These are the small animations that make the
// app feel awake instead of like a spreadsheet:
//
//   useReduceMotion — asks the phone "has this person turned animations off?"
//   Reveal          — content fades and rises into place as it appears
//   Wiggle          — a thing nudges itself every few seconds to say "tap me"
//   Sparkles        — confetti / sparks popping off something worth celebrating
//   Glow            — a soft pulse, like a ring breathing
//   useCountdown    — a live "2d 4h 11m 06s" that actually ticks down
//
// ACCESSIBILITY: every one of these checks Reduce Motion first. When it's on,
// nothing moves — content is simply already in place, already visible, already
// legible. Motion is never the only way something is communicated.
// PERFORMANCE: transform and opacity only, so animation stays off the main
// thread wherever the platform allows it.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';

/**
 * Which engine runs our animations. On phones we hand them to the OS (smoother,
 * off the main thread). On the web build that engine quietly drops anything that
 * animates a rotation, so things just sit there — there we drive from JavaScript
 * instead. Use this everywhere rather than writing `useNativeDriver: NATIVE_DRIVER`.
 */
export const NATIVE_DRIVER = Platform.OS !== 'web';

/** True when the person has asked their phone to keep animation to a minimum. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

// ============================================
// REVEAL — things arrive instead of just being there
// ============================================
type RevealProps = {
  children: React.ReactNode;
  /** nth item in a list: each one starts a beat after the one above it */
  index?: number;
  /** how far it rises from, in pixels */
  distance?: number;
  delayMs?: number;
  /**
   * Layout goes here as real styles. These wrappers are animated views, and
   * Tailwind class names do not reliably apply to those — a dropped class shows
   * up as broken spacing, which is hard to spot. So: `style`, not `className`.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Fades and lifts its children into place. Give it an `index` inside a list and
 * the rows cascade down the page as you scroll to them.
 */
export function Reveal({
  children,
  index = 0,
  distance = 14,
  delayMs,
  style
}: RevealProps) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      // Cap the stagger so item #40 doesn't wait two seconds to show up.
      delay: delayMs ?? Math.min(index * 55, 400),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER
    });
    anim.start();
    return () => anim.stop();
  }, [progress, index, delayMs, reduce]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// PEEL — a sticky note landing on the wall
// ============================================
/**
 * Like Reveal, but it also un-tilts and settles as it arrives, the way a sticky
 * note looks when you press it onto a wall. Used for the Inside Jokes grid.
 * Alternating notes lean opposite ways so the wall never looks like a table.
 */
export function Peel({
  children,
  index = 0,
  style
}: {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const lean = index % 2 === 0 ? -1 : 1;

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.spring(progress, {
      toValue: 1,
      delay: Math.min(index * 80, 500),
      friction: 7,
      tension: 70,
      useNativeDriver: NATIVE_DRIVER
    });
    anim.start();
    return () => anim.stop();
  }, [progress, index, reduce]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [`${lean * 9}deg`, '0deg']
              })
            },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// WIGGLE — "hey, this one still needs you"
// ============================================
/**
 * Tilts back and forth for a moment, then rests, then does it again. Used on
 * the "To do" tag so an unfinished module keeps catching your eye without
 * ever blocking anything.
 */
export function Wiggle({
  children,
  everyMs = 4000,
  active = true,
  style
}: {
  children: React.ReactNode;
  everyMs?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const tilt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce || !active) return;
    const shake = () =>
      Animated.sequence([
        Animated.timing(tilt, { toValue: 1, duration: 90, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(tilt, { toValue: -1, duration: 110, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(tilt, { toValue: 0.6, duration: 90, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(tilt, { toValue: 0, duration: 110, useNativeDriver: NATIVE_DRIVER })
      ]).start();

    const timer = setInterval(shake, everyMs);
    const kickoff = setTimeout(shake, 700);
    return () => {
      clearInterval(timer);
      clearTimeout(kickoff);
    };
  }, [tilt, everyMs, active, reduce]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              rotate: tilt.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-7deg', '7deg']
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// SPARKLES — confetti for a birthday, sparks for anything worth it
// ============================================
const PARTY = ['🎉', '✨', '🎊', '⭐️', '💫', '🥳', '✨', '🎈'];

/**
 * Little bits popping off the top of whatever this sits on, on a loop. Purely
 * decorative: it is hidden from screen readers, and the thing being celebrated
 * always says so in words too.
 */
export function Sparkles({
  play = true,
  pieces = PARTY,
  spread = 46
}: {
  play?: boolean;
  pieces?: readonly string[];
  spread?: number;
}) {
  const reduce = useReduceMotion();
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!play || reduce) return;
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 260),
          Animated.timing(a, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: NATIVE_DRIVER
          }),
          Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
          Animated.delay((pieces.length - i) * 160)
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims, play, reduce, pieces.length]);

  if (!play || reduce) return null;

  return (
    <View accessible={false} pointerEvents="none" className="absolute inset-0 overflow-visible">
      {pieces.map((piece, i) => {
        const a = anims[i];
        // Guard: with strict index checks `anims[i]` is typed as possibly
        // undefined. Skip any piece without a matching animation value.
        if (!a) return null;
        const drift = ((i % 5) - 2) * (spread / 2);
        return (
          <Animated.View
            key={`${piece}-${i}`}
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              opacity: a.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: Animated.add(new Animated.Value(drift), a.interpolate({ inputRange: [0, 1], outputRange: [0, drift * 0.6] })) },
                { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, -54] }) },
                { scale: a.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.1, 0.7] }) },
                {
                  rotate: a.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${(i % 2 ? 1 : -1) * 50}deg`]
                  })
                }
              ]
            }}
          >
            <Text className="text-[15px]">{piece}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ============================================
// GLOW — a slow breath, for rings and record buttons
// ============================================
/**
 * Gently scales and fades whatever it wraps, forever. Good behind a story ring
 * or a play button so the eye finds it. Wrap the DECORATION, not the content,
 * so text never pulses.
 */
export function Glow({
  children,
  active = true,
  periodMs = 2200,
  intensity = 0.35,
  style
}: {
  children: React.ReactNode;
  active?: boolean;
  periodMs?: number;
  /** how much bigger/dimmer it gets at the peak */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduce) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: periodMs / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: periodMs / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, active, periodMs, reduce]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1 - intensity]
          }),
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1 + intensity * 0.12]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================
// COUNTDOWN — a real clock, not a rounded-off "in 2 days"
// ============================================
export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true once the moment has arrived */
  done: boolean;
  /** ready-to-show text, e.g. "2d 4h 11m 06s" or "3m 42s" */
  label: string;
};

function format(msLeft: number): CountdownParts {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const done = total <= 0;

  // Only show the units that still matter, so it never reads "0d 0h 3m".
  const label = done
    ? 'now'
    : days > 0
      ? `${days}d ${hours}h ${minutes}m ${pad(seconds)}s`
      : hours > 0
        ? `${hours}h ${minutes}m ${pad(seconds)}s`
        : minutes > 0
          ? `${minutes}m ${pad(seconds)}s`
          : `${seconds}s`;

  return { days, hours, minutes, seconds, done, label };
}

/**
 * Ticks once a second toward a moment in the future. Give it a Date, a
 * timestamp, or nothing (which just returns "done"). Under Reduce Motion it
 * still counts — a clock is information, not decoration — it simply updates
 * once a minute instead of every second, so it isn't visually busy.
 */
export function useCountdown(target?: Date | number | null): CountdownParts {
  const reduce = useReduceMotion();
  const targetMs = useMemo(() => {
    if (target == null) return null;
    return target instanceof Date ? target.getTime() : target;
  }, [target]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs == null) return;
    const tick = setInterval(() => setNow(Date.now()), reduce ? 60000 : 1000);
    return () => clearInterval(tick);
  }, [targetMs, reduce]);

  if (targetMs == null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true, label: '' };
  }
  return format(targetMs - now);
}
