// ============================================
// WHAT THIS FILE DOES (plain English):
// The top banner of the Home quiz card. Instead of one static picture, it
// slowly cross-fades through a set of J-name faces, forever, so the card feels
// alive and teases the quiz. If the person has turned on Reduce Motion, it just
// shows the first face and never animates.
//
// HOW IT CANNOT GO BLACK (this was the old bug):
// Every face is stacked in the frame and stays mounted at full opacity once it
// has been shown. To advance we only ever fade the NEXT face IN on top of the
// one already showing (a fresh, higher layer each beat). So a photo is always
// fully covering the frame. Even if the phone or the browser drops an animation
// half way, you still see a real picture, never the empty shell behind it.
//
// WEB NOTE: the web build quietly ignores OS-driven ("native driver")
// animations, which is what used to leave this banner stuck on a dark box after
// one rotation. We use the shared NATIVE_DRIVER flag so web animates from
// JavaScript instead, and the shell behind the photos is a brand blue rather
// than near-black so even a slow first load never reads as a broken image.
// ============================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ImageSourcePropType
} from 'react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

/** How long one cross-fade takes. */
const FADE_MS = 700;

export function QuizCoverCycler({
  faces,
  heightPx,
  intervalMs = 2600,
  accessibilityLabel = 'J-name faces'
}: {
  faces: ImageSourcePropType[];
  /** Banner height in pixels (must match the parent h-52 / h-28 Tailwind class). */
  heightPx: number;
  /** How long each face is shown before fading to the next. */
  intervalMs?: number;
  accessibilityLabel?: string;
}) {
  const reduce = useReduceMotion();
  const count = faces.length;

  // THIS SECTION DOES: one fade dial per face. The first face starts fully
  // visible; the rest start invisible and get faded in when their turn comes.
  const opacities = useMemo(
    () => faces.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
    // Rebuild only if the number of faces changes (the list itself is static).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );

  // THIS SECTION DOES: remember which layer sits on top of which. Each beat the
  // incoming face gets the next-highest number, so it lands above everything.
  const [stacking, setStacking] = useState<number[]>(() =>
    faces.map((_, i) => (i === 0 ? 1 : 0))
  );
  const topRef = useRef(1);
  const currentRef = useRef(0);

  // Start clean whenever the face count changes.
  useEffect(() => {
    topRef.current = 1;
    currentRef.current = 0;
    setStacking(faces.map((_, i) => (i === 0 ? 1 : 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    if (reduce || count <= 1) return;

    // THIS SECTION DOES: every beat, bring the next face in over the top.
    const timer = setInterval(() => {
      const next = (currentRef.current + 1) % count;
      topRef.current += 1;
      const layer = topRef.current;

      // Put it above every other layer, still invisible, then fade it in.
      setStacking((prev) => {
        const nextStack = [...prev];
        nextStack[next] = layer;
        return nextStack;
      });
      opacities[next]?.setValue(0);
      Animated.timing(opacities[next]!, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: NATIVE_DRIVER
      }).start();

      // Move on right away: even if that fade gets cut short, the layer under it
      // is still a full photo, so the next beat just keeps the rotation going.
      currentRef.current = next;
    }, intervalMs);

    return () => clearInterval(timer);
  }, [count, intervalMs, reduce, opacities]);

  // Reduce Motion: park on the first face, nothing moves.
  useEffect(() => {
    if (!reduce) return;
    opacities.forEach((o, i) => o.setValue(i === 0 ? 1 : 0));
    topRef.current = 1;
    currentRef.current = 0;
    setStacking(faces.map((_, i) => (i === 0 ? 1 : 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, opacities, count]);

  if (!count) {
    return (
      <View
        style={[styles.shell, { height: heightPx }]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View
      style={[styles.shell, { height: heightPx }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {faces.map((face, i) => (
        <Animated.Image
          key={i}
          source={face}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          style={[
            styles.layer,
            { height: heightPx },
            { opacity: opacities[i]!, zIndex: stacking[i] ?? 0 }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    // Brand blue, not near-black: if a photo is still loading this reads as the
    // quiz cover instead of looking like a broken picture.
    backgroundColor: '#4D96FF'
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%'
  }
});
