import React from 'react';
import { Card, ColorCard } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/** 6 · The funding model, set as an expectation early. "Not now" is first-class. */
export function CoopScreen({
  onJoin,
  onSkip



}: {onJoin?: () => void;onSkip?: () => void;}) {
  return (
    <OnboardingStep
      step={8}
      total={9}
      purpose="A tool for you, not an ad machine."
      ask="Join the co-op?"
      cta="Join · $24 a year"
      accent="coral"
      onContinue={onJoin}
      onSkip={onSkip}>
      
      <div className="space-y-3">
        <ColorCard accent="teal">
          <p className="text-[15px] font-bold leading-snug">
            Elsewhere you're the product. Here you're the member.
          </p>
        </ColorCard>

        <Card>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
            Members get
          </p>
          <ul className="space-y-1.5 text-[14px] font-semibold text-ink">
            <li>A profile you can decorate</li>
            <li>Bigger circles and custom groups</li>
            <li>Video updates and replies</li>
            <li>Daily recaps, unlimited storage</li>
          </ul>
        </Card>

        <Card>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
            Always free
          </p>
          <p className="text-[14px] font-semibold text-ink">
            Meeting people, adding anyone, messages, events. You never pay to connect.
          </p>
        </Card>
      </div>
    </OnboardingStep>);

}