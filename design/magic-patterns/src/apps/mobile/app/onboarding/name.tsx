import React from 'react';
import { ColorCard, TextField } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/** 3 · The one hard requirement. */
export function NameScreen({ onNext }: {onNext?: () => void;}) {
  const [name, setName] = React.useState('');

  return (
    <OnboardingStep
      step={3}
      total={9}
      purpose="So your people know it's you."
      ask="Your name"
      accent="purple"
      ctaDisabled={name.trim().length === 0}
      onContinue={onNext}>
      
      <div className="space-y-3">
        <TextField label="Name" value={name} onChange={setName} placeholder="Sandra Kim" />
        {/* a preview of the only thing this is for */}
        <ColorCard accent="purple" className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25 text-[20px]">
            
            👋
          </span>
          <p className="text-[14px] font-bold leading-snug">
            {name.trim() ? `“${name.trim()} added you.”` : 'Your friends will see this name.'}
          </p>
        </ColorCard>
      </div>
    </OnboardingStep>);

}