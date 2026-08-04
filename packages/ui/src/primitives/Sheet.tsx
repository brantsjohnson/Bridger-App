// ============================================
// WHAT THIS FILE DOES (plain English):
// A bottom sheet that slides up over a dimmed backdrop — used for short forms
// (create a poll, touch-grass detail). Matches the Magic Patterns Sheet: grab
// handle, title, close, optional footer button row.
// Pass surface + parentScreen so open/dismiss + dwell_ms are measured as their
// own analytics surface, separate from the screen behind the sheet.
// ============================================
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { useThemeColors } from '../tokens';
import { SurfaceHost, withAnalyticsPress } from '../lib/analytics';

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  /** Own analytics surface name (e.g. touch_grass_sheet). */
  surface,
  /** Screen that launched this sheet (e.g. home or events). */
  parentScreen,
  /** Element id for the close / dismiss control. */
  dismissAnalyticsId
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  surface?: string;
  parentScreen?: string;
  dismissAnalyticsId?: string;
}) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  const handleClose = withAnalyticsPress(dismissAnalyticsId, onClose, {
    interactive: true,
    analyticsProps: surface ? { surface, parent_screen: parentScreen } : undefined
  });

  const body = (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
          className="absolute inset-0 bg-ink/25"
        />
        <View
          accessibilityViewIsModal
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="rounded-t-3xl border-t border-ink-line bg-canvas px-5 pt-3"
        >
          <View accessible={false} className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink-line" />
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-sans-b text-[17px] tracking-tight text-ink">{title}</Text>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-8 w-8 items-center justify-center rounded-full bg-ink/5 active:opacity-80"
            >
              <XIcon size={16} color={c.inkSoft} strokeWidth={2.5} />
            </Pressable>
          </View>
          {children}
          {footer ? <View className="mt-5">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );

  // When a surface name is given, wrap so open/dismiss dwell is recorded.
  if (surface) {
    return (
      <SurfaceHost surface={surface} parentScreen={parentScreen} open={open}>
        {body}
      </SurfaceHost>
    );
  }

  return body;
}
