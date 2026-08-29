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
//   OBCTA        - the hot pink Continue button (square, no hard shadow)
//   OBSkipLink   - the underlined "Skip for now" under the button
//   OBProgress   - the segmented step bar with "3/14" beside it
//
// ACCESSIBILITY: every tappable block here is at least 44pt tall, states what it
// is (button / checkbox / switch) and whether it is on, and decorative pieces
// (grid, shadow) are hidden from screen readers. Nothing here relies on color
// alone: picked rows also get a tick or a switched-on toggle.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';
import { trackClick, trackUi } from '@bridger/shared';
import {
  AnalyticsRegion,
  HobbyEmojiBurst,
  useReduceMotion,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';
import { OB, OB_BORDER, OB_HEADING, OB_HEADING_SM, OB_SHADOW_OFFSET } from './onboarding-theme';

/** Party mix for Continue / Let's try again taps in onboarding. */
const ONBOARDING_BURST_EMOJIS = ['🎉', '🎊', '🎈'];
/** Tiny beat so the shower starts, without making Continue feel stuck. */
const ONBOARDING_BURST_ADVANCE_MS = 120;

/** The grey the system switch shows when it is off (app ink at low opacity). */
const OB_SWITCH_OFF = OB.switchOff;

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

/** The sentence under the question (theme ink so it stays readable on dark canvas). */
export function OBBody({ children, className }: { children: React.ReactNode; className?: string }) {
  const theme = useThemeColors();
  return (
    <Text
      className={className}
      style={{ fontSize: 15.5, lineHeight: 23, color: theme.inkSoft }}
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
        borderColor: OB.borderMuted,
        padding: 16
      }}
    >
      <Text style={{ fontSize: 13.5, lineHeight: 20, color: OB.inkSoft }}>{children}</Text>
    </View>
  );
}

// ============================================
// TYPING: a white box with a hard navy outline and its label above it.
// Multiline fields start one line tall, then grow one line at a time as the
// words wrap. They are never a fixed paragraph box. iOS inside a ScrollView
// can report a huge empty contentSize; we ignore that and stay one line.
// ============================================
const OB_FIELD_PAD_Y = 14;
const OB_FIELD_LINE = 22;
const OB_FIELD_LINE_MIN = OB_FIELD_PAD_Y * 2 + OB_FIELD_LINE;
const OB_FIELD_MAX_LINES = 8;

