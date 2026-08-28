// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10E - "Your places." Hometown and current town stay as light text
// questions (towns only, never street addresses). Favorite place uses a map
// search that drops a FAV pin on Places traveled. Skippable. The amber chip
// says "Info for the profile."
//
// PRODUCT NOTE (not shown on this screen): We star this one as FAV on your
// map. You can keep adding other places from your profile. That behavior
// lives in the save / map code, not as onboarding copy.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import type { GeocodeHit } from '../../lib/geocode';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingPlacePicker } from './OnboardingPlacePicker';
import { OBField } from './onboarding-ui';

export function PlacesStep({
  step,
  total,
  hometown,
  currentTown,
  favoritePlaceHit,
  onChangeHometown,
  onChangeCurrent,
  onChangeFavoriteHit,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  hometown: string;
  currentTown: string;
  favoritePlaceHit: GeocodeHit | null;
  onChangeHometown: (v: string) => void;
  onChangeCurrent: (v: string) => void;
  onChangeFavoriteHit: (hit: GeocodeHit | null) => void;
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
      // Map + search results are taller than one screen; let the body scroll
      // so Continue never covers the hit list.
      scrollBody
      smallAsk
    >
      {/* THIS SECTION DOES: hometown + current town text, then map search for
          the favorite trip that seeds Places traveled. PRIVACY: towns / places
          only, never a street address. */}
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
        <OnboardingPlacePicker
          hit={favoritePlaceHit}
          onPick={onChangeFavoriteHit}
        />
      </View>
    </OnboardingStep>
  );
}
