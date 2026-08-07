// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared TypeScript shapes for the Nest matching scorer (Mode 1 + Mode 2).
// ============================================
import type {
  MatchingEvidenceItem,
  MatchingFeature,
  MatchingSurface,
  PairFeaturesSnapshot
} from '@bridger/shared';

export type ActiveMatchingConfig = {
  id: string;
  version: number;
  weights: Record<MatchingFeature, number>;
  suggestThreshold: number;
  spotlightThreshold: number;
  minSharedSignals: number;
  confidenceFloor: number;
  revealExtrasMax: number;
  refreshCap: number;
  explorationEpsilon: number;
  explorationEpsilonCold: number;
  bridgeCooldownDays: number;
  annCandidateCap: number;
  exposureCapPct: number;
  exposureHardCap: number;
  v2Enabled: boolean;
  holdoutPct: number;
};

export type FeatureDetail = {
  value: number;
  sharedQuizIds?: string[];
  sharedAttributeCount?: number;
  viaFriendId?: string;
};

export type FeatureBundle = {
  features: Record<MatchingFeature, number>;
  details: Partial<Record<MatchingFeature, FeatureDetail>>;
};

export type ScoreResult = {
  score: number;
  contribs: Record<MatchingFeature, number>;
  features: Record<MatchingFeature, number>;
  evidenceGatePassed: boolean;
  isSpotlight: boolean;
  sharedQuizIds: string[];
  sharedAttributeCount: number;
  viaFriendId?: string;
  evidence: MatchingEvidenceItem[];
  snapshot: PairFeaturesSnapshot;
};

export type ScoreContext = {
  surface: MatchingSurface;
  eventId?: string;
  /** Bridge reciprocity: candidate also has a strong fit back toward viewer. */
  reciprocalBonus?: number;
};

export type OverlapItemDto = {
  kind: 'hobby' | 'this_or_that' | 'place' | 'event' | 'attribute';
  title: string;
  pairedAnswers?: { yours: string; theirs: string };
  icon?: string;
  accent?: string;
};

export type RevealPayloadDto = {
  viaMutual?: { firstName: string };
  strongest: OverlapItemDto | null;
  quizCompat: { quizId: string; dimension: string; percent: number }[];
  extras: OverlapItemDto[];
};

export type InCommonPayloadDto = RevealPayloadDto & {
  fullList: OverlapItemDto[];
  mutuals: { id: string; firstName: string; photoRef: string }[];
  howYouMet: {
    kind: string;
    label: string;
    date: string;
    viaName?: string;
    approximate?: boolean;
  }[];
  sharedPlacePhotos: {
    place: string;
    yours: string;
    theirs: string;
  }[];
};
