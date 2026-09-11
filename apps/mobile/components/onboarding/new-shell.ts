// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared chrome settings for every New-onboarding screen: which dress, which
// color, which ⓘ, and whether the progress bar counts this page.
// ============================================
import { CONCEPT } from './onboarding-new-flow';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

export function newShellFromSpec(
  spec: OnboardingScreenSpec,
  formStep: number,
  formTotal: number
) {
  const concept = CONCEPT[spec.concept];
  return {
    tone: spec.tone,
    accent: concept.accent,
    conceptLabel: concept.label,
    step: spec.countsInProgress ? formStep : 0,
    total: formTotal,
    purpose: spec.chip,
    ask: spec.header,
    blurb: spec.subheader,
    kicker: spec.kicker,
    ctaNote: spec.ctaNote,
    sentenceCase: true as const,
    smallAsk: true as const,
    scrollBody: true as const
  };
}
