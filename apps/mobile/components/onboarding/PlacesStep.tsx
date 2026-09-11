// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10E - "Your places." Hometown and current town stay as light text
// questions (towns only, never street addresses). Favorite place uses a map
// search that drops a FAV pin on Places traveled. Each field has a Private /
// Close friends only color toggle (public later in Privacy settings). When you
// Continue with a favorite picked, the button shower uses that country's flag
// emoji. Nothing is required.
// ============================================
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import type { GeocodeHit } from '../../lib/geocode';
import { countryCodeToFlagEmoji } from '../../lib/geocode';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OnboardingPlacePicker } from './OnboardingPlacePicker';
import {
  PrivateCloseToggle,
  type PlacesPrivacyChoice
} from './PrivateCloseToggle';
import { OBField } from './onboarding-ui';

export function PlacesStep({
  step,
  total,
  hometown,
  currentTown,
  favoritePlaceHit,
  hometownPrivacy,
  currentTownPrivacy,
  favoritePlacePrivacy,
  onChangeHometown,
  onChangeCurrent,
  onChangeFavoriteHit,
  onChangeHometownPrivacy,
  onChangeCurrentTownPrivacy,
  onChangeFavoritePlacePrivacy,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  hometown: string;
  currentTown: string;
  favoritePlaceHit: GeocodeHit | null;
  hometownPrivacy: PlacesPrivacyChoice;
  currentTownPrivacy: PlacesPrivacyChoice;
  favoritePlacePrivacy: PlacesPrivacyChoice;
  onChangeHometown: (v: string) => void;
  onChangeCurrent: (v: string) => void;
  onChangeFavoriteHit: (hit: GeocodeHit | null) => void;
  onChangeHometownPrivacy: (v: PlacesPrivacyChoice) => void;
  onChangeCurrentTownPrivacy: (v: PlacesPrivacyChoice) => void;
  onChangeFavoritePlacePrivacy: (v: PlacesPrivacyChoice) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // THIS SECTION DOES: keep hometown / town fields above the keyboard.
  const { ensureVisible } = useOnboardingBodyScroll();
  // THIS SECTION DOES: turn the favorite country's code into a flag for Continue.
  const burstEmojis = useMemo(() => {
    const flag = favoritePlaceHit
      ? countryCodeToFlagEmoji(favoritePlaceHit.countryCode)
      : '';
    return flag ? [flag] : undefined;
  }, [favoritePlaceHit]);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="You choose who sees each one"
      ask="Your places"
      onContinue={onNext}
      onBack={onBack}
      burstEmojis={burstEmojis}
      scrollBody
      smallAsk
    >
      {/* THIS SECTION DOES: hometown + town + favorite, each with privacy pills. */}
      <View style={{ gap: 18 }}>
        <Text className="font-sans-sb text-[12px] leading-snug text-ink-soft">
          Yellow is Private (only you). Green is Close friends only. You can
          open something to more people later in Privacy settings.
        </Text>

        <View style={{ gap: 8 }}>
          <OBField
            label="Hometown"
            value={hometown}
            onChange={onChangeHometown}
            placeholder="Where you're from"
            analyticsId={ONBOARDING.taste.hometown_input}
            onFocusExtra={(anchor) => ensureVisible(anchor)}
          />
          <PrivateCloseToggle
            value={hometownPrivacy}
            onChange={onChangeHometownPrivacy}
            analyticsId={ONBOARDING.taste.hometown_privacy}
            fieldLabel="Hometown"
          />
        </View>

        <View style={{ gap: 8 }}>
          <OBField
            label="Current town"
            value={currentTown}
            onChange={onChangeCurrent}
            placeholder="Where you live now"
            analyticsId={ONBOARDING.taste.current_town_input}
            onFocusExtra={(anchor) => ensureVisible(anchor)}
          />
          <PrivateCloseToggle
            value={currentTownPrivacy}
            onChange={onChangeCurrentTownPrivacy}
            analyticsId={ONBOARDING.taste.current_town_privacy}
            fieldLabel="Current town"
          />
        </View>

        <View style={{ gap: 8 }}>
          <OnboardingPlacePicker
            hit={favoritePlaceHit}
            onPick={onChangeFavoriteHit}
          />
          <PrivateCloseToggle
            value={favoritePlacePrivacy}
            onChange={onChangeFavoritePlacePrivacy}
            analyticsId={ONBOARDING.taste.favorite_place_privacy}
            fieldLabel="Favorite place"
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
