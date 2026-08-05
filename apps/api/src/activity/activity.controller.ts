// ============================================
// WHAT THIS FILE DOES (plain English):
// Routes for the weekly Home activity: see the current challenge, post into
// it, and heart / un-heart someone else's post.
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
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { ActivityService } from './activity.service';

@Controller('activities')
@UseGuards(SupabaseAuthGuard)
export class ActivityController {
  constructor(private readonly activities: ActivityService) {}

  @Get('current')
  getCurrent() {
    return this.activities.getCurrent();
  }

  @Post(':id/posts')
  createPost(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { mediaId?: string; emoji?: string; caption?: string }
  ) {
    return this.activities.createPost(user.id, id, body ?? {});
  }

  @Post(':id/posts/:postId/heart')
  addHeart(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('postId') postId: string
  ) {
    return this.activities.addHeart(user.id, id, postId);
  }

  @Delete(':id/posts/:postId/heart')
  removeHeart(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('postId') postId: string
  ) {
    return this.activities.removeHeart(user.id, id, postId);
  }
}
