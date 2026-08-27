import React from 'react';
import { GlobeIcon, MapPinIcon } from 'lucide-react';
import { Card, TextField, cn } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/**
 * 6 · The only connection question in onboarding. City only, never an address.
 * The deeper Discover Me questionnaire runs later, inside Discover.
 */
export function MeetScreen({ onNext, onSkip }: {onNext?: () => void;onSkip?: () => void;}) {
  const [scope, setScope] = React.useState<'near' | 'anywhere' | null>(null);
  const [city, setCity] = React.useState('');

  const options = [
  {
    id: 'near' as const,
    label: 'People near me',
    line: 'Same city',
    icon: <MapPinIcon className="h-6 w-6" strokeWidth={2.4} />,
    shape: 'rounded-[28px_10px_28px_10px]',
    bg: 'bg-teal'
  },
  {
    id: 'anywhere' as const,
    label: 'People anywhere',
    line: 'No distance limit',
    icon: <GlobeIcon className="h-6 w-6" strokeWidth={2.4} />,
    shape: 'rounded-[10px_28px_10px_28px]',
    bg: 'bg-purple'
  }];


  return (
    <OnboardingStep
      step={7}
      total={10}
      purpose="It filled our feeds with strangers. Bridger only ever connects you through friends you already have."
      ask="Who should we introduce you to?"
      accent="green"
      onContinue={onNext}
      onSkip={onSkip}>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {options.map((o) =>
          <button
            key={o.id}
            type="button"
            onClick={() => setScope(o.id)}
            aria-pressed={scope === o.id}
            className={cn(
              'flex flex-col items-start gap-2 px-4 py-5 text-left transition-transform active:scale-[0.98]',
              o.shape,
              scope === o.id ?
              cn(o.bg, 'text-onaccent') :
              'border border-ink-line bg-white text-ink'
            )}>
            
              {o.icon}
              <span className="text-[15px] font-bold leading-tight">{o.label}</span>
              <span className="text-[12px] font-semibold opacity-70">{o.line}</span>
            </button>
          )}
        </div>

        {scope === 'near' &&
        <TextField label="Your city" value={city} onChange={setCity} placeholder="Portland, OR" />
        }

        <Card>
          <p className="text-[13px] font-semibold leading-snug text-ink-soft">
            City only. Bridger never asks for your address, and matching stays inside your
            friends' networks.
          </p>
        </Card>
      </div>
    </OnboardingStep>);

}