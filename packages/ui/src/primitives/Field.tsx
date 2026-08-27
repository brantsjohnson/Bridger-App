// ============================================
// WHAT THIS FILE DOES (plain English):
// A labeled text box used on forms (sign-up, settings, etc.). Matches the Magic
// Patterns TextField: small bold label on top, rounded raised box under it, and
// an optional error line in coral. Never invents helper paragraphs — just the
// label and the field.
// ============================================
import React from 'react';
import { Text, TextInput, View } from 'react-native';
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
  /** 'email' | 'password' | 'text' — controls keyboard + secure entry */
  type?: 'text' | 'email' | 'password';
  multiline?: boolean;
  autoComplete?: 'email' | 'password' | 'new-password' | 'off';
  accessibilityLabel?: string;
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
  accessibilityLabel,
  analyticsId,
  onSubmitEditing,
  labelTone = 'default'
}: TextFieldProps) {
  const c = useThemeColors();
  const labelClass =
    labelTone === 'onaccent'
      ? 'mb-1.5 font-sans-b text-[12px] text-onaccent/80'
      : 'mb-1.5 font-sans-b text-[12px] text-ink-soft';

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
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type === 'text'}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          autoComplete={autoComplete}
          multiline={multiline}
          returnKeyType={onSubmitEditing ? 'done' : undefined}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={!!onSubmitEditing}
          accessibilityLabel={accessibilityLabel ?? label}
          className="font-sans-sb text-[14px] text-ink"
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
