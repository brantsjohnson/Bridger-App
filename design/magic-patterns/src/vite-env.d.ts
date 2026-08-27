/// <reference types="vite/client" />

declare module '*.css';

declare module './useScreenInit.js' {
  export function useScreenInit(): {
    theme?: string;
    view?: string;
    appRoute?: import('./apps/mobile/app/_layout').RootRoute;
    tab?: import('./apps/mobile/app/tabs/_layout').TabRoute;
    onboardingStep?: import('./apps/mobile/app/onboarding/_layout').OnboardingStepKey;
  };
}
