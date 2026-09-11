// ============================================
// WHAT THIS FILE DOES (plain English):
// Slowly turns a sticky note from the quote to the photo and back. Posted
// notes use this, and the add-joke page uses it after you pick a photo.
//
// ACCESSIBILITY: the caller turns this off when Reduce Motion is on.
// ============================================
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { NATIVE_DRIVER } from '@bridger/ui';

/** How long the quote or photo stays still before it turns. */
export const NOTE_HOLD_MS = 2600;
/** How long the turn itself takes. */
export const NOTE_FLIP_MS = 520;

/** THIS SECTION DOES: loop quote (0) ↔ photo (1) while `active` is true. */
export function useQuotePhotoFlip(active: boolean) {
  const flip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      flip.setValue(0);
      return;
    }
    flip.setValue(0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let anim: Animated.CompositeAnimation | undefined;
    let showPhoto = false;

    // Holds use a timer. Animated.delay can sit still on web and never flip.
    const turn = () => {
      showPhoto = !showPhoto;
      anim = Animated.timing(flip, {
        toValue: showPhoto ? 1 : 0,
        duration: NOTE_FLIP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER
      });
      anim.start(({ finished }) => {
        if (!finished) return;
        timer = setTimeout(turn, NOTE_HOLD_MS);
      });
    };
    timer = setTimeout(turn, NOTE_HOLD_MS);

    return () => {
      if (timer) clearTimeout(timer);
      anim?.stop();
      flip.setValue(0);
    };
  }, [active, flip]);

  // THIS SECTION DOES: spin each face and hide the one that is on the back.
  const quoteRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });
  const photoRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg']
  });
  const quoteOpacity = flip.interpolate({
    inputRange: [0, 0.48, 0.52, 1],
    outputRange: [1, 1, 0, 0]
  });
  const photoOpacity = flip.interpolate({
    inputRange: [0, 0.48, 0.52, 1],
    outputRange: [0, 0, 1, 1]
  });

  return { quoteRotate, photoRotate, quoteOpacity, photoOpacity };
}
