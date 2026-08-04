import React from 'react';
import { Accent } from '../../../packages/shared';
import {
  ACCENTS,
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  StepProgress,
  cn } from
'../../../packages/ui';

type OnboardingStepProps = {
  step: number;
  total?: number;
  purpose: string;
  ask: string;
  children?: React.ReactNode;
  cta?: string;
  ctaDisabled?: boolean;
  loading?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  /** every step owns a color, so the run reads as a sequence, not a form */
  accent?: Accent;
};

/**
 * One ask per screen, a purpose line above it, continue + optional skip.
 * Each step is washed in its own accent — colored canvas, a soft blob behind
 * the question, a solid purpose pill and a matching progress bar — so moving
 * through onboarding feels like moving through a set of rooms.
 */
export function OnboardingStep({
  step,
  total = 9,
  purpose,
  ask,
  children,
  cta = 'Continue',
  ctaDisabled,
  loading,
  onContinue,
  onSkip,
  accent = 'purple'
}: OnboardingStepProps) {
  const token = ACCENTS[accent];

  return (
    <Screen tone="color" accent={token.tint}>
      {/* a big soft shape in the step's color, behind everything */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-[999px_999px_44px_999px] opacity-70',
          token.tintSolid
        )} />
      

      <div className="relative px-5 pb-2 pt-5">
        <StepProgress step={step} total={total} accent={accent} />
      </div>

      <div className="relative px-5 pb-4 pt-4">
        <span
          className={cn(
            'inline-flex rounded-full px-3 py-1.5 text-[12px] font-bold leading-snug',
            token.bg,
            token.text
          )}>
          
          {purpose}
        </span>
        <PixelHeading as="h1" size="lg" className="mt-2.5">
          {ask}
        </PixelHeading>
      </div>

      <ScreenBody className="relative pb-4">
        <Breathe>{children}</Breathe>
      </ScreenBody>

      <div className="relative space-y-2.5 px-5 pb-6 pt-3">
        {/* metallic only when Continue is the only choice on the screen */}
        {onSkip ?
        <>
            <ButtonSecondary
            full
            size="lg"
            tone="solid"
            loading={loading}
            disabled={ctaDisabled}
            onClick={onContinue}>
            
              {cta}
            </ButtonSecondary>
            <ButtonSecondary full tone="ghost" onClick={onSkip}>
              Skip for now
            </ButtonSecondary>
          </> :

        <ButtonPrimary full loading={loading} disabled={ctaDisabled} onClick={onContinue}>
            {cta}
          </ButtonPrimary>
        }
      </div>
    </Screen>);

}