// ============================================
// WHAT THIS FILE DOES (plain English):
// A standard list row: optional leading (avatar/icon), bold label, quiet
// sublabel, and either a chevron, custom action (toggle), or nothing.
// Used on Discover for requests and settings rows. Pass analyticsId so each
// row tap is named in analytics (e.g. friends.roster.row).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react-native';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { withAnalyticsPress, type AnalyticsProps } from '../lib/analytics';

type ListRowProps = {
  leading?: React.ReactNode;
  label: string;
  sublabel?: string;
  trailing?: 'chevron' | 'handle' | 'none';
  action?: React.ReactNode;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
} & AnalyticsProps;

export function ListRow({
  leading,
  label,
  sublabel,
  trailing = 'none',
  action,
  onPress,
  className,
  accessibilityLabel,
  analyticsId,
  interactive = true,
  analyticsProps
}: ListRowProps) {
  const c = useThemeColors();

  const body = (
    <>
      {leading}
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-sans-b text-[15px] tracking-tight text-ink">
          {label}
        </Text>
        {sublabel ? (
          <Text numberOfLines={1} className="font-sans-md text-[12px] text-ink-mute">
            {sublabel}
          </Text>
        ) : null}
      </View>
      {action}
      {trailing === 'chevron' ? (
        <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.5} />
      ) : null}
      {trailing === 'handle' ? (
        <GripVerticalIcon size={16} color={c.inkMute} strokeWidth={2.5} />
      ) : null}
    </>
  );

  const classes = cn(
    // bg-surface so dark mode raised cards stay readable with text-ink
    'min-h-[44px] w-full flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-3.5 py-3',
    // Soft ink wash on press (not a fixed light lavender that fights cream type)
    onPress && 'active:bg-ink/5',
    className
  );

  if (onPress || analyticsId) {
    return (
      <Pressable
        onPress={withAnalyticsPress(analyticsId, onPress, { interactive, analyticsProps })}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (sublabel ? `${label}, ${sublabel}` : label)}
        className={classes}
      >
        {body}
      </Pressable>
    );
  }

  return <View className={classes}>{body}</View>;
}
