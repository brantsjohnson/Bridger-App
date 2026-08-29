// ============================================
// WHAT THIS FILE DOES (plain English):
// The retro animation on the Profile welcome gate: a CRT that types
// "YOU LOOK GOOD!" in a big block font with green scanlines + a blinking
// cursor, plus a padlock that drops shut and flashes green (privacy).
//
// ACCESSIBILITY: decorative (hidden from screen readers). Reduce Motion shows
// the finished CRT text and a still lock, no typing or blinking.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, type StyleProp, View, type ViewStyle } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

const SCREEN_TEXT = 'YOU LOOK GOOD!';
/** Ms between typed characters (design used ~130ms). */
const TYPE_MS = 130;
/** How many ticks to hold the finished line before looping. */
const HOLD_TICKS = 16;
/** Full padlock cycle length (matches design 4.2s). */
const LOCK_CYCLE_MS = 4200;

const PHOSPHOR = '#39ff6a';
const CRT_BLACK = '#040d07';
/** Same near-black as the profile intro page so keyboard corner bites blend in. */
const INTRO_PAGE_BLACK = '#0E0E0E';
/** How many scanline stripes we draw across the CRT face. */
const SCANLINE_COUNT = 36;

/**
 * CRT graphic only (divider + lock live in ProfileIntro for spacing control).
 */
export function ProfileIntroGraphic() {
  const reduce = useReduceMotion();

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ alignItems: 'center', width: '100%', marginTop: 20 }}
    >
      <CrtMonitor reduceMotion={reduce} />
    </View>
  );
}

/** Dashed white dots that separate the CRT from the privacy half. */
export function ProfileIntroDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessible={false}
      style={[
        {
          width: '100%',
          height: 6,
          overflow: 'hidden',
          opacity: 0.4,
          flexDirection: 'row'
        },
        style
      ]}
    >
      {Array.from({ length: 28 }, (_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            marginRight: 8,
            backgroundColor: i % 2 === 0 ? '#FFFFFF' : 'transparent'
          }}
        />
      ))}
    </View>
  );
}

/**
 * Pixel padlock: shackle drops, body jolts, green flash.
 * `onDark` = white lock (profile intro on black). `onLight` = ink lock
 * (onboarding eggshell) so the same animation reads on a light page.
 */
export function ProfileIntroPadlock({
  tone = 'onDark'
}: {
  tone?: 'onDark' | 'onLight';
}) {
  const reduce = useReduceMotion();
  return <Padlock reduceMotion={reduce} tone={tone} />;
}

