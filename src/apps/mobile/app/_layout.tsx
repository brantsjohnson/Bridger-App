import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { screenTransition } from '../../../packages/ui';
import { WelcomeScreen } from './auth/welcome';
import { SignUpScreen } from './auth/sign-up';
import { OnboardingLayout, OnboardingStepKey } from './onboarding/_layout';
import { RevealScreen } from './reveal';
import { NotFoundScreen } from './not-found';
import { TabRoute, TabsLayout } from './tabs/_layout';

export type RootRoute =
'welcome' |
'auth' |
'onboarding' |
'reveal' |
'not-found' |
'app';

/**
 * Root gate:
 *   !hasSeenWelcome → welcome · !authed → auth · !onboardingComplete → onboarding · else tabs
 */
export function RootLayout({
  start = 'app',
  initialTab = 'home',
  onboardingStep = 'privacy'




}: {start?: RootRoute;initialTab?: TabRoute;onboardingStep?: OnboardingStepKey;}) {
  const [route, setRoute] = React.useState<RootRoute>(start);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={route}
        variants={screenTransition}
        initial="hidden"
        animate="show"
        exit="exit"
        className="h-full">
        
        {route === 'welcome' && <WelcomeScreen onDone={() => setRoute('auth')} />}
        {route === 'auth' && <SignUpScreen onDone={() => setRoute('onboarding')} />}
        {route === 'onboarding' &&
        <OnboardingLayout initialStep={onboardingStep} onComplete={() => setRoute('app')} />
        }
        {route === 'reveal' && <RevealScreen />}
        {route === 'not-found' && <NotFoundScreen onDismiss={() => setRoute('app')} />}
        {route === 'app' && <TabsLayout initialTab={initialTab} />}
      </motion.div>
    </AnimatePresence>);

}