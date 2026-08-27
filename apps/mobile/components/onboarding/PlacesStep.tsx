// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10E — "Your places." Three light town fields: where you're from, where
// you live now, and the best place you've visited. Skippable. Towns only, never
// street addresses (PRIVACY). These become profile facts whose audience is set
// on the Privacy & Control screen.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { TextField } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

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
      purpose="Towns only, never an address."
      ask="Your places"
      accent="amber"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <TextField
          labelTone="onaccent"
          label="Hometown"
          value={hometown}
          onChange={onChangeHometown}
          placeholder="Where you're from"
          analyticsId={ONBOARDING.taste.hometown_input}
        />
        <TextField
          labelTone="onaccent"
          label="Current town"
          value={currentTown}
          onChange={onChangeCurrent}
          placeholder="Where you live now"
          analyticsId={ONBOARDING.taste.current_town_input}
        />
        <TextField
          labelTone="onaccent"
          label="Favorite place you've visited"
          value={favoritePlace}
          onChange={onChangeFavorite}
          placeholder="The best trip"
          analyticsId={ONBOARDING.taste.favorite_place_input}
        />
      </View>
    </OnboardingStep>
  );
}
