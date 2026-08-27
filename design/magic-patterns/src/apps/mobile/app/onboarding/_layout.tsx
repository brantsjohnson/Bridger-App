import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { screenTransition } from '../../../../packages/ui';
import { PrivacyScreen } from './privacy';
import { DesireScreen } from './desire';
import { NotificationsScreen } from './notifications';
import { NameScreen } from './name';
import { PhotoScreen } from './photo';
import { BasicsScreen } from './basics';
import { MeetScreen } from './meet';
import { ReviewScreen } from './review';
import { CoopScreen } from './coop';
import { WelcomeInScreen } from './welcome-in';

export type OnboardingStepKey =
  | 'privacy'
  | 'desire'
  | 'notifications'
  | 'name'
  | 'photo'
  | 'basics'
  | 'meet'
  | 'review'
  | 'coop'
  | 'welcome-in';

const ORDER: OnboardingStepKey[] = [
  'privacy',
  'desire',
  'notifications',
  'name',
  'photo',
  'basics',
  'meet',
  'review',
  'coop',
  'welcome-in'
];

/** The essential layer + desire seed + join, one ask per screen. Only welcome-in completes it. */
export function OnboardingLayout({
  initialStep = 'privacy',
  onComplete
}: {
  initialStep?: OnboardingStepKey;
  onComplete?: () => void;
}) {
  const [step, setStep] = React.useState<OnboardingStepKey>(initialStep);
  const next = () => {
    const i = ORDER.indexOf(step);
    if (i < ORDER.length - 1) setStep(ORDER[i + 1]);
    else onComplete?.();
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        variants={screenTransition}
        initial="hidden"
        animate="show"
        exit="exit"
        className="h-full">
        {step === 'privacy' && <PrivacyScreen onNext={next} />}
        {step === 'desire' && <DesireScreen onNext={() => next()} onSkip={next} />}
        {step === 'notifications' && <NotificationsScreen onNext={next} onSkip={next} />}
        {step === 'name' && <NameScreen onNext={next} />}
        {step === 'photo' && <PhotoScreen onNext={next} onSkip={next} />}
        {step === 'basics' && <BasicsScreen onNext={next} onSkip={next} />}
        {step === 'meet' && <MeetScreen onNext={next} onSkip={next} />}
        {step === 'review' && <ReviewScreen onNext={next} />}
        {step === 'coop' && <CoopScreen onJoin={next} onFreeLite={next} />}
        {step === 'welcome-in' && <WelcomeInScreen onDone={onComplete} />}
      </motion.div>
    </AnimatePresence>
  );
}
