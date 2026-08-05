// ============================================
// WHAT THIS FILE DOES (plain English):
// The Touch Grass routes the app calls: list signals I can see, send my own,
// say "I'm in", dismiss, get my live signal, and end mine.
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import type { GrassWhen } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { TouchGrassService } from './touchgrass.service';

@Controller('touchgrass')
@UseGuards(SupabaseAuthGuard)
export class TouchGrassController {
  constructor(private readonly touchgrass: TouchGrassService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.touchgrass.list(user.id);
  }

  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.touchgrass.getMine(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { who: string; when: GrassWhen; note?: string }
  ) {
    return this.touchgrass.create(user.id, body);
  }

  @Post(':id/join')
  join(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.touchgrass.join(user.id, id);
  }

  @Post(':id/dismiss')
  dismiss(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.touchgrass.dismiss(user.id, id);
  }

  @Delete('me')
  endMine(@CurrentUser() user: AuthUser) {
    return this.touchgrass.endMine(user.id);
  }
}
