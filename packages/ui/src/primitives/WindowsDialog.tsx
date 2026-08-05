// ============================================
// WHAT THIS FILE DOES (plain English):
// Old-Windows chrome used for the 404 popup: a square beveled dialog with a
// blue title bar, plus a matching square OK button. Ported from Magic Patterns
// (design/magic-patterns/.../WindowsDialog.tsx) into React Native.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';
import { METAL_BEVEL, useThemeColors } from '../tokens';

/** Old-Windows chrome: square, beveled, blue title bar. Used sparingly. */
export function WindowsDialog({
  title,
  children,
  onClose,
  closeAnalyticsId,
  className
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  /** Taxonomy id for the title-bar X. */
  closeAnalyticsId?: string;
  className?: string;
}) {
  const c = useThemeColors();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={title}
      className={cn(
        'w-full max-w-[300px] border-2 border-t-metal-hi border-l-metal-hi border-b-metal-lo border-r-metal-lo bg-metal-face p-[3px]',
        className
      )}
    >
      <View className="flex-row items-center justify-between bg-blue px-2 py-1">
        <Text className="font-pixel text-[13px] leading-none text-white">{title}</Text>
        {onClose ? (
          <Pressable
            onPress={
              closeAnalyticsId
                ? withAnalyticsPress(closeAnalyticsId, onClose)
                : onClose
            }
            accessibilityRole="button"
            accessibilityLabel="Close"
            className={cn(METAL_BEVEL, 'h-4 w-4 items-center justify-center')}
          >
            <XIcon size={10} color={c.ink} strokeWidth={4} />
          </Pressable>
        ) : null}
      </View>
      <View className="px-4 py-5">{children}</View>
    </View>
  );
}

/** Square metallic button matching the dialog chrome. */
export function WindowsButton({
  children,
  onPress,
  autoFocusRing = false,
  analyticsId,
  accessibilityLabel
}: {
  children: React.ReactNode;
  onPress?: () => void;
  autoFocusRing?: boolean;
  analyticsId?: string;
  accessibilityLabel?: string;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={
        analyticsId
          ? withAnalyticsPress(analyticsId, () => onPress?.())
          : onPress
      }
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        METAL_BEVEL,
        'relative min-w-[84px] items-center px-4 py-1.5 active:opacity-95'
      )}
    >
      {autoFocusRing ? (
        <View
          pointerEvents="none"
          accessible={false}
          className="absolute inset-[2px] border border-dotted border-ink/70"
        />
      ) : null}
      <Text className="font-sans-b text-[13px]" style={{ color: c.ink }}>
        {children}
      </Text>
    </Pressable>
  );
}
