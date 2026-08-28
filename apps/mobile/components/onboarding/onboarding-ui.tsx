// ============================================
// WHAT THIS FILE DOES (plain English):
// The building blocks the first-run screens are made of, so all 19 screens look
// like one set instead of 19 hand-built pages. These come straight from the
// Magic Patterns "Onboarding Flow" design:
//
//   OBGridPatch  - the faint graph-paper squares in the corners of the page
//   OBHardShadow - the solid color block that sits behind a button, like a
//                  sticker lifted off the paper (no blur, ever)
//   OBChip       - the little amber tag that says why we're asking
//   OBHeading    - the giant blue all-caps question (app pixel font)
//   OBBody       - the sentence under the question
//   OBKicker     - the small pink all-caps hint ("Pick any that apply")
//   OBField      - a white box you type in, with a hard navy outline
//   OBTile       - a tappable white row: plain, with a checkbox, or with a switch
//   OBNote       - the quiet white panel used for privacy / reassurance copy
//   OBCTA        - the hot pink Continue pill (rounded, no hard shadow)
//   OBSkipLink   - the underlined "Skip for now" under the button
//   OBProgress   - the segmented step bar with "3/14" beside it
//
// ACCESSIBILITY: every tappable block here is at least 44pt tall, states what it
// is (button / checkbox / switch) and whether it is on, and decorative pieces
// (grid, shadow) are hidden from screen readers. Nothing here relies on color
// alone: picked rows also get a tick or a switched-on toggle.
// ============================================
import React from 'react';
import {
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { trackUi } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OB, OB_BORDER, OB_HEADING, OB_HEADING_SM, OB_SHADOW_OFFSET } from './onboarding-theme';

/** The grey the system switch shows when it is off. */
const OB_SWITCH_OFF = 'rgba(39,64,135,0.25)';

// ============================================
// THE PAPER: faint graph-paper squares, drawn as thin lines in a corner. Purely
// decorative, so screen readers skip it.
// ============================================
export function OBGridPatch({
  size = 280,
  step = 46,
  left,
  right,
  top,
  bottom,
  opacity = 1
}: {
  size?: number;
  /** Space between grid lines. Smaller = denser graph paper. */
  step?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  opacity?: number;
}) {
  const lines = Math.ceil(size / step) + 1;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ position: 'absolute', width: size, height: size, left, right, top, bottom, opacity }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: i * step,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: OB.gridLine
          }}
        />
      ))}
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: i * step,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: OB.gridLine
          }}
        />
      ))}
    </View>
  );
}

// ============================================
// THE STICKER SHADOW: a solid block of color offset down and to the right. This
// is how the design makes buttons look like they are sitting on top of the page.
// ============================================
export function OBHardShadow({
  children,
  color = OB.blue,
  offset = OB_SHADOW_OFFSET,
  style
}: {
  children: React.ReactNode;
  color?: string;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ position: 'relative', paddingRight: offset, paddingBottom: offset }, style]}>
      <View
        pointerEvents="none"
        accessible={false}
        style={{
          position: 'absolute',
          left: offset,
          top: offset,
          right: 0,
          bottom: 0,
          backgroundColor: color
        }}
      />
      {children}
    </View>
  );
}

// ============================================
// THE WHY: a small amber tag above the question.
// ============================================
export function OBChip({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: OB.amber, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ letterSpacing: 0.6, color: OB.ink }} className="font-sans-sb text-[12px]">
        {children}
      </Text>
    </View>
  );
}

// ============================================
// THE QUESTION: giant, tight, all-caps, blue. `small` for busy screens.
// ============================================
export function OBHeading({
  children,
  small = false,
  style
}: {
  children: React.ReactNode;
  small?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text className="font-pixel" style={[small ? OB_HEADING_SM : OB_HEADING, style]}>
      {children}
    </Text>
  );
}

/** The sentence under the question. */
export function OBBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text
      className={className}
      style={{ fontSize: 15.5, lineHeight: 23, color: 'rgba(0,0,0,0.78)' }}
    >
      {children}
    </Text>
  );
}

/** Small pink all-caps instruction, e.g. "Pick any that apply". */
export function OBKicker({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="font-sans-sb text-[12px]"
      style={{ letterSpacing: 1.2, textTransform: 'uppercase', color: OB.pink }}
    >
      {children}
    </Text>
  );
}

/** The quiet white panel used for privacy / reassurance copy. */
export function OBNote({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: OB.paper,
        borderWidth: OB_BORDER,
        borderColor: 'rgba(39,64,135,0.55)',
        padding: 16
      }}
    >
      <Text style={{ fontSize: 13.5, lineHeight: 20, color: 'rgba(0,0,0,0.72)' }}>{children}</Text>
    </View>
  );
}