/** White-bezel CRT that types green phosphor text, then loops. */
function CrtMonitor({ reduceMotion }: { reduceMotion: boolean }) {
  const [typed, setTyped] = useState(reduceMotion ? SCREEN_TEXT : '');
  const [cursorOn, setCursorOn] = useState(true);

  // THIS SECTION DOES: type the line one character at a time, then clear and loop.
  useEffect(() => {
    if (reduceMotion) {
      setTyped(SCREEN_TEXT);
      return;
    }
    let i = 0;
    let holding = 0;
    const tick = setInterval(() => {
      if (i < SCREEN_TEXT.length) {
        i += 1;
        setTyped(SCREEN_TEXT.slice(0, i));
      } else {
        holding += 1;
        if (holding > HOLD_TICKS) {
          holding = 0;
          i = 0;
          setTyped('');
        }
      }
    }, TYPE_MS);
    return () => clearInterval(tick);
  }, [reduceMotion]);

  // THIS SECTION DOES: blink the block cursor when motion is allowed.
  useEffect(() => {
    if (reduceMotion) {
      setCursorOn(true);
      return;
    }
    const blink = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(blink);
  }, [reduceMotion]);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Bezel (white CRT case): screen on top, solid chin under it (no gaps). */}
      <View
        style={{
          width: 280,
          backgroundColor: '#FFFFFF',
          padding: 16,
          paddingBottom: 12
        }}
      >
        {/* Screen face. Fixed height so it never eats the white chin. */}
        <View
          style={{
            height: 148,
            backgroundColor: '#000000',
            padding: 5,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: CRT_BLACK,
              paddingHorizontal: 10,
              paddingTop: 12,
              paddingBottom: 10,
              overflow: 'hidden',
              justifyContent: 'center'
            }}
          >
            <Text
              className="font-pixel"
              style={{
                fontSize: 8,
                letterSpacing: 1,
                color: PHOSPHOR,
                opacity: 0.5,
                marginBottom: 12
              }}
            >
              C:&gt;PROFILE.EXE
            </Text>

            {/* Typed line + block cursor on the same row so the cursor walks with each letter. */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                minHeight: 28
              }}
            >
              <Text
                className="font-pixel"
                style={{
                  fontSize: 22,
                  lineHeight: 28,
                  letterSpacing: 1.2,
                  color: PHOSPHOR,
                  textShadowColor: 'rgba(57,255,106,0.85)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8
                }}
              >
                {typed}
              </Text>
              <View
                style={{
                  width: 14,
                  height: 22,
                  marginLeft: typed.length > 0 ? 2 : 0,
                  backgroundColor: PHOSPHOR,
                  opacity: cursorOn ? 1 : 0
                }}
              />
            </View>

            {/* Green CRT scanlines. */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
              }}
            >
              {Array.from({ length: SCANLINE_COUNT }, (_, i) => (
                <View
                  key={i}
                  style={{
                    height: 2,
                    marginBottom: 2,
                    backgroundColor:
                      i % 2 === 0 ? 'rgba(57,255,106,0.14)' : 'rgba(0,0,0,0.45)'
                  }}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Solid white chin under the screen — left ports + right LED, no hole. */}
        <View
          style={{
            marginTop: 12,
            height: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF'
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 22, height: 12, backgroundColor: '#000' }} />
            <View style={{ width: 12, height: 12, backgroundColor: '#000' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LedBlink reduceMotion={reduceMotion} />
            <View style={{ width: 26, height: 14, backgroundColor: '#000' }} />
          </View>
        </View>
      </View>

      {/* Stand neck + plate under the CRT. */}
      <View style={{ width: 96, height: 12, backgroundColor: '#FFFFFF' }} />
      <View style={{ width: 148, height: 8, backgroundColor: '#FFFFFF', marginBottom: 8 }} />
      <PixelKeyboard />
    </View>
  );
}

/**
 * Pixel keyboard that matches the design: stepped white body, two rows of
 * small black keys, then a row of wider keys (spacebar family).
 */
function PixelKeyboard() {
  const KEY = 7;
  const GAP = 3;
  const INNER_W = 228;
  const topKeys = 18;
  const midKeys = 16;
  // Bottom row fills the full inner width: side keys + one long spacebar.
  const side = 20;
  const spaceW = INNER_W - side * 4 - GAP * 4;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 132, height: 8, backgroundColor: '#FFFFFF', marginBottom: 4 }} />

      <View style={{ width: 248, position: 'relative' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 10,
            paddingTop: 10,
            paddingBottom: 10,
            gap: 5
          }}
        >
          <View style={{ flexDirection: 'row', gap: GAP, justifyContent: 'space-between' }}>
            {Array.from({ length: topKeys }, (_, i) => (
              <View
                key={`t${i}`}
                style={{
                  width: KEY,
                  height: KEY,
                  flexShrink: 0,
                  backgroundColor: '#000000'
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: GAP, justifyContent: 'space-between' }}>
            {Array.from({ length: midKeys }, (_, i) => (
              <View
                key={`m${i}`}
                style={{
                  width: i === midKeys - 1 ? KEY + 10 : KEY,
                  height: KEY + 1,
                  flexShrink: 0,
                  backgroundColor: '#000000'
                }}
              />
            ))}
          </View>
          {/* Continuous bottom row — no empty white hole in the middle. */}
          <View style={{ flexDirection: 'row', gap: GAP, alignItems: 'center' }}>
            <View style={{ width: side, height: KEY + 1, flexShrink: 0, backgroundColor: '#000' }} />
            <View style={{ width: side, height: KEY + 1, flexShrink: 0, backgroundColor: '#000' }} />
            <View
              style={{ width: spaceW, height: KEY + 1, flexShrink: 0, backgroundColor: '#000' }}
            />
            <View style={{ width: side, height: KEY + 1, flexShrink: 0, backgroundColor: '#000' }} />
            <View style={{ width: side, height: KEY + 1, flexShrink: 0, backgroundColor: '#000' }} />
          </View>
        </View>

        {/* Stepped corners. */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: 6,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 6,
            height: 6,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 6,
            height: 6,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 6,
            height: 6,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 6,
            top: 0,
            width: 6,
            height: 3,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 6,
            top: 0,
            width: 6,
            height: 3,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 6,
            bottom: 0,
            width: 6,
            height: 3,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 6,
            bottom: 0,
            width: 6,
            height: 3,
            backgroundColor: INTRO_PAGE_BLACK
          }}
        />
      </View>
    </View>
  );
}

/** Green LED that blinks on the CRT bezel. */
function LedBlink({ reduceMotion }: { reduceMotion: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1680,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 720,
          useNativeDriver: NATIVE_DRIVER
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        backgroundColor: PHOSPHOR,
        opacity,
        shadowColor: PHOSPHOR,
        shadowOpacity: 0.8,
        shadowRadius: 7
      }}
    />
  );
}

