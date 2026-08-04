// ============================================
// WHAT THIS FILE DOES (plain English):
// The only "meet new people" question in onboarding. Two tiles (same visual as
// the notifications step — a check appears in the corner when picked):
//   • People in the same city — COMING SOON (a map-style tile you can tap to
//     register interest; we ask which city so we can turn it on for you). We
//     only ask where you live here, because here is where we say we'll use it.
//   • People anywhere — live today.
// If you pick same-city you must tell us the city before continuing. City only,
// never a street address; matching stays inside your friends' networks.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon, GlobeIcon, MapIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, Card, TextField, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import type { MeetScope } from '../../data/onboarding';

const SHAPES = [
  { borderTopLeftRadius: 28, borderTopRightRadius: 10, borderBottomRightRadius: 28, borderBottomLeftRadius: 10 },
  { borderTopLeftRadius: 10, borderTopRightRadius: 28, borderBottomRightRadius: 10, borderBottomLeftRadius: 28 }
];

export function MeetStep({
  step,
  total,
  scope,
  city,
  onScope,
  onCity,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  scope: MeetScope | null;
  city: string;
  onScope: (s: MeetScope) => void;
  onCity: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const options: Array<{
    id: MeetScope;
    label: string;
    line: string;
    Icon: typeof GlobeIcon;
    accent: Accent;
    comingSoon?: boolean;
    analyticsId: string;
  }> = [
    {
      id: 'near',
      label: 'People in the same city',
      line: 'Coming soon',
      Icon: MapIcon,
      accent: 'teal',
      comingSoon: true,
      analyticsId: ONBOARDING.meet.nearby
    },
    {
      id: 'anywhere',
      label: 'People anywhere',
      line: 'No distance limit',
      Icon: GlobeIcon,
      accent: 'purple',
      analyticsId: ONBOARDING.meet.anywhere
    }
  ];

  // Can't move on until they pick, and if they pick same-city we need the city.
  const needsCity = scope === 'near' && city.trim().length === 0;
  const ctaDisabled = scope == null || needsCity;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends of your friends, never strangers."
      ask="Who should we introduce you to?"
      accent="green"
      ctaDisabled={ctaDisabled}
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <View className="flex-row gap-3">
          {options.map((o, i) => {
            const on = scope === o.id;
            const Icon = o.Icon;
            const token = ACCENTS[o.accent];
            const onWhite = token.text === 'text-white';
            const textClass = on ? token.text : 'text-ink';
            return (
              <View key={o.id} className="flex-1">
                <Pressable
                  onPress={withAnalyticsPress(o.analyticsId, () => onScope(o.id))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={o.comingSoon ? `${o.label} (coming soon)` : o.label}
                  style={SHAPES[i]}
                  className={cn(
                    'min-h-[132px] items-start gap-2 px-4 py-5',
                    on ? token.bg : 'border border-ink-line bg-surface'
                  )}
                >
                  <Icon size={24} strokeWidth={2.4} color={on && onWhite ? '#FFFFFF' : '#1C1B16'} />
                  <Text className={cn('font-sans-b text-[15px] leading-tight', textClass)}>
                    {o.label}
                  </Text>
                  {o.comingSoon ? (
                    <View
                      className={cn(
                        'rounded-full px-2 py-0.5',
                        on ? 'bg-white/25' : 'bg-ink/[0.06]'
                      )}
                    >
                      <Text className={cn('font-sans-b text-[11px]', textClass)}>Coming soon</Text>
                    </View>
                  ) : (
                    <Text className={cn('font-sans-sb text-[12px] opacity-70', textClass)}>
                      {o.line}
                    </Text>
                  )}

                  {/* the check corner — same language as the notifications tiles */}
                  {on ? (
                    <View className="absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-white">
                      <CheckIcon size={12} color="#1C1B16" strokeWidth={3.5} />
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {scope === 'near' ? (
          <View className="gap-1.5">
            <TextField
              label="Your city"
              value={city}
              onChange={onCity}
              placeholder="Portland, OR"
              analyticsId={ONBOARDING.meet.city_input}
            />
            <Text className="px-1 font-sans-sb text-[12px] text-ink-mute">
              Same-city matching is coming soon. Tell us your city and we'll turn it on for you.
            </Text>
          </View>
        ) : null}

        <Card>
          <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
            City only. Bridger never asks for your address, and matching stays inside your friends'
            networks.
          </Text>
        </Card>
      </View>
    </OnboardingStep>
  );
}
