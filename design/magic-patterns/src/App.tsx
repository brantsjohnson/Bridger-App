import React from 'react';
import { PixelHeading, SegmentedTabs, ThemeSwitch } from './packages/ui';
import { PhoneFrame } from './preview/PhoneFrame';
import { DesignSystemGallery } from './preview/DesignSystemGallery';
import { RootLayout, RootRoute } from './apps/mobile/app/_layout';
import { TabRoute } from './apps/mobile/app/tabs/_layout';
import { OnboardingStepKey } from './apps/mobile/app/onboarding/_layout';
import { ThemeProvider, useTheme } from './apps/mobile/state/theme';
import { useScreenInit } from './useScreenInit.js';

const VIEWS = ['App', 'Components'];

export function App() {
  const screenInit = useScreenInit();
  return (
    <ThemeProvider initial={screenInit.theme === 'dark' ? 'dark' : 'light'}>
      <AppShell />
    </ThemeProvider>);

}

function AppShell() {
  const screenInit = useScreenInit();
  const { theme, setTheme } = useTheme();
  const [view, setView] = React.useState<string>(screenInit.view ?? 'App');
  const appRoute: RootRoute = screenInit.appRoute ?? 'app';
  const tab: TabRoute = screenInit.tab ?? 'home';
  const onboardingStep: OnboardingStepKey = screenInit.onboardingStep ?? 'privacy';

  return (
    <main className="min-h-full w-full bg-app-grid">
      <div className="border-b border-ink-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PixelHeading as="h1" size="lg">
              Bridger
            </PixelHeading>
            <p className="mt-2 max-w-[460px] text-[14px] font-medium text-ink-mute">
              apps/mobile + packages/ui · light and dark, Felonia headers, square
              metallic CTAs, floating tab bar.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-3 sm:max-w-[300px] sm:items-end">
            <ThemeSwitch value={theme} onChange={setTheme} />
            <div className="w-full max-w-[240px]">
              <SegmentedTabs tabs={VIEWS} value={view} onChange={setView} />
            </div>
          </div>
        </div>
      </div>

      {view === 'App' ?
      <div className="flex justify-center px-6 py-10">
          <PhoneFrame label="apps/mobile">
            <RootLayout start={appRoute} initialTab={tab} onboardingStep={onboardingStep} />
          </PhoneFrame>
        </div> :

      <DesignSystemGallery />
      }
    </main>);

}