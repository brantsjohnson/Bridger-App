// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10E - "Your places." Three light town questions: where you're from, where
// you live now, and the best place you've visited. Skippable. The amber chip
// says "Info for the profile." Still towns only, never street addresses
// (PRIVACY). Hometown / current town become About Me rows; the favorite trip
// is geocoded onto the travel map with a FAV star when possible.
//
// LOOK: three white typing boxes with the hard navy outline, each with its own
// small navy label above it. All the paint comes from the shared onboarding
// parts.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OBField } from './onboarding-ui';

export function PlacesStep({
  step,
  total,
  hometown,
  currentTown,
  favoritePlace,
  onChangeHometown,
  onChangeCurrent,
  onChangeFavorite,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  hometown: string;
  currentTown: string;
  favoritePlace: string;
  onChangeHometown: (v: string) => void;
  onChangeCurrent: (v: string) => void;
  onChangeFavorite: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Info for the profile"
      ask="Your places"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: the three town boxes. PRIVACY: we ask for a town
          name only, so nothing here can point at a doorstep. */}
      <View style={{ gap: 18 }}>
        <OBField
          label="Hometown"
          value={hometown}
          onChange={onChangeHometown}
          placeholder="Where you're from"
          analyticsId={ONBOARDING.taste.hometown_input}
        />
        <OBField
          label="Current town"
          value={currentTown}
          onChange={onChangeCurrent}
          placeholder="Where you live now"
          analyticsId={ONBOARDING.taste.current_town_input}
        />
        <OBField
          label="Favorite place you've visited"
          value={favoritePlace}
          onChange={onChangeFavorite}
          placeholder="The best trip"
          analyticsId={ONBOARDING.taste.favorite_place_input}
        />
        {/* Encourage filling the map later with more trips. */}
        <Text
          className="font-sans-md text-[13px] text-ink-mute"
          accessibilityRole="text"
        >
          We will star this one as FAV on your map. You can keep adding other
          places you have traveled from your profile.
        </Text>
      </View>
    </OnboardingStep>
  );
}
