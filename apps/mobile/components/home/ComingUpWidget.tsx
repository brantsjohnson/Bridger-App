// ============================================
// WHAT THIS FILE DOES (plain English):
// Birthdays and your private date notes, in one strip. Today is loudest (coral
// chip); this week is warm; further out is amber. Tap opens that friend's
// profile page (not the Friends roster).
// Analytics: each row uses coming_up_card (no names/labels in event props).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CakeIcon, FlagIcon } from 'lucide-react-native';
import { HOME, type UpcomingItem } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';

function countdownTone(when: string) {
  const w = when.toLowerCase();
  if (w.includes('today')) return 'bg-coral text-white';
  if (w.includes('week')) return 'bg-[#BBD6FB] text-onaccent';
  return 'bg-amber text-onaccent';
}

export function ComingUpWidget({
  items,
  onOpenPerson
}: {
  items: UpcomingItem[];
  onOpenPerson?: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      {items.map((item) => {
        const birthday = item.kind === 'birthday';
        return (
          <Pressable
            key={item.id}
            onPress={withAnalyticsPress(HOME.announcements.coming_up_card, () =>
              onOpenPerson?.(item.personId)
            )}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            className={cn(
              'w-full flex-row items-center gap-3 rounded-card px-4 py-3 active:opacity-90',
              birthday ? 'bg-[#FFC0D7]' : 'bg-[#D5C2FF]'
            )}
          >
            {birthday ? (
              <CakeIcon size={20} color="#FF3E8A" strokeWidth={2.4} />
            ) : (
              <FlagIcon size={20} color="#6B2FEA" strokeWidth={2.4} />
            )}
            <Text className="min-w-0 flex-1 font-sans-b text-[15px] text-onaccent" numberOfLines={1}>
              {item.label}
            </Text>
            <View className={cn('shrink-0 rounded-full px-2.5 py-1', countdownTone(item.when))}>
              <Text
                className={cn(
                  'font-sans-b text-[12px]',
                  item.when.toLowerCase().includes('today') ? 'text-white' : 'text-onaccent'
                )}
              >
                {item.when}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
