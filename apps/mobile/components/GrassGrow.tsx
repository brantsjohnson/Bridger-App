// ============================================
// WHAT THIS FILE DOES (plain English):
// The grass that grows inside the Touch Grass button. It rises up from the
// bottom edge, holds at the top, sinks all the way down, and the moment it
// disappears it starts climbing again — a quiet "come on, tap me".
//
// HOW THE CROP WORKS: grass.png is a see-through image with the blades sitting
// in a band across the middle of it (tips near the top of that band, dirt line
// at the bottom). We line the picture up on that band, so the TIPS are always
// whole and it's the dirt line at the bottom that gets tucked under the edge of
// the button. ONE copy only — tiling two copies made it look like the grass
// was doubled. If you swap the artwork, remeasure the two numbers below.
//
// ACCESSIBILITY: decorative only, hidden from screen readers, and it does not
// animate at all when Reduce Motion is on (the grass just sits still, grown, so
// the button still looks like itself).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

const GRASS = require('../assets/images/grass.png');

/** The picture's own proportions (1536 x 1024). */
const IMG_ASPECT = 1536 / 1024;
/** Where the blade tips start, measured down the picture. */
const GRASS_TOP = 384 / 1024;
/** Where the dirt line at the base of the blades sits. */
const GRASS_BOTTOM = 581 / 1024;
/** How much of that dirt line we hide under the button's edge, in pixels. */
const BOTTOM_CROP = 5;
/**
 * How wide the picture is drawn, as a share of the button. Full width so the
 * grass runs edge to edge along the bottom of the button (no empty sides).
 */
const DRAW_SHARE = 1;

/** Rise / sink are 3× slower than the first pass. */
const RISE_MS = 6600;
const SINK_MS = 4500;
/** Hold at the top is 2× longer than the first pass. */
const HOLD_TOP_MS = 2000;

export function GrassGrow({ active = true }: { active?: boolean }) {
  const reduce = useReduceMotion();
  // 0 = completely hidden below the edge, 1 = fully grown
  const grown = useRef(new Animated.Value(0)).current;
  // We measure the button so the crop lands on the blades at any screen width.
  const [width, setWidth] = useState(0);

  // --- Working out the crop from the measured width ---
  // Sizes are in real pixels, not percentages: the web build ignores an image's
  // aspect-ratio style, and the picture would render at its full 1024 height.
  const tileWidth = width * DRAW_SHARE;
  const tileHeight = tileWidth / IMG_ASPECT;
  // How tall the blades themselves come out, minus the bit of dirt we hide.
  const bandHeight = Math.max(
    0,
    tileHeight * (GRASS_BOTTOM - GRASS_TOP) - BOTTOM_CROP
  );
  // Slide the picture up so its dirt line sits just past the bottom edge.
  const imageTop = bandHeight + BOTTOM_CROP - tileHeight * GRASS_BOTTOM;

  useEffect(() => {
    if (!active) {
      grown.setValue(0);
      return;
    }
    // Reduce Motion: show it grown and leave it alone.
    if (reduce) {
      grown.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        // grow up — slow
        Animated.timing(grown, {
          toValue: 1,
          duration: RISE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE_DRIVER
        }),
        // hold at the top
        Animated.delay(HOLD_TOP_MS),
        // sink back until it is completely hidden — slow
        Animated.timing(grown, {
          toValue: 0,
          duration: SINK_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: NATIVE_DRIVER
        })
        // no pause at the bottom — the loop restarts the rise immediately
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [grown, active, reduce]);

  if (!active) return null;

  return (
    <View
      accessible={false}
      pointerEvents="none"
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== width) setWidth(w);
      }}
      className="absolute inset-x-0 bottom-0 overflow-hidden"
    >
      <Animated.View
        style={{
          height: bandHeight,
          overflow: 'hidden',
          transform: [
            {
              translateY: grown.interpolate({
                inputRange: [0, 1],
                outputRange: [bandHeight, 0]
              })
            }
          ]
        }}
      >
        {width > 0 ? (
          <Image
            source={GRASS}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            style={{
              position: 'absolute',
              // Center the one picture so it doesn't look like a double.
              left: (width - tileWidth) / 2,
              top: imageTop,
              width: tileWidth,
              height: tileHeight
            }}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}
