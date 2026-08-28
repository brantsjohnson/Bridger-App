// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 9 - "What should we notify you about?" Six on/off rows, one per kind of
// reminder, each with an emoji. "All of the above" turns every switch on and
// sprays every emoji. Whatever you pick becomes your notification prefs;
// Settings later expands each one into fine-grained kinds. Skippable.
//
// LOOK: a stack of compact white rows on eggshell paper, each with a small
// switch on the right. When it is on, the track fills green and the knob stays
// white. All the paint comes from the shared onboarding parts.
// ============================================
import React, { useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { ONBOARDING, ONBOARDING_NOTIFICATION_GROUPS, trackClick } from '@bridger/shared';
import { HobbyEmojiBurst, useReduceMotion } from '@bridger/ui';
import { fireEmojiBurstHaptics } from '../../lib/celebration-haptics';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBTile } from './onboarding-ui';

/** Emoji for each coarse onboarding group (keys match ONBOARDING_NOTIFICATION_GROUPS). */
const PREF_EMOJI: Record<(typeof ONBOARDING_NOTIFICATION_GROUPS)[number]['id'], string> = {
  birthdays: '🎂',
  life_updates: '📣',
  meet: '👋',
  activities: '🎉',
  messages: '💬',
  reconnect: '🔗'
};

const PREFS = ONBOARDING_NOTIFICATION_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  emoji: PREF_EMOJI[g.id]
}));

const ALL_IDS = PREFS.map((p) => p.id);
/** Every option emoji, used when "All of the above" explodes. */
const ALL_EMOJIS = PREFS.map((p) => p.emoji);

export function NotificationsStep({
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

  // THIS SECTION DOES: turn every reminder on, or clear them all. When turning
  // them on, spray every option emoji from the "All of the above" row.
  const toggleAll = () => {
    trackClick(ONBOARDING.notifications.all);
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
      purpose="Tech should help you stay close."
      ask="What should we notify you about?"
      blurb="Turn on only what matters to you."
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
              count={24}
              power="boom"
              onPlayStart={fireEmojiBurstHaptics}
              onDone={() => setBurst(null)}
            />
          ) : null}
        </View>
      </Modal>

      {/* THIS SECTION DOES: one switch row per reminder type, then the shortcut
          that turns every switch on and sprays all the emojis. */}
      <View style={{ gap: 6 }}>
        {PREFS.map((p) => (
          <OBTile
            key={p.id}
            label={`${p.emoji}  ${p.label}`}
            variant="switch"
            compact
            selected={picked.includes(p.id)}
            analyticsId={ONBOARDING.notifications.pref}
            analyticsProps={{ pref: p.id }}
            onPress={() => onToggle(p.id)}
          />
        ))}

        <View ref={allBtnRef} collapsable={false}>
          <OBTile
            label="All of the above"
            variant="switch"
            compact
            selected={allOn}
            idleFill={OB.pinkWash}
            analyticsId={undefined}
            onPress={toggleAll}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}
