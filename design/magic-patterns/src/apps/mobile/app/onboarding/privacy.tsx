import { Accent } from '../../../../packages/shared';
import { ColorCard } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

const PROMISES: Array<{emoji: string;text: string;accent: Accent;}> = [
{ emoji: '🔒', text: 'You control all of it. Every field, every circle.', accent: 'blue' },
{ emoji: '🚫', text: 'Never sold. No ads, ever.', accent: 'coral' },
{
  emoji: '🌉',
  text: 'Only used to connect you with people worth knowing.',
  accent: 'teal'
}];


/** 1 · Trust before we ask for anything. Acknowledgment, not a form. */
export function PrivacyScreen({ onNext }: {onNext?: () => void;}) {
  return (
    <OnboardingStep
      step={1}
      total={10}
      purpose="It watched everything and asked for nothing. Here, your privacy is yours."
      ask="How this works"
      cta="I understand"
      accent="blue"
      onContinue={onNext}>
      
      <div className="space-y-3">
        {PROMISES.map((p) =>
        <ColorCard key={p.text} accent={p.accent} className="flex items-center gap-3.5">
            <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25 text-[22px]">
            
              {p.emoji}
            </span>
            <p className="text-[14px] font-bold leading-snug">{p.text}</p>
          </ColorCard>
        )}
      </div>
    </OnboardingStep>);

}