/** Pixel padlock: shackle drops, body jolts, green flash. */
function Padlock({
  reduceMotion,
  tone
}: {
  reduceMotion: boolean;
  tone: 'onDark' | 'onLight';
}) {
  // How far the shackle lifts when open. The box must leave this much room
  // above the closed lock, or the arch gets clipped by overflow:hidden parents.
  const SHACKLE_RISE = 26;
  const shackleY = useRef(new Animated.Value(reduceMotion ? 0 : -SHACKLE_RISE)).current;
  const bodyY = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  // White on black intro; ink on eggshell so the lock never disappears.
  const metal = tone === 'onLight' ? '#1C1B16' : '#FFFFFF';
  const keyhole = tone === 'onLight' ? '#F5F0E6' : '#000000';

  useEffect(() => {
    if (reduceMotion) {
      shackleY.setValue(0);
      bodyY.setValue(0);
      flash.setValue(0);
      return;
    }

    const cycle = Animated.loop(
      Animated.sequence([
        Animated.timing(shackleY, {
          toValue: -SHACKLE_RISE,
          duration: 0,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.delay(Math.floor(LOCK_CYCLE_MS * 0.18)),
        Animated.timing(shackleY, {
          toValue: 2,
          duration: 0,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.delay(Math.floor(LOCK_CYCLE_MS * 0.06)),
        Animated.timing(shackleY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bodyY, {
              toValue: 3,
              duration: 0,
              useNativeDriver: NATIVE_DRIVER
            }),
            Animated.delay(Math.floor(LOCK_CYCLE_MS * 0.06)),
            Animated.timing(bodyY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: NATIVE_DRIVER
            })
          ]),
          Animated.sequence([
            Animated.timing(flash, {
              toValue: 1,
              duration: 0,
              useNativeDriver: NATIVE_DRIVER
            }),
            Animated.delay(Math.floor(LOCK_CYCLE_MS * 0.18)),
            Animated.timing(flash, {
              toValue: 0,
              duration: 0,
              useNativeDriver: NATIVE_DRIVER
            })
          ])
        ]),
        Animated.delay(Math.floor(LOCK_CYCLE_MS * 0.52))
      ])
    );
    cycle.start();
    return () => cycle.stop();
  }, [reduceMotion, shackleY, bodyY, flash]);

  return (
    <View
      style={{
        width: 92,
        // Closed lock is 110 tall; + rise so the open arch never gets cropped.
        height: 110 + SHACKLE_RISE,
        alignSelf: 'center',
        overflow: 'visible'
      }}
    >
      <Animated.View
        style={{
          height: 34,
          // Park the closed shackle below the rise zone; open (-rise) lands at y=0.
          marginTop: SHACKLE_RISE,
          transform: [{ translateY: shackleY }]
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 26,
            top: 0,
            width: 40,
            height: 10,
            backgroundColor: metal
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 16,
            top: 10,
            width: 10,
            height: 10,
            backgroundColor: metal
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 66,
            top: 10,
            width: 10,
            height: 10,
            backgroundColor: metal
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 16,
            top: 20,
            width: 10,
            height: 24,
            backgroundColor: metal
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 66,
            top: 20,
            width: 10,
            height: 24,
            backgroundColor: metal
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          width: 92,
          height: 70,
          transform: [{ translateY: bodyY }]
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 92,
            height: 70,
            backgroundColor: metal
          }}
        />
        {/* Green flash sits under the keyhole so the hole stays visible when lit. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 92,
            height: 70,
            backgroundColor: PHOSPHOR,
            opacity: flash
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 40,
            top: 20,
            width: 12,
            height: 12,
            backgroundColor: keyhole
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 44,
            top: 32,
            width: 4,
            height: 14,
            backgroundColor: keyhole
          }}
        />
      </Animated.View>
    </View>
  );
}
