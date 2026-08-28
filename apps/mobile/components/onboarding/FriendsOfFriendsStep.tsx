// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 7 - "Stop swiping to meet people." Bridger only ever introduces you to
// friends of friends, never strangers. Here you pick what you want those
// introductions to be based on: humor, values, personality, hobbies, or
// communication style. Checkbox rows plus "All of the above." Skippable.
//
// LOOK: a stack of white rows on tan paper, each with a small square checkbox
// that fills hot pink with a tick when you pick it. All the paint comes from the
// shared onboarding parts.
//
// PRIVACY: these are opaque preference keys (never free text). They shape which
// friends-of-friends the matcher surfaces; they are not shown to other people.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';

/** The five ways to be matched. Keys are opaque; labels are what you see. */
export const CONNECTION_STYLES: Array<{ id: string; label: string }> = [
  { id: 'humor', label: 'Humor' },
  { id: 'values', label: 'Values' },
  { id: 'personality', label: 'Personality' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'communication', label: 'Communication style' }
];

const ALL_IDS = CONNECTION_STYLES.map((s) => s.id);

export function FriendsOfFriendsStep({
  step,
  total,
  picked,
  onToggle,
  onSetAll,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  picked: string[];
  onToggle: (id: string) => void;
  /** Replaces the whole list in one go (used by "All of the above"). */
  onSetAll: (ids: string[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const allOn = ALL_IDS.every((id) => picked.includes(id));

  // THIS SECTION DOES: turn every style on, or clear them all. This writes the
  // whole list at once. Flipping them one at a time only ever landed the last
  // one, which is why tapping "All of the above" used to tick just one row.
  const toggleAll = () => {
    onSetAll(allOn ? [] : ALL_IDS);
  };

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends of your friends, never strangers."
      ask="Stop swiping to meet people"
      blurb="Bridger finds friends of friends you should know. What should we connect you on?"
      kicker="Pick any that apply"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: one checkbox row per matching style, then the
          shortcut row that ticks every one of them at once. */}
      <View style={{ gap: 10 }}>
        {CONNECTION_STYLES.map((s) => (
          <OBTile
            key={s.id}
            label={s.label}
            variant="checkbox"
            selected={picked.includes(s.id)}
            analyticsId={ONBOARDING.friends_of_friends.style}
            analyticsProps={{ style: s.id }}
            onPress={() => onToggle(s.id)}
          />
        ))}
        {/* THIS SECTION DOES: give "All of the above" a little extra room
            above it so it reads as a separate shortcut, not just another row. */}
        <View style={{ marginTop: 8 }}>
          <OBTile
            label="All of the above"
            variant="checkbox"
            selected={allOn}
            idleFill={OB.pinkWash}
            analyticsId={ONBOARDING.friends_of_friends.all}
            onPress={toggleAll}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
