// ============================================
// WHAT THIS FILE DOES (plain English):
// A row of tabs. Two looks: "pill" (rounded segmented control) and
// "underline" (thin bar under the active tab — used on the Profile screen).
// Scrolls sideways when there are more tabs than fit. Design comes from the
// Magic Patterns SegmentedTabs primitive.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { cn } from '../lib/cn';

type SegmentedTabsProps = {
  tabs: string[];
  value: string;
  onChange: (tab: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
};

export function SegmentedTabs({
  tabs,
  value,
  onChange,
  variant = 'pill',
  className
}: SegmentedTabsProps) {
  if (variant === 'underline') {
    return (
      <View className={cn('border-b border-ink-line', className)} accessibilityRole="tablist">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ columnGap: 20 }}
        >
          {tabs.map((tab) => {
            const active = tab === value;
            return (
              <Pressable
                key={tab}
                onPress={() => onChange(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab}
                className="min-h-[44px] justify-end pb-2.5"
              >
                <Text
                  className={cn(
                    'font-sans-b text-[14px] tracking-tight',
                    active ? 'text-ink' : 'text-ink-mute'
                  )}
                >
                  {tab}
                </Text>
                {/* the underline that marks the active tab */}
                <View
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-[3px] rounded-full',
                    active ? 'bg-ink' : 'bg-transparent'
                  )}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      className={cn(
        'flex-row gap-1 rounded-full border border-ink-line bg-canvas-raised p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab}
            className={cn(
              'min-h-[40px] flex-1 items-center justify-center rounded-full px-4 py-2',
              active && 'bg-purple/20'
            )}
          >
            <Text
              className={cn(
                'font-sans-b text-[13px] tracking-tight',
                active ? 'text-ink' : 'text-ink-mute'
              )}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
