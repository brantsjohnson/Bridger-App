// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 7 - "Stop swiping to make friends." Bridger only ever introduces you to
// friends of friends, never strangers. Here you pick what kind of friend you
// could use right now (workout, go out, creative, industry, travel, nearby,
// someone who gets you). Checkbox rows plus "All of the above." Skippable.
//
// LOOK: a stack of compact white rows on eggshell paper, each with an emoji +
// label and a small square checkbox that fills hot pink with a tick when you
// pick it. Tapping "All of the above" ticks every row and sprays every option's
// emoji. A quiet note under the list says answers stay private.
//
// PRIVACY: these are opaque preference keys (never free text). They shape which
// friends-of-friends the matcher surfaces; they are not shown to other people.
// ============================================
import React, { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { ONBOARDING, trackClick } from '@bridger/shared';
import { HobbyEmojiBurst, useReduceMotion, useThemeColors } from '@bridger/ui';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';

/** Opaque keys + what you see. Keys go to the server; labels stay on-device. */
export const CONNECTION_STYLES: Array<{ id: string; label: string; emoji: string }> = [
  { id: 'workout', label: 'Workout friend', emoji: '💪' },
  { id: 'go_out', label: 'Someone to go out with', emoji: '🪩' },
  { id: 'creative', label: 'Someone creative', emoji: '🎨' },
  { id: 'industry', label: 'Someone in my industry', emoji: '🙈' },
  { id: 'travel', label: 'Travel friend', emoji: '✈️' },
  { id: 'nearby', label: 'Someone nearby', emoji: '🗺️' },
  { id: 'gets_me', label: 'Someone who gets me', emoji: '💖' }
];

const ALL_IDS = CONNECTION_STYLES.map((s) => s.id);
/** Every option emoji, used when "All of the above" explodes. */
const ALL_EMOJIS = CONNECTION_STYLES.map((s) => s.emoji);

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
  const reduce = useReduceMotion();
  const allBtnRef = useRef<View>(null);
  const [burst, setBurst] = useState<{
    key: number;
    origin: { x: number; y: number };
  } | null>(null);

  const allOn = ALL_IDS.every((id) => picked.includes(id));
  // Private note sits on the canvas; follow theme ink in dark mode.
  const theme = useThemeColors();

  // THIS SECTION DOES: turn every style on, or clear them all. When turning
  // them on, spray every option emoji from the "All of the above" row.
  const toggleAll = () => {
    trackClick(ONBOARDING.friends_of_friends.all);
    if (allOn) {
      onSetAll([]);
      return;
    }
    onSetAll(ALL_IDS);
    if (reduce) return;
    allBtnRef.current?.measureInWindow((x, y, width, height) => {
      setBurst({
        key: Date.now(),
        origin: { x: x + width / 2, y: y + height / 2 }
      });
    });
  };

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends of your friends, never strangers."
      ask="Stop swiping to make friends"
      blurb={
        "Bridger finds friends of friends you should know.\nWhat kind of friend could you use right now?"
      }
      kicker="Pick any that apply"
      smallAsk
      scrollBody
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* Emoji shower when "All of the above" turns everything on. */}
      <Modal visible={burst != null} transparent animationType="none" pointerEvents="none">
        <View style={{ flex: 1 }} pointerEvents="none">
          {burst ? (
            <HobbyEmojiBurst
              key={burst.key}
              play
              emoji={ALL_EMOJIS}
              origin={burst.origin}
              count={28}
              power="boom"
              onPlayStart={fireEmojiBurstHaptics}
              onDone={() => setBurst(null)}
            />
          ) : null}
        </View>
      </Modal>

      {/* THIS SECTION DOES: one checkbox row per friend type, then the shortcut
          that ticks every one of them and sprays all the emojis. */}
      <View style={{ gap: 6 }}>
        {CONNECTION_STYLES.map((s) => (
          <OBTile
            key={s.id}
            label={`${s.emoji}  ${s.label}`}
            variant="checkbox"
            compact
            selected={picked.includes(s.id)}
            analyticsId={ONBOARDING.friends_of_friends.style}
            analyticsProps={{ style: s.id }}
            onPress={() => onToggle(s.id)}
          />
        ))}

        {/* Measure the row so the burst can start from its center. */}
        <View ref={allBtnRef} collapsable={false}>
          <OBTile
            label="All of the above"
            variant="checkbox"
            compact
            selected={allOn}
            idleFill={OB.pinkWash}
            // We track the click inside toggleAll so the burst can run first.
            analyticsId={undefined}
            onPress={toggleAll}
          />
        </View>

        <Text
          className="font-sans-sb text-[12px]"
          style={{ marginTop: 8, textAlign: 'center', color: theme.inkMute }}
        >
          (all answers are private)
        </Text>
      </View>
    </OnboardingStep>
  );
}
