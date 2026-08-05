// ============================================
// WHAT THIS FILE DOES (plain English):
// A shared memory on a friend's profile — how you met (at an event, through
// someone, or at a coarse place). Either of you can edit or remove it later.
// PRIVACY: place rows are approximate by design.
// ============================================
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { CalendarIcon, MapPinIcon, NotebookPenIcon, UsersIcon } from 'lucide-react-native';
import type { HowYouMet } from '@bridger/shared';
import { PixelHeading, cn, useThemeColors } from '@bridger/ui';
import { getHowYouMet } from '../../data/reveal';

const TINT = {
  event: 'bg-purple',
  via: 'bg-coral',
  place: 'bg-teal',
  note: 'bg-amber'
} as const;

function title(m: HowYouMet): string {
  if (m.kind === 'place') return `Met in ${m.label}`;
  if (m.kind === 'via') return `Met through ${m.label}`;
  if (m.kind === 'note') return m.label;
  return `Met at ${m.label}`;
}

export function HowYouMetCard({ personId }: { personId: string }) {
  const c = useThemeColors();
  const [records, setRecords] = useState<HowYouMet[]>([]);

  useEffect(() => {
    void getHowYouMet(personId).then(setRecords);
  }, [personId]);

  if (records.length === 0) return null;

  return (
    <View>
      <PixelHeading size="sm">How you met</PixelHeading>
      <View className="mt-2 gap-2">
        {records.map((m) => {
          const Icon =
            m.kind === 'event'
              ? CalendarIcon
              : m.kind === 'via'
                ? UsersIcon
                : m.kind === 'note'
                  ? NotebookPenIcon
                  : MapPinIcon;
          // White icon on the bright tint — same rule as other vivid chips.
          return (
            <View
              key={`${m.kind}-${m.label}-${m.date}`}
              className="flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-3.5 py-3"
            >
              <View
                className={cn(
                  'h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                  TINT[m.kind]
                )}
              >
                <Icon size={20} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-b text-[16px] text-ink" numberOfLines={1}>
                  {title(m)}
                </Text>
                <Text
                  className="font-sans-sb text-[13px] text-ink-mute"
                  numberOfLines={1}
                >
                  {m.date}
                  {m.viaName ? ` · via ${m.viaName}` : ''}
                  {m.approximate ? ' · approximate' : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text className="mt-2 font-sans-md text-[12px]" style={{ color: c.inkMute }}>
        A shared memory · either of you can edit or remove it
      </Text>
    </View>
  );
}
