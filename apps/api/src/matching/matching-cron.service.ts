// ============================================
// WHAT THIS FILE DOES (plain English):
// Nightly-style jobs: refresh Discover suggestions for a batch of users and
// age out old feedback snapshots (18-month TTL).
// Call from worker or an admin "run now" endpoint — not Edge Functions.
// ============================================
import { Injectable, Logger } from '@nestjs/common';
import { MatchingDiscoverService } from './matching-discover.service';
import { MatchingFeedbackService } from './matching-feedback.service';

@Injectable()
export class MatchingCronService {
  private readonly log = new Logger(MatchingCronService.name);

  constructor(
    private readonly discover: MatchingDiscoverService,
    private readonly feedback: MatchingFeedbackService
  ) {}

  async runNightly(): Promise<{ refreshed: number }> {
    this.log.log('matching nightly: start');
    const refreshed = await this.discover.refreshBatch(100);
    await this.feedback.purgeOlderThanTtl();
    this.log.log(`matching nightly: refreshed ${refreshed}`);
    return { refreshed };
  }
}
