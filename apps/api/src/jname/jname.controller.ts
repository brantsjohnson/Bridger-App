// ============================================
// WHAT THIS FILE DOES (plain English):
// The web addresses for the J-name quiz sharing. Signed-in people can save their
// result, get their share link, and (after signup) be connected to the friend
// who invited them. Anyone (no account needed) can open a shared result page.
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
import type {
  JnameResultInput,
  JnameResolveReferralInput
} from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { OptionalSupabaseAuthGuard } from '../auth/optional-auth.guard';
import { JnameService } from './jname.service';

@Controller('jname')
export class JnameController {
  constructor(private readonly jname: JnameService) {}

  // --- Signed-in: read my saved result (null if I have not taken it). ---
  @Get('result')
  @UseGuards(SupabaseAuthGuard)
  myResult(@CurrentUser() user: AuthUser) {
    return this.jname.getMyResult(user.id);
  }

  // --- Signed-in: save my result (also called again on a retake). ---
  @Post('result')
  @UseGuards(SupabaseAuthGuard)
  saveResult(@CurrentUser() user: AuthUser, @Body() body: JnameResultInput) {
    return this.jname.saveResult(user.id, body);
  }

  // --- Signed-in: get my one stable share link. ---
  @Post('share')
  @UseGuards(SupabaseAuthGuard)
  share(@CurrentUser() user: AuthUser) {
    return this.jname.getOrCreateShare(user.id);
  }

  // --- Signed-in: "your version of X" board (friends by the J-name they got). ---
  @Get('leaderboard')
  @UseGuards(SupabaseAuthGuard)
  leaderboard(@CurrentUser() user: AuthUser) {
    return this.jname.getLeaderboard(user.id);
  }

  // --- Public: the free web view of a shared result. Records the open. ---
  @Get('shared/:token')
  @UseGuards(OptionalSupabaseAuthGuard)
  shared(
    @Param('token') token: string,
    @CurrentUser() user: AuthUser | undefined,
    @Query('a') anonRef?: string
  ) {
    return this.jname.getSharedView(token, user?.id, anonRef);
  }

  // --- Signed-in: record the referral and add the friend who shared the quiz. ---
  @Post('referrals/resolve')
  @UseGuards(SupabaseAuthGuard)
  resolve(
    @CurrentUser() user: AuthUser,
    @Body() body: JnameResolveReferralInput
  ) {
    return this.jname.resolveReferral(user.id, body ?? {});
  }
}
