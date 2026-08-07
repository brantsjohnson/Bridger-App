// ============================================
// WHAT THIS FILE DOES (plain English):
// Combines the six features with config weights, applies the evidence gate
// and thresholds, and freezes a feature snapshot for learning.
// No LLM calls. Empty result is correct when the bar is not met.
// ============================================
import { Injectable } from '@nestjs/common';
import { MATCHING_FEATURES, type MatchingFeature } from '@bridger/shared';
import { MatchingEvidenceService } from './matching-evidence.service';
import { MatchingFeaturesService } from './matching-features.service';
import type { FofCandidate } from './matching-eligibility.service';
import type {
  ActiveMatchingConfig,
  ScoreContext,
  ScoreResult
} from './matching.types';

@Injectable()
export class MatchingScorerService {
  constructor(
    private readonly features: MatchingFeaturesService,
    private readonly evidence: MatchingEvidenceService
  ) {}

  async scorePair(
    viewerId: string,
    candidate: FofCandidate,
    cfg: ActiveMatchingConfig,
    ctx: ScoreContext
  ): Promise<ScoreResult | null> {
    const bundle = await this.features.compute(viewerId, candidate, cfg, ctx);
    const sharedQuizIds =
      bundle.details.quiz_alignment?.sharedQuizIds ?? [];
    const sharedAttributeCount =
      bundle.details.shared_attributes?.sharedAttributeCount ?? 0;

    const evidenceGatePassed =
      sharedQuizIds.length >= 1 ||
      sharedAttributeCount >= cfg.minSharedSignals;

    if (!evidenceGatePassed) return null;

    const contribs = {} as Record<MatchingFeature, number>;
    let score = 0;
    for (const f of MATCHING_FEATURES) {
      const c = (cfg.weights[f] ?? 0) * (bundle.features[f] ?? 0);
      contribs[f] = c;
      score += c;
    }

    if (score < cfg.suggestThreshold) return null;

    const evidenceItems = await this.evidence.buildEvidence(
      viewerId,
      candidate.candidateId,
      sharedQuizIds
    );

    const snapshot = {
      features: bundle.features,
      contribs,
      score,
      evidenceGatePassed,
      sharedQuizIds,
      sharedAttributeCount,
      isExploration: false,
      configVersion: cfg.version
    };

    return {
      score,
      contribs,
      features: bundle.features,
      evidenceGatePassed,
      isSpotlight: score >= cfg.spotlightThreshold,
      sharedQuizIds,
      sharedAttributeCount,
      viaFriendId: candidate.viaFriendId,
      evidence: evidenceItems,
      snapshot
    };
  }

  /**
   * Apply exploration ε among already-qualified scored candidates.
   * Never lowers the evidence bar — only reshuffles within the qualified set.
   */
  applyExploration<T extends { score: number; isSpotlight: boolean }>(
    ranked: T[],
    epsilon: number,
    cap: number
  ): { picked: T[]; explorationIndexes: Set<number> } {
    if (ranked.length <= cap) {
      return { picked: ranked, explorationIndexes: new Set() };
    }
    const explorationIndexes = new Set<number>();
    const head = ranked.slice(0, cap);
    if (Math.random() >= epsilon) {
      return { picked: head, explorationIndexes };
    }
    // Swap lowest non-spotlight slot with next diverse qualified candidate.
    const rest = ranked.slice(cap);
    if (!rest.length) return { picked: head, explorationIndexes };
    let swapIdx = -1;
    for (let i = head.length - 1; i >= 0; i--) {
      if (!head[i]!.isSpotlight) {
        swapIdx = i;
        break;
      }
    }
    if (swapIdx < 0) return { picked: head, explorationIndexes };
    head[swapIdx] = rest[0]!;
    explorationIndexes.add(swapIdx);
    return { picked: head, explorationIndexes };
  }
}
