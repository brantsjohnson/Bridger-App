// ============================================
// WHAT THIS FILE DOES (plain English):
// Home feed routes: the stories row, your own tile, replies to your updates,
// coming-up (stub), and the notifications list/preview.
// ============================================
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { FeedService } from './feed.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('feed/stories')
  listStories(@CurrentUser() user: AuthUser) {
    return this.feed.listStories(user.id);
  }

  @Get('feed/stories/me')
  myStory(@CurrentUser() user: AuthUser) {
    return this.feed.getMyStory(user.id);
  }

  @Get('feed/story-replies')
  storyReplies(@CurrentUser() user: AuthUser) {
    return this.feed.listStoryReplies(user.id);
  }

  @Get('feed/coming-up')
  comingUp(@CurrentUser() user: AuthUser) {
    return this.feed.listComingUp(user.id);
  }

  @Get('notifications')
  notifications(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string
  ) {
    const n = limit ? Number(limit) : undefined;
    return this.feed.listNotifications(
      user.id,
      Number.isFinite(n) ? n : undefined
    );
  }
}
