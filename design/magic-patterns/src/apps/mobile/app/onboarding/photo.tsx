import React from 'react';
import { CameraIcon, ImageIcon } from 'lucide-react';
import { ButtonSecondary, Chip } from '../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';

/**
 * 5 · The one place an upload is allowed. Stories stay capture-only.
 * One house filter is applied either way, so every profile shares a look.
 */
export function PhotoScreen({ onNext, onSkip }: {onNext?: () => void;onSkip?: () => void;}) {
  const [source, setSource] = React.useState<'camera' | 'library' | null>(null);

  return (
    <OnboardingStep
      step={5}
      total={10}
      purpose="Just you, for the people who already like you."
      ask="Add your photo"
      accent="pink"
      ctaDisabled={!source}
      onContinue={onNext}
      onSkip={onSkip}>
      
      <div className="flex flex-col items-center">
        <div
          className={`flex h-52 w-52 items-center justify-center rounded-full border-2 border-ink ${
          source ? 'bg-pink' : 'bg-ink/[0.04]'}`
          }>
          
          <span aria-hidden="true" className="text-[60px]">
            {source ? '🌸' : '📷'}
          </span>
        </div>

        <div className="mt-4">
          <Chip label="House filter on" accent="pink" selected size="sm" />
        </div>

        <div className="mt-5 flex w-full gap-2.5">
          <ButtonSecondary
            full
            size="lg"
            tone={source === 'camera' ? 'outline' : 'solid'}
            icon={<CameraIcon className="h-4 w-4" strokeWidth={2.5} />}
            onClick={() => setSource('camera')}>
            
            {source === 'camera' ? 'Retake' : 'Take one'}
          </ButtonSecondary>
          <ButtonSecondary
            full
            size="lg"
            icon={<ImageIcon className="h-4 w-4" strokeWidth={2.5} />}
            onClick={() => setSource('library')}>
            
            Upload
          </ButtonSecondary>
        </div>
      </div>
    </OnboardingStep>);

}