export function OBField({
  label,
  value,
  onChange,
  placeholder,
  analyticsId,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  accessibilityLabel,
  onFocusExtra,
  returnKeyType,
  onSubmitEditing,
  inputRef
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
  /** Spoken name when the visible label is omitted (e.g. the heading above). */
  accessibilityLabel?: string;
  /**
   * Extra focus hook (e.g. scroll this field above the keyboard). Receives the
   * field's outer View so the page can measure and scroll to it. Never receives
   * the typed text.
   */
  onFocusExtra?: (anchor: View | null) => void;
  /** Keyboard return key label (next / done / go). */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' | 'default';
  /** What happens when they hit Enter / return (focus next field, continue, etc.). */
  onSubmitEditing?: () => void;
  /** Let the parent focus this box (e.g. Enter on the field above). */
  inputRef?: React.Ref<TextInput>;
}) {
  // THIS SECTION DOES: remember how tall the typing box needs to be when words wrap.
  const [growHeight, setGrowHeight] = useState(OB_FIELD_LINE_MIN);
  // Label sits on the page canvas, so it must follow light/dark ink (boxes stay white).
  const theme = useThemeColors();
  // Outer box we measure so the page can scroll this field above the keyboard.
  const wrapRef = useRef<View>(null);
  // Enter should advance (next field / continue), not insert a blank paragraph line.
  const enterAdvances = !!onSubmitEditing;

  // THIS SECTION DOES: empty answers snap back to one line (no leftover tall box).
  useEffect(() => {
    if (!multiline) return;
    if (!value) setGrowHeight(OB_FIELD_LINE_MIN);
  }, [multiline, value]);

  return (
    <View ref={wrapRef} style={{ gap: 7 }}>
      {label ? (
        <Text
          className="font-sans-sb text-[13px]"
          style={{ letterSpacing: 0.4, color: theme.ink }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        // Focus only - we never log what was typed (PRIVACY: no content / PII).
        onFocus={() => {
          if (analyticsId) trackUi('focus', analyticsId);
          // Parent (confirm profile, places, etc.) scrolls this box into view.
          onFocusExtra?.(wrapRef.current);
        }}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        // Grow the box instead of scrolling text inside it.
        scrollEnabled={multiline ? false : undefined}
        // Enter moves to the next field or continues; long answers still wrap.
        returnKeyType={returnKeyType ?? (enterAdvances ? 'next' : undefined)}
        blurOnSubmit={enterAdvances ? true : undefined}
        submitBehavior={enterAdvances ? 'blurAndSubmit' : multiline ? 'newline' : undefined}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={accessibilityLabel ?? label}
        onContentSizeChange={
          multiline
            ? (e) => {
                // Empty field stays one line. iOS ScrollView often reports the
                // whole body height as contentSize when there is no text yet.
                if (!value) {
                  setGrowHeight(OB_FIELD_LINE_MIN);
                  return;
                }
                const textH = Math.ceil(e.nativeEvent.contentSize.height);
                // Hard returns in the answer (wrapping still uses contentSize).
                const hardLines = Math.max(1, value.split('\n').length);
                // Reject absurd sizes: empty-ish answers should not become a paragraph box.
                const reportedLines = Math.max(1, Math.ceil(textH / OB_FIELD_LINE));
                const safeLines =
                  reportedLines > hardLines + 3 && value.length < 80
                    ? Math.min(hardLines + 1, OB_FIELD_MAX_LINES)
                    : Math.min(reportedLines, OB_FIELD_MAX_LINES);
                const next = Math.max(
                  OB_FIELD_LINE_MIN,
                  OB_FIELD_PAD_Y * 2 + OB_FIELD_LINE * safeLines
                );
                setGrowHeight((prev) => (prev === next ? prev : next));
              }
            : undefined
        }
        style={{
          backgroundColor: OB.paper,
          borderWidth: OB_BORDER,
          borderColor: OB.navy,
          paddingHorizontal: 14,
          paddingVertical: OB_FIELD_PAD_Y,
          fontSize: 17,
          lineHeight: OB_FIELD_LINE,
          color: OB.ink,
          minHeight: OB_FIELD_LINE_MIN,
          // Keep the box content-sized; do not stretch to fill the scroll body.
          alignSelf: 'stretch',
          ...(multiline ? { height: growHeight } : null),
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
// Picked rows turn periwinkle by default; success rows (contacts / invites
// sent) turn green. Color is never the only signal: ticks / switches stay.
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
  idleFill,
  /**
   * What "selected" looks like: pick = pale blue (default), success = green
   * wash for done moments (contacts loaded, invite sent).
   */
  selectedTone = 'pick',
  /** Shorter row for dense lists (still ≥ 44pt tall). */
  compact = false
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
  selectedTone?: 'pick' | 'success';
  compact?: boolean;
}) {
  const role = variant === 'checkbox' ? 'checkbox' : variant === 'switch' ? 'switch' : 'button';
  // THIS SECTION DOES: choose the fill for a picked row (blue pick vs green done).
  const selectedFill = selectedTone === 'success' ? OB.greenWash : OB.periwinkle;
  const markColor = selectedTone === 'success' && selected ? OB.green : OB.navy;
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
        // ACCESSIBILITY: compact stays at least 44pt so taps stay comfortable.
        minHeight: compact ? 44 : 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: compact ? 10 : 14,
        paddingHorizontal: compact ? 12 : 16,
        paddingVertical: compact ? 9 : 15,
        backgroundColor: selected ? selectedFill : idleFill ?? OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy,
        opacity: disabled ? 0.55 : 1
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 10 : 14,
          flex: 1,
          minWidth: 0
        }}
      >
        {variant === 'checkbox' ? <OBCheckBox checked={selected} size={compact ? 18 : 22} /> : null}
        <Text
          className={compact ? 'font-sans-sb text-[14px]' : 'font-sans-sb text-[16px]'}
          style={{ color: OB.navy, flexShrink: 1 }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
      {variant === 'switch' ? <OBSwitchMark on={selected} /> : null}
      {right}
      {variant === 'plain' && mark ? (
        <Text className="font-sans-b text-[15px]" style={{ color: markColor }}>
          {mark}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** The square that fills in when a row is picked. */
function OBCheckBox({ checked, size = 22 }: { checked: boolean; size?: number }) {
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: checked ? OB.pink : 'transparent',
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      {checked ? (
        <Text
          className={size <= 18 ? 'font-sans-b text-[11px]' : 'font-sans-b text-[13px]'}
          style={{ color: OB.onColor }}
        >
          ✓
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The on/off control on notification rows. Custom drawn (not the phone's Switch)
 * so the knob stays white on iOS, Android, and web. When it is on, only the
 * track fills green.
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
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        padding: 3,
        justifyContent: 'center',
        // Green track when on; quiet grey when off.
        backgroundColor: on ? OB.green : OB_SWITCH_OFF,
        alignItems: on ? 'flex-end' : 'flex-start'
      }}
    >
      {/* White circle knob. Never inherits the track color. */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: 'rgba(28,27,22,0.08)'
        }}
      />
    </View>
  );
}

// ============================================
// THE BUTTON: hot pink by default, all-caps, same clean bold sans as every
// other Bridger button (not the pixel header, not Big Shoulders). Square
// corners like every other onboarding box, with a trailing arrow. No pill
// rounding. Reality-check screens pass tone="green" so the blue page is not
// capped with another pink bar.
// ============================================
export function OBCTA({
  label,
  onPress,
  onLongPress,
  delayLongPress,
  analyticsId,
  analyticsProps,
  disabled = false,
  accessibilityLabel,
  tone = 'pink',
  burstEmojis,
  celebrate = true
}: {
  label: string;
  onPress?: () => void;
  /** Optional hold (e.g. co-op auth-code Easter egg). Does not fire onPress. */
  onLongPress?: () => void;
  /** Ms before onLongPress fires. Default is React Native's 500. */
  delayLongPress?: number;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
  disabled?: boolean;
  /** Kept so older call sites still compile; the hard shadow is gone. */
  shadowColor?: string;
  accessibilityLabel?: string;
  /** Pink for question Continues; green for "Let's try again" on the blue stats. */
  tone?: 'pink' | 'green';
  /**
   * Emojis for the Continue shower. Defaults to the party mix. Places passes
   * the favorite country's flag so Continue explodes that flag instead.
   */
  burstEmojis?: string[];
  /**
   * False = fire onPress right away with no emoji Modal. Use this when the tap
   * opens another Modal/sheet (Join the co-op): iOS will not show a second
   * Modal on top of the burst, so the sheet would look like it did nothing.
   */
  celebrate?: boolean;
}) {
  const reduce = useReduceMotion();
  const btnRef = useRef<View>(null);
  // Blocks a second tap from firing onPress twice while the burst plays.
  const advancing = useRef(false);
  const [burst, setBurst] = useState<{ key: number; origin: { x: number; y: number } } | null>(
    null
  );
  const fill = tone === 'green' ? OB.green : OB.pink;
  const shower =
    burstEmojis && burstEmojis.length > 0 ? burstEmojis : ONBOARDING_BURST_EMOJIS;

  // THIS SECTION DOES: advance on the finger-down (pressIn), not press-up.
  // When a text field still has focus, iOS often uses the first press-up to
  // dismiss the keyboard and never delivers onPress. pressIn fires first, so
  // Continue works in one tap. advancing blocks an accidental double advance.
  // Exception: when onLongPress is set (co-op hold), we wait for onPress so a
  // long hold can still win without advancing first.
  const runAdvance = () => {
    if (!onPress || disabled || advancing.current) return;
    advancing.current = true;
    trackClick(analyticsId, analyticsProps);
    Keyboard.dismiss();

    // No shower (or Reduce Motion): run the action now. Critical for Join,
    // which opens its own Modal; a burst Modal would block that sheet on iOS.
    if (reduce || !celebrate) {
      onPress();
      setTimeout(() => {
        advancing.current = false;
      }, 400);
      return;
    }

    btnRef.current?.measureInWindow((x, y, width, height) => {
      setBurst({
        key: Date.now(),
        origin: { x: x + width / 2, y: y + height / 2 }
      });
    });
    setTimeout(() => {
      onPress();
      advancing.current = false;
    }, ONBOARDING_BURST_ADVANCE_MS);
  };

  return (
    <View>
      {/* Burst stays in a transparent Modal so particles can use window
          coordinates. pointerEvents none so it never eats the next screen. */}
      <Modal visible={burst != null} transparent animationType="none">
        <View style={{ flex: 1 }} pointerEvents="none">
          {burst ? (
            <HobbyEmojiBurst
              key={burst.key}
              play
              emoji={shower}
              origin={burst.origin}
              count={22}
              power="boom"
              onPlayStart={fireEmojiBurstHaptics}
              onDone={() => setBurst(null)}
            />
          ) : null}
        </View>
      </Modal>
      <Pressable
        ref={btnRef}
        onPressIn={onLongPress ? undefined : runAdvance}
        onPress={onLongPress ? runAdvance : undefined}
        onLongPress={
          onLongPress && !disabled
            ? () => {
                // Quiet hold path: no click event, no emoji burst.
                onLongPress();
              }
            : undefined
        }
        delayLongPress={delayLongPress}
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
          // Square like every other onboarding box (fields, tiles, progress).
          borderRadius: 0,
          backgroundColor: fill,
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
    </View>
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
  // Skip sits on the canvas, so ink follows the theme (dark mode needs light type).
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      // ACCESSIBILITY: hitSlop keeps a 44pt tap target without a tall empty band
      // that pushes Continue up off the bottom of the screen.
      hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      style={{ alignSelf: 'center', paddingVertical: 2 }}
    >
      <Text
        className="font-sans-sb text-[14px]"
        style={{ color: theme.ink, textDecorationLine: 'underline' }}
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
  // "3/14" sits on the canvas; follow theme ink so dark mode stays readable.
  const theme = useThemeColors();
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
          style={{ letterSpacing: 0.4, color: theme.ink }}
        >
          {done}/{total}
        </Text>
      </View>
    </AnalyticsRegion>
  );
}