// ============================================
// TYPING: a white box with a hard navy outline and its label above it.
// ============================================
export function OBField({
  label,
  value,
  onChange,
  placeholder,
  analyticsId,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Taxonomy id; focusing the field logs it (never the typed text). */
  analyticsId?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <Text className="font-sans-sb text-[13px]" style={{ letterSpacing: 0.4, color: OB.navy }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        // Focus only - we never log what was typed (PRIVACY: no content / PII).
        onFocus={() => {
          if (analyticsId) trackUi('focus', analyticsId);
        }}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        accessibilityLabel={label}
        style={{
          backgroundColor: OB.paper,
          borderWidth: OB_BORDER,
          borderColor: OB.navy,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: 17,
          color: OB.ink,
          minHeight: multiline ? 96 : 52,
          textAlignVertical: multiline ? 'top' : 'center'
        }}
      />
    </View>
  );
}

// ============================================
// CHOOSING: one tappable white row. Three flavors:
//   plain    - just a label (and an optional mark on the right)
//   checkbox - a 22px box that fills in and shows a tick when picked
//   switch   - the phone's own on/off switch, green fill + white knob when on
// Picked rows turn periwinkle, so it never depends on the tick alone.
// ============================================
export function OBTile({
  label,
  selected = false,
  variant = 'plain',
  mark,
  right,
  onPress,
  analyticsId,
  analyticsProps,
  accessibilityLabel,
  disabled = false,
  /** Idle fill when not selected (default white paper). */
  idleFill
}: {
  label: string;
  selected?: boolean;
  variant?: 'plain' | 'checkbox' | 'switch';
  /** Small text on the right of a plain tile (e.g. a check or count). */
  mark?: string;
  /** Anything custom on the right (used by the invite link slots). */
  right?: React.ReactNode;
  onPress?: () => void;
  analyticsId?: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
  accessibilityLabel?: string;
  disabled?: boolean;
  idleFill?: string;
}) {
  const role = variant === 'checkbox' ? 'checkbox' : variant === 'switch' ? 'switch' : 'button';
  return (
    <Pressable
      onPress={
        analyticsId && onPress
          ? withAnalyticsPress(analyticsId, onPress, { analyticsProps })
          : onPress
      }
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        variant === 'plain' ? { disabled, selected } : { disabled, checked: selected }
      }
      style={{
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: selected ? OB.periwinkle : idleFill ?? OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        {variant === 'checkbox' ? <OBCheckBox checked={selected} /> : null}
        <Text
          className="font-sans-sb text-[16px]"
          style={{ color: OB.navy, flexShrink: 1 }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
      {variant === 'switch' ? <OBSwitchMark on={selected} /> : null}
      {right}
      {variant === 'plain' && mark ? (
        <Text className="font-sans-b text-[15px]" style={{ color: OB.navy }}>
          {mark}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** The 22px square that fills in when a row is picked. */
function OBCheckBox({ checked }: { checked: boolean }) {
  return (
    <View
      accessible={false}
      style={{
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: checked ? OB.pink : 'transparent',
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      {checked ? (
        <Text className="font-sans-b text-[13px]" style={{ color: OB.onColor }}>
          ✓
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The on/off control on notification rows. This is the phone's own switch (iOS
 * and Android each draw their own). When it is on, the track fills green and
 * the knob stays white, so it reads like a clear "yes" without swapping colors
 * on the circle.
 *
 * ACCESSIBILITY: the whole row is the switch as far as a screen reader is
 * concerned, so the control itself is hidden from it and ignores taps. Tapping
 * anywhere on the row (including right on the switch) runs the row's press.
 */
function OBSwitchMark({ on }: { on: boolean }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ flexShrink: 0 }}
    >
      <Switch
        value={on}
        trackColor={{ false: OB_SWITCH_OFF, true: OB.green }}
        // White knob on both platforms. Android needs this set or it paints the
        // thumb green from the system accent.
        thumbColor={OB.paper}
        ios_backgroundColor={OB_SWITCH_OFF}
      />
    </View>
  );
}

// ============================================
// THE BUTTON: hot pink, all-caps, same clean bold sans as every other Bridger
// button (not the pixel header, not Big Shoulders). Rounded pill with an arrow.
// On reality-check pages that keeps "Let's try again" a bit different from the
// big display headlines above it.
// ============================================
export function OBCTA({
  label,
  onPress,
  analyticsId,
  analyticsProps,
  disabled = false,
  accessibilityLabel
}: {
  label: string;
  onPress?: () => void;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
  disabled?: boolean;
  /** Kept so older call sites still compile; the hard shadow is gone. */
  shadowColor?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress ? withAnalyticsPress(analyticsId, onPress, { analyticsProps }) : undefined}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 999,
        backgroundColor: OB.pink,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Text
        className="font-sans-b"
        style={{
          fontSize: 17,
          lineHeight: 22,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: OB.onColor
        }}
      >
        {label}
      </Text>
      <Text className="font-sans-b text-[19px]" style={{ color: OB.onColor }} accessible={false}>
        →
      </Text>
    </Pressable>
  );
}

/** The underlined "Skip for now" that sits under the button. */
export function OBSkipLink({
  label,
  onPress,
  analyticsId
}: {
  label: string;
  onPress: () => void;
  analyticsId: string;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}
    >
      <Text
        className="font-sans-sb text-[14px]"
        style={{ color: OB.navy, textDecorationLine: 'underline' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================
// THE PROGRESS BAR: a white strip outlined in blue, split into one segment per
// question, filling pink as you go, with "3/14" beside it.
// ============================================
export function OBProgress({
  step,
  total,
  analyticsId
}: {
  step: number;
  total: number;
  analyticsId?: string;
}) {
  const done = Math.max(0, Math.min(total, step));
  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel={`Step ${done} of ${total}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            flex: 1,
            height: 22,
            padding: 3,
            flexDirection: 'row',
            gap: 2,
            backgroundColor: OB.paper,
            borderWidth: 2.5,
            borderColor: OB.blue
          }}
        >
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: i < done ? OB.pink : 'transparent'
              }}
            />
          ))}
        </View>
        <Text
          className="font-sans-b text-[13px]"
          style={{ letterSpacing: 0.4, color: OB.navy }}
        >
          {done}/{total}
        </Text>
      </View>
    </AnalyticsRegion>
  );
}
