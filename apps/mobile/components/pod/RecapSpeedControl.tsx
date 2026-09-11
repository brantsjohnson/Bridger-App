// ============================================
// WHAT THIS FILE DOES (plain English):
// The "how fast to play" control on the weekly recap. It shows a small pill
// with the current speed (like "1×"). Tap it and a slider drops down; drag the
// dot to speed the voices up to 2.5×. Whatever you pick becomes the default for
// everyone in the listen, and it is remembered next time (the recap page saves
// it). Default is a normal 1×.
//
// ACCESSIBILITY: the slider is a real "adjustable" control with a spoken value,
// and the pill is a labelled button. Tap targets stay at least 44px tall.
// ============================================
import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View
} from 'react-native';
import { cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';

// THIS SECTION DOES: the app's purple (theme colors do not carry an accent).
const PURPLE = '#6B2FEA';
import {
  RECAP_SPEED_MAX,
  RECAP_SPEED_MIN,
  clampRecapSpeed,
  formatRecapSpeed
} from '../../lib/recap-speed';

// THIS SECTION DOES: turn a screen position into a speed, and back, so the dot
// and the number always agree.
function fractionToSpeed(fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return clampRecapSpeed(RECAP_SPEED_MIN + clamped * (RECAP_SPEED_MAX - RECAP_SPEED_MIN));
}

function speedToFraction(speed: number): number {
  const range = RECAP_SPEED_MAX - RECAP_SPEED_MIN;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, (speed - RECAP_SPEED_MIN) / range));
}

export function RecapSpeedControl({
  speed,
  onChange,
  analyticsId
}: {
  /** The speed the player is using right now. */
  speed: number;
  /** Called with a new speed as the dot moves or a preset is tapped. */
  onChange: (next: number) => void;
  /** Shared analytics id for the speed control (method = the rate). */
  analyticsId: string;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  // Width of the slider track, measured once it lays out, so drag math is right.
  const trackWidth = useRef(1);
  const [, force] = useState(0);

  // THIS SECTION DOES: while dragging, translate the finger's x into a speed.
  const setFromX = (x: number) => {
    const fraction = x / trackWidth.current;
    onChange(fractionToSpeed(fraction));
  };

  // THIS SECTION DOES: let a finger drag the dot along the track.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX)
    })
  ).current;

  const fraction = speedToFraction(speed);

  return (
    <View className="items-center gap-2">
      {/* THIS SECTION DOES: the pill you tap to reveal the slider. */}
      <Pressable
        onPress={withAnalyticsPress(
          analyticsId,
          () => setOpen((v) => !v),
          { analyticsProps: { method: String(clampRecapSpeed(speed)) } }
        )}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Playback speed ${formatRecapSpeed(speed)}. Tap to change.`}
        className={cn(
          'min-h-[36px] flex-row items-center gap-2 rounded-full border px-3.5',
          open ? 'border-transparent bg-purple' : 'border-ink-line bg-surface'
        )}
      >
        <Text
          className={cn('font-sans-b text-[12px]', open ? 'text-white' : 'text-ink-mute')}
        >
          Speed
        </Text>
        <Text
          className={cn('font-sans-b text-[13px]', open ? 'text-white' : 'text-ink')}
        >
          {formatRecapSpeed(speed)}
        </Text>
      </Pressable>

      {/* THIS SECTION DOES: the drop-down slider, only while the pill is open. */}
      {open ? (
        <View className="w-full flex-row items-center gap-3 px-1">
          <Text className="w-8 shrink-0 font-sans-b text-[11px] text-ink-mute">1×</Text>
          <View
            className="h-11 min-w-0 flex-1 justify-center"
            onLayout={(e: LayoutChangeEvent) => {
              trackWidth.current = Math.max(1, e.nativeEvent.layout.width);
              force((n) => n + 1);
            }}
            accessibilityRole="adjustable"
            accessibilityLabel="Playback speed"
            accessibilityValue={{ text: formatRecapSpeed(speed) }}
            {...pan.panHandlers}
          >
            {/* The grey rail. */}
            <View className="h-1.5 w-full rounded-full bg-ink/15">
              {/* The purple filled part up to the dot. */}
              <View
                className="h-1.5 rounded-full bg-purple"
                style={{ width: `${fraction * 100}%` }}
              />
            </View>
            {/* The draggable dot, centred on the current speed. */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${fraction * 100}%`,
                marginLeft: -11,
                height: 22,
                width: 22,
                borderRadius: 999,
                backgroundColor: PURPLE,
                borderWidth: 3,
                borderColor: c.surface
              }}
            />
          </View>
          <Text className="w-8 shrink-0 text-right font-sans-b text-[11px] text-ink-mute">
            2.5×
          </Text>
        </View>
      ) : null}
    </View>
  );
}
