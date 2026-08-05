// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for the Co-op Portal. Anyone can read ideas, mission, books, and
// roles. Only active members can write (support, comment, vote, feedback).
// Admin status changes use the same AdminGuard as the rest of /admin.
// ============================================
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { AdminGuard } from '../admin-auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  OptionalSupabaseAuthGuard
} from '../auth/optional-auth.guard';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { PortalService } from './portal.service';
import { RequireCoopMemberGuard } from './require-coop-member.guard';

@Controller('coop/portal')
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  // --- Public / optional-auth reads ---

  @Get('overview')
  @UseGuards(OptionalSupabaseAuthGuard)
  overview(@CurrentUser() user?: AuthUser) {
    return this.portal.overview(user?.id);
  }

  @Get('ideas')
  @UseGuards(OptionalSupabaseAuthGuard)
  listIdeas(@CurrentUser() user?: AuthUser) {
    return this.portal.listIdeas(user?.id);
  }

  @Get('ideas/:id')
  @UseGuards(OptionalSupabaseAuthGuard)
  getIdea(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.portal.getIdea(id, user?.id);
  }

  @Get('mission')
  @UseGuards(OptionalSupabaseAuthGuard)
  listMission(@CurrentUser() user?: AuthUser) {
    return this.portal.listMission(user?.id);
  }

  @Get('economics')
  listEconomics() {
    return this.portal.listEconomics();
  }

  @Get('roles')
  listRoles() {
    return this.portal.listRoles();
  }

  /** Soft-deprecated: dues tallies are admin-only; members use the cost simulator. */
  @Get('dues')
  @UseGuards(AdminGuard)
  duesSummary() {
    return this.portal.duesSummary();
  }

  @Get('beta/current')
  @UseGuards(OptionalSupabaseAuthGuard)
  betaCurrent(@CurrentUser() user?: AuthUser) {
    return this.portal.betaCurrent(user?.id);
  }

  @Post('waitlist')
  @UseGuards(OptionalSupabaseAuthGuard)
  waitlist(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: { interest?: string }
  ) {
    return this.portal.joinWaitlist(user?.id, body ?? {});
  }

  // --- Member writes ---

  @Post('ideas')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  createIdea(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      problem?: string;
      category?: string;
      evidence?: string;
      drawbacks?: string;
      urgency?: string;
      impact?: string;
      costGuess?: string;
      fundingModel?: string;
    }
  ) {
    return this.portal.createIdea(user.id, body);
  }

  @Post('ideas/:id/support')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  supportIdea(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.portal.toggleSupport(user.id, id);
  }

  @Post('ideas/:id/comments')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  comment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { body: string }
  ) {
    return this.portal.addComment(user.id, id, body?.body ?? '');
  }

  @Post('mission/:id/support')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  missionSupport(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.portal.toggleMission(user.id, id);
  }

  /** Soft-deprecated: member dues preference voting removed from the app. */
  @Post('dues/vote')
  @UseGuards(AdminGuard)
  voteDues(@Body() body: { userId: string; amountCents: number }) {
    if (!body?.userId) {
      throw new BadRequestException('userId required');
    }
    return this.portal.voteDues(body.userId, body?.amountCents);
  }

  @Post('beta/verify')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  betaVerify(
    @CurrentUser() user: AuthUser,
    @Body() body: { accessCode: string }
  ) {
    return this.portal.betaVerify(user.id, body?.accessCode ?? '');
  }

  @Post('beta/vote')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  betaVote(
    @CurrentUser() user: AuthUser,
    @Body() body: { choice: 'yes' | 'no' | 'extend' }
  ) {
    return this.portal.betaVote(user.id, body?.choice);
  }

  @Get('me/participation')
  @UseGuards(SupabaseAuthGuard, RequireCoopMemberGuard)
  participation(@CurrentUser() user: AuthUser) {
    return this.portal.participation(user.id);
  }

  // --- Admin ---

  @Patch('admin/ideas/:id')
  @UseGuards(AdminGuard)
  adminSetIdeaStatus(
    @Param('id') id: string,
    @Body() body: { status: string; public?: boolean }
  ) {
    return this.portal.adminSetIdeaStatus(id, body.status, body.public);
  }
}
