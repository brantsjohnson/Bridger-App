// ============================================
// WHAT THIS FILE DOES (plain English):
// A calm expandable box for profile sections that can hold 3 items or 300 —
// pixel title, item count, chevron that flips when closed. ShowAllList lives
// here too: a chip list that shows a few items until you ask for the rest.
// Ported from the Magic Patterns CollapsibleSection.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import { cn } from '../lib/cn';
import { useThemeColors } from '../tokens';

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  action,
  children
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  /** small control rendered on the right of the header (e.g. an edit button) */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(defaultOpen);

  return (
    // Profile sections stay plain white on purpose — they are long reading
    // blocks, so they keep the calmest background in the app.
    <View className="rounded-card border border-ink-line bg-white dark:bg-canvas-raised">
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${title} section, ${open ? 'expanded' : 'collapsed'}`}
          className="min-h-[32px] min-w-0 flex-1 flex-row items-center gap-2"
        >
          <ChevronDownIcon
            size={16}
            color={c.inkMute}
            strokeWidth={2.6}
            style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}
          />
          <Text numberOfLines={1} className="shrink font-pixel text-[15px] text-ink">
            {title}
          </Text>
          {typeof count === 'number' ? (
            <Text className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 font-sans-b text-[11px] text-ink-soft">
              {count}
            </Text>
          ) : null}
        </Pressable>
        {action}
      </View>
      {open ? <View className="px-4 pb-4">{children}</View> : null}
    </View>
  );
}

/** Long list that stays scannable — shows a slice until asked for the rest. */
export function ShowAllList({
  items,
  total,
  initial = 4
}: {
  items: string[];
  total: number;
  initial?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, initial);

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {shown.map((item) => (
          <View
            key={item}
            className="rounded-full border border-ink-line bg-surface px-3 py-1.5"
          >
            <Text className="font-sans-sb text-[13px] text-ink">{item}</Text>
          </View>
        ))}
      </View>
      {total > initial ? (
        <Pressable
          onPress={() => setAll((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={all ? 'Show less' : `Show all ${total}`}
          className="mt-2.5 min-h-[32px] justify-center self-start"
        >
          <Text className="font-sans-b text-[12px] text-purple">
            {all ? 'Show less' : `Show all ${total}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
