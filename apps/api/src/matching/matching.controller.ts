// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for matching: Discover suggestions, dismiss, refresh, overlap,
// bridge suggest. Event meet-suggestions stay under /events/:id for the client.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { MatchingBridgeService } from './matching-bridge.service';
import { MatchingDiscoverService } from './matching-discover.service';
import { MatchingOverlapService } from './matching-overlap.service';

@Controller('matching')
@UseGuards(SupabaseAuthGuard)
export class MatchingController {
  constructor(
    private readonly discover: MatchingDiscoverService,
    private readonly overlap: MatchingOverlapService,
    private readonly bridge: MatchingBridgeService
  ) {}

  @Get('suggestions')
  list(@CurrentUser() user: AuthUser) {
    return this.discover.listForViewer(user.id);
  }

  @Post('refresh')
  refresh(@CurrentUser() user: AuthUser) {
    return this.discover.refreshForViewer(user.id);
  }

  @Post('dismiss')
  dismiss(
    @CurrentUser() user: AuthUser,
    @Body() body: { candidateId?: string; forever?: boolean }
  ) {
    return this.discover.dismiss(
      user.id,
      body?.candidateId ?? '',
      Boolean(body?.forever)
    );
  }

  @Get('overlap/:personId')
  overlapFor(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string,
    @Query('variant') variant?: string
  ) {
    const v = variant === 'in_common' ? 'in_common' : 'reveal';
    return this.overlap.getOverlap(user.id, personId, v);
  }

  @Post('bridge/:connectionId')
  bridgeSuggest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string
  ) {
    return this.bridge.suggestForConnection(user.id, connectionId);
  }

  /** Reveal Screen 3: up to 3 FoF who pass the threshold (or an opt-in flag). */
  @Get('reveal-bridges/:personId')
  revealBridges(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string,
    @Query('limit') limit?: string
  ) {
    const n = Math.min(3, Math.max(1, Number(limit) || 3));
    return this.bridge.suggestManyForPerson(user.id, personId, n);
  }
}
