// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the Nest matching module: shared scorer + Discover / bridge / event /
// overlap surfaces. Does NOT import Assistant. No Edge Functions.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { MatchingAnnService } from './matching-ann.service';
import { MatchingBridgeService } from './matching-bridge.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingCronService } from './matching-cron.service';
import { MatchingDiscoverService } from './matching-discover.service';
import { MatchingEligibilityService } from './matching-eligibility.service';
import { MatchingEventService } from './matching-event.service';
import { MatchingEvidenceService } from './matching-evidence.service';
import { MatchingFeaturesService } from './matching-features.service';
import { MatchingFeedbackService } from './matching-feedback.service';
import { MatchingIdfService } from './matching-idf.service';
import { MatchingOverlapService } from './matching-overlap.service';
import { MatchingScorerService } from './matching-scorer.service';
import { MatchingController } from './matching.controller';

@Module({
  controllers: [MatchingController],
  providers: [
    SupabaseAuthGuard,
    MatchingConfigService,
    MatchingEligibilityService,
    MatchingIdfService,
    MatchingAnnService,
    MatchingFeaturesService,
    MatchingEvidenceService,
    MatchingScorerService,
    MatchingFeedbackService,
    MatchingDiscoverService,
    MatchingBridgeService,
    MatchingEventService,
    MatchingOverlapService,
    MatchingCronService
  ],
  exports: [
    MatchingEventService,
    MatchingFeedbackService,
    MatchingDiscoverService,
    MatchingBridgeService,
    MatchingOverlapService,
    MatchingConfigService,
    MatchingCronService
  ]
})
export class MatchingModule {}
