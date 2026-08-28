// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10 - the little lead-in before the fun, low-pressure questions (job,
// song, nights out, color, places, recap). It names what is coming up as a
// simple list, then one button: "Let's go." Everything after this is skippable.
//
// LOOK: mostly type. The big blue question and its sentence come from the shared
// frame, then a small pink "What's coming up" hint over a plain list of rows,
// each with a little colored square and a hairline under it.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBKicker } from './onboarding-ui';

/** The playful things we are about to ask, each with its own square marker. */
const COMING_UP: { label: string; dot: string }[] = [
  { label: 'Current job', dot: OB.pink },
  { label: 'Dream job', dot: OB.amber },
  { label: 'Song on repeat', dot: OB.green },
  { label: 'Your color', dot: OB.blue },
  { label: 'Your places', dot: OB.orange },
  { label: 'Your weekly recap', dot: OB.pink }
];

/** The hairline that sits under every preview row except the last one. */
const ROW_LINE = 'rgba(39,64,135,0.28)';

export function TasteIntroStep({
  step,
  total,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="It got addictive. Let's try again."
      ask="A taste of Bridger"
      blurb="Now a few questions to get us started. You can answer more once you are in the app to get more out of it."
      cta="Let's go"
      continueAnalyticsId={ONBOARDING.taste.start}
      onContinue={onNext}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: a non-tappable preview of what's coming next. */}
      <AnalyticsRegion analyticsId={ONBOARDING.taste.preview_list} interactive={false}>
        <View style={{ gap: 14, paddingTop: 12 }}>
          <OBKicker>{"What's coming up"}</OBKicker>
          <View>
            {COMING_UP.map((item, i) => (
              <View
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  borderBottomWidth: i < COMING_UP.length - 1 ? 1 : 0,
                  borderBottomColor: ROW_LINE
                }}
              >
                {/* The little colored square is decoration, so readers skip it. */}
                <View
                  accessible={false}
                  pointerEvents="none"
                  style={{ width: 7, height: 7, flexShrink: 0, backgroundColor: item.dot }}
                />
                <Text className="font-sans-md text-[17px]" style={{ color: OB.blue }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </AnalyticsRegion>
    </OnboardingStep>
  );
}
