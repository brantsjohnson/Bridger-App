// ============================================
// WHAT THIS FILE DOES (plain English):
// The scaffold every screen is built from, so all screens share the same shape:
//  - Screen: fills the display and paints the background (eggshell canvas by
//    default; onboarding/fill flows may go full color).
//  - ScreenHeader: the top row — a pixel screen title on the left, an optional
//    back button, and the reserved top-right Messages (chat) button per
//    MAGIC-PATTERNS.md. No notification bell.
//  - ScreenBody: the scrolling content area, padded, with room at the bottom so
//    the floating tab bar never covers the last item.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon, MessageSquareIcon } from 'lucide-react-native';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { PixelHeading } from '../primitives/PixelHeading';
import { SynthGrid } from './SynthGrid';

type ScreenTone = 'canvas' | 'color' | 'synth' | 'plain';

export function Screen({
  children,
  tone = 'canvas',
  accent,
  className
}: {
  children: React.ReactNode;
  /** eggshell by default; 'color' for onboarding/fill flows; 'synth' = Discover grid. */
  tone?: ScreenTone;
  /** a Tailwind bg class used when tone is 'color', e.g. "bg-purple/20". */
  accent?: string;
  className?: string;
}) {
  const bg =
    tone === 'color'
      ? accent ?? 'bg-purple/20'
      : tone === 'plain'
        ? ''
        : 'bg-canvas';

  return (
    <View className={cn('flex-1', bg, className)}>
      {/* Discover alone gets the drifting synth grid behind content */}
      {tone === 'synth' ? <SynthGrid /> : null}
      <View className="relative z-10 flex-1">{children}</View>
    </View>
  );
}

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** top-right slot is reserved for Messages (chat) */
  onMessages?: () => void;
  /** true = chat not shipped yet, show the icon dimmed and disabled */
  messagesDormant?: boolean;
  unreadMessages?: boolean;
  hideMessages?: boolean;
  trailing?: React.ReactNode;
};

export function ScreenHeader({
  title,
  onBack,
  onMessages,
  messagesDormant = false,
  unreadMessages = false,
  hideMessages = false,
  trailing
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-3 px-5 pb-3">
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-surface active:opacity-80"
        >
          <ChevronLeftIcon size={20} color={c.ink} strokeWidth={2.5} />
        </Pressable>
      ) : null}

      <PixelHeading size="lg" className="flex-1" numberOfLines={1}>
        {title}
      </PixelHeading>

      {trailing}

      {!hideMessages ? (
        <Pressable
          onPress={onMessages}
          disabled={messagesDormant}
          accessibilityRole="button"
          accessibilityLabel="Messages"
          className={cn(
            'relative h-10 w-10 items-center justify-center rounded-full active:opacity-80',
            // solid near-black so it stays visible on the eggshell canvas
            messagesDormant ? 'border border-ink-line bg-canvas-raised' : 'bg-carbon'
          )}
        >
          <MessageSquareIcon
            size={18}
            color={messagesDormant ? c.inkMute : '#FFFFFF'}
            strokeWidth={2.4}
          />
          {unreadMessages ? (
            <View className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-coral" />
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenBody({
  children,
  padded = true,
  /** leave room for the floating tab bar (turn off on auth / full-screen flows) */
  tabBarInset = true,
  className
}: {
  children: React.ReactNode;
  padded?: boolean;
  tabBarInset?: boolean;
  className?: string;
}) {
  return (
    <ScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: padded ? 20 : 0,
        paddingTop: 8,
        // leave room so the floating tab bar never hides the last item
        paddingBottom: tabBarInset ? 140 : 32
      }}
    >
      {children}
    </ScrollView>
  );
}

/** A plain error/empty label helper used in a few placeholder spots. */
export function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('font-sans text-[14px] text-ink-mute', className)}>{children}</Text>;
}
