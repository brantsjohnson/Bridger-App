// ============================================
// WHAT THIS FILE DOES (plain English):
// A labeled text box used on forms (sign-up, settings, etc.). Matches the Magic
// Patterns TextField: small bold label on top, rounded raised box under it, and
// an optional error line in coral. Never invents helper paragraphs — just the
// label and the field.
//
// OTP: type="otp" tells iOS / Android / Mac (Safari) to offer one-tap fill from
// the SMS (keyboard suggestion / autofill), so people do not have to copy the
// code by hand.
// ============================================
import React from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { trackUi } from '@bridger/shared';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import type { AnalyticsProps } from '../lib/analytics';

type TextFieldProps = {
  /** leave empty when the parent draws its own label (e.g. required asterisk) */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** 'email' | 'password' | 'text' | 'phone' | 'otp' — controls keyboard + autofill */
  type?: 'text' | 'email' | 'password' | 'phone' | 'otp';
  multiline?: boolean;
  autoComplete?:
    | 'email'
    | 'password'
    | 'new-password'
    | 'off'
    | 'tel'
    | 'sms-otp'
    | 'one-time-code';
  /** Focus this field as soon as it mounts (OTP step uses this). */
  autoFocus?: boolean;
  accessibilityLabel?: string;
  /** Extra spoken hint (e.g. "required"). */
  accessibilityHint?: string;
  /** called when the user presses Enter / Done on the keyboard */
  onSubmitEditing?: () => void;
  /** On onboarding color washes, labels use dark onaccent type (pastel bg stays light in dark mode). */
  labelTone?: 'default' | 'onaccent';
} & Pick<AnalyticsProps, 'analyticsId'>;

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  multiline = false,
  autoComplete,
  autoFocus = false,
  accessibilityLabel,
  accessibilityHint,
  analyticsId,
  onSubmitEditing,
  labelTone = 'default'
}: TextFieldProps) {
  const c = useThemeColors();
  const labelClass =
    labelTone === 'onaccent'
      ? 'mb-1.5 font-sans-b text-[12px] text-onaccent/80'
      : 'mb-1.5 font-sans-b text-[12px] text-ink-soft';

  // OTP: one-time-code is the cross-platform value (iOS QuickType, Android
  // autofill, Mac/Safari Continuity). textContentType is what iOS needs.
  const isOtp = type === 'otp';
  const resolvedAutoComplete =
    autoComplete ??
    (type === 'phone' ? 'tel' : isOtp ? 'one-time-code' : undefined);

  return (
    <View className="w-full">
      {label ? <Text className={labelClass}>{label}</Text> : null}
      <View
        className={cn(
          'rounded-2xl border bg-canvas-raised px-4',
          multiline ? 'py-3' : 'h-12 justify-center',
          error ? 'border-coral' : 'border-ink-line'
        )}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={c.inkMute}
          secureTextEntry={type === 'password'}
          autoCapitalize={type === 'email' || isOtp ? 'none' : 'sentences'}
          autoCorrect={type === 'text'}
          autoFocus={autoFocus}
          keyboardType={
            type === 'email'
              ? 'email-address'
              : type === 'phone'
                ? 'phone-pad'
                : isOtp
                  ? 'number-pad'
                  : 'default'
          }
          autoComplete={resolvedAutoComplete}
          textContentType={
            type === 'phone' ? 'telephoneNumber' : isOtp ? 'oneTimeCode' : undefined
          }
          // Android: ask the OS autofill service to offer the SMS code.
          importantForAutofill={
            isOtp || type === 'phone' || type === 'password' ? 'yes' : 'auto'
          }
          // Never spell-check a code or phone number.
          spellCheck={false}
          // Cap OTP length so autofill pastes cleanly.
          maxLength={isOtp ? 8 : undefined}
          // Web / Mac Safari: map onto HTML autocomplete for Continuity fill.
          {...(Platform.OS === 'web' && isOtp
            ? ({ inputMode: 'numeric' } as object)
            : null)}
          multiline={multiline}
          returnKeyType={onSubmitEditing ? 'done' : undefined}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={!!onSubmitEditing}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={
            accessibilityHint ??
            (isOtp
              ? 'When the text arrives, tap the suggested code on the keyboard'
              : undefined)
          }
          className="font-sans-sb text-[16px] text-ink"
          style={{ padding: 0 }}
          onFocus={() => {
            // Focus only — never log the typed value (PRIVACY: no content/PII).
            if (analyticsId) trackUi('focus', analyticsId);
          }}
        />
      </View>
      {error ? <Text className="mt-1.5 font-sans-sb text-[12px] text-coral">{error}</Text> : null}
    </View>
  );
}
