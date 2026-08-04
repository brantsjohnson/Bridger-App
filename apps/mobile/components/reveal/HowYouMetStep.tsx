// ============================================
// WHAT THIS FILE DOES (plain English):
// Reveal Screen 0 — "How did you two meet?" Asked once before anything private
// is shown. Pick just-met or already-know, and optionally save a coarse place
// ("RiNo, Denver · approximate"). Default checkbox is ON; uncheck to skip.
//
// PRIVACY: place is neighborhood-scale only. Only you two see it.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon, MapPinIcon, SparklesIcon, UsersIcon } from 'lucide-react-native';
import { REVEAL, type MeetContext } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { NEARBY_AREA } from '../../data/reveal';

type Props = {
  context: MeetContext | null;
  onContext: (c: MeetContext) => void;
  recordPlace: boolean;
  onRecordPlace: (v: boolean) => void;
};

export function HowYouMetStep({
  context,
  onContext,
  recordPlace,
  onRecordPlace
}: Props) {
  const options: Array<{
    value: MeetContext;
    label: string;
    Icon: typeof SparklesIcon;
  }> = [
    { value: 'just-met', label: 'We just met', Icon: SparklesIcon },
    {
      value: 'already-know',
      label: 'We already know each other',
      Icon: UsersIcon
    }
  ];

  return (
    <View className="gap-3">
      {options.map(({ value, label, Icon }) => {
        const selected = context === value;
        return (
          <Pressable
            key={value}
            onPress={withAnalyticsPress(REVEAL.flow.how_you_met_choice, () =>
              onContext(value)
            )}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            className={cn(
              'min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 px-4 py-4',
              selected
                ? 'border-canvas bg-white/10'
                : 'border-white/20 bg-white/5'
            )}
          >
            <Icon
              size={20}
              color={selected ? '#F5F0E6' : '#C8C2B4'}
              strokeWidth={2.4}
            />
            <Text
              className={cn(
                'font-sans-b text-[15px]',
                selected ? 'text-canvas' : 'text-white/70'
              )}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}

      {/* PRIVACY: opt-in coarse place — default on, never precise */}
      <View className="rounded-2xl border border-white/20 bg-white/5 p-4">
        <Pressable
          onPress={withAnalyticsPress(REVEAL.flow.record_place_toggle, () =>
            onRecordPlace(!recordPlace)
          )}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: recordPlace }}
          accessibilityLabel="Record where you met"
          className="min-h-[44px] flex-row items-center gap-3"
        >
          <View
            className={cn(
              'h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
              recordPlace ? 'border-success bg-success' : 'border-white/35'
            )}
          >
            {recordPlace ? (
              <CheckIcon size={16} color="#FFFFFF" strokeWidth={3.2} />
            ) : null}
          </View>
          <Text className="font-sans-b text-[15px] text-canvas">
            Record where you met
          </Text>
        </Pressable>

        {recordPlace ? (
          <View className="mt-3 flex-row items-center gap-2 rounded-2xl bg-[#DFF3E4] px-3 py-2.5">
            <MapPinIcon size={16} color="#00A676" strokeWidth={2.6} />
            <Text className="font-sans-sb text-[14px] text-ink">
              {NEARBY_AREA} · approximate
            </Text>
          </View>
        ) : null}

        <Text className="mt-2.5 font-sans-md text-[12px] text-white/55">
          Only you two see it · edit or remove anytime
        </Text>
      </View>
    </View>
  );
}
