// ============================================
// WHAT THIS FILE DOES (plain English):
// A round search bar with a magnifying-glass icon and an optional clear button.
// Built and ready for Friends (and Messages later). On Friends it stays behind
// the searchEnabled flag — when the flag is off, the screen does not render it.
// ============================================
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SearchIcon, XIcon } from 'lucide-react-native';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const c = useThemeColors();

  return (
    <View
      className={cn(
        'h-11 flex-row items-center gap-2 rounded-full border border-ink-line bg-canvas-raised px-4',
        className
      )}
    >
      <SearchIcon size={17} color={c.inkMute} strokeWidth={2.5} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.inkMute}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink"
        style={{ padding: 0 }}
      />
      {value ? (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="Clear"
          className="h-6 w-6 items-center justify-center rounded-full bg-ink/5 active:opacity-80"
        >
          <XIcon size={14} color={c.inkSoft} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}
