// ============================================
// WHAT THIS FILE DOES (plain English):
// Picks the right picture for a New-onboarding screen. Teaching screens get
// the Magic Patterns layouts. Feature-tour screens get the labeled previews.
// Taps on pictures log dead_click unless the preview has its own buttons.
// ============================================
import React from 'react';
import {
  CoopEarlyVisual,
  CoopNoAdsVisual,
  CoopSayVisual,
  CoopSupportVisual,
  CoopWhatVisual,
  CoopWhoPaysVisual,
  PrivacyMappingVisual,
  PrivacyTwoProfilesVisual,
  WhyScatteredVisual,
  WhyTogetherVisual
} from './OnboardingVisuals';
import { FeatureVisual } from './FeaturePreviews';
import type { FeatureVisualKind } from '../onboarding-new-flow';

const FEATURE_KIND: Record<string, FeatureVisualKind> = {
  'feature-availability': 'availability',
  'feature-notes': 'notes',
  'feature-scrapbook': 'scrapbook',
  'feature-mutuals': 'mutuals',
  'feature-suggestions': 'suggestions',
  'feature-birthdays': 'birthdays',
  'feature-event': 'event',
  'feature-dates': 'dates',
  'feature-interests': 'interests',
  'feature-group': 'group'
};

export function VisualSlot({
  visualId,
  caption
}: {
  visualId?: string;
  /** Extra line, e.g. the group they just picked. Never a name or phone. */
  caption?: string;
}) {
  if (!visualId) return null;

  switch (visualId) {
    case 'why-scattered':
      return <WhyScatteredVisual />;
    case 'why-together':
      return <WhyTogetherVisual />;
    case 'privacy-mapping':
      return <PrivacyMappingVisual />;
    case 'privacy-two-profiles':
      return <PrivacyTwoProfilesVisual />;
    case 'coop-no-ads':
      return <CoopNoAdsVisual />;
    case 'coop-who-pays':
      return <CoopWhoPaysVisual />;
    case 'coop-what':
      return <CoopWhatVisual />;
    case 'coop-say':
      return <CoopSayVisual />;
    case 'coop-support':
      return <CoopSupportVisual />;
    case 'coop-early':
      return <CoopEarlyVisual />;
    default:
      break;
  }

  const kind = FEATURE_KIND[visualId];
  if (kind) return <FeatureVisual kind={kind} />;

  return caption ? null : null;
}
