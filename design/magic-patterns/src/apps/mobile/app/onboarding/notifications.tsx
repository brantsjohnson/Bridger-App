import React from 'react';
import { CheckIcon } from 'lucide-react';
import { ACCENTS, cn } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

const PREFS = [
{ id: 'close', label: "Close friends' updates", emoji: '💬', accent: 'purple' },
{ id: 'birthdays', label: 'Birthdays', emoji: '🎂', accent: 'pink' },
{ id: 'moments', label: 'Big moments', emoji: '✨', accent: 'amber' },
{ id: 'events', label: 'Events', emoji: '📅', accent: 'teal' }] as
const;

/** 3 · Stay in touch. Multi-select, writes notification prefs. */
export function NotificationsScreen({
  onNext,
  onSkip
}: {
  onNext?: () => void;
  onSkip?: () => void;
}) {
  const [picked, setPicked] = React.useState<string[]>(['close', 'birthdays']);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <OnboardingStep
      step={3}
      total={10}
      purpose="It let us drift. What should we nudge you about?"
      ask="What should we nudge you about?"
      accent="amber"
      onContinue={onNext}
      onSkip={onSkip}>
      
      <div className="grid grid-cols-2 gap-3">
        {PREFS.map((p, i) => {
          const on = picked.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={on}
              className={cn(
                'relative flex flex-col items-start gap-2 px-4 py-5 text-left transition-transform active:scale-[0.98]',
                i % 2 === 0 ?
                'rounded-[28px_10px_28px_10px]' :
                'rounded-[10px_28px_10px_28px]',
                on ?
                cn(ACCENTS[p.accent].bg, 'text-onaccent') :
                'border border-ink-line bg-white text-ink'
              )}>
              
              <span aria-hidden="true" className="text-[26px]">
                {p.emoji}
              </span>
              <span className="text-[14px] font-bold leading-tight">{p.label}</span>
              {on &&
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink">
                  <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                </span>
              }
            </button>);

        })}
      </div>
    </OnboardingStep>);

}