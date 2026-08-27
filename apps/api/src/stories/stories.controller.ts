// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for Updates: quota, create, list posts, replies, Catch-Up,
// and the author's Profile calendar archive (posts after the 24h live window).
// Every route needs a valid login token.
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
import type { ReactionKind, Tier } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { StoriesService } from './stories.service';

@Controller('stories')
@UseGuards(SupabaseAuthGuard)
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get('quota')
  quota(@CurrentUser() user: AuthUser) {
    return this.stories.getQuota(user.id);
  }

  /**
   * Profile → Stories calendar. Own archive only (live + past-24h posts that
   * have not hit free retention delete). Query: ?month=YYYY-MM
   */
  @Get('archive')
  archive(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.stories.listArchive(user.id, month);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      type: 'photo' | 'video';
      mediaId?: string;
      caption?: string;
      themeSlug?: string;
      visibleToTier?: Tier;
      eventId?: string;
    }
  ) {
    return this.stories.create(user.id, body);
  }

  // Static-ish paths before :authorId so Nest does not swallow them.
  @Get('posts/:postId/replies')
  listReplies(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string
  ) {
    return this.stories.listReplies(user.id, postId);
  }

  @Post('posts/:postId/replies')
  addReply(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body()
    body: {
      kind: ReactionKind;
      text?: string;
      stickerId?: string;
      mediaId?: string;
      parentReactionId?: string;
      videoSeconds?: number;
    }
  ) {
    return this.stories.addReply(user.id, postId, body);
  }

  @Post('catch-up/:itemId/answer')
  answerCatchUp(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string
  ) {
    return this.stories.answerCatchUp(user.id, itemId);
  }

  @Get(':authorId/catch-up')
  catchUp(
    @CurrentUser() user: AuthUser,
    @Param('authorId') authorId: string
  ) {
    return this.stories.getCatchUp(user.id, authorId);
  }

  @Get(':authorId/posts')
  listPosts(
    @CurrentUser() user: AuthUser,
    @Param('authorId') authorId: string
  ) {
    return this.stories.listPosts(user.id, authorId);
  }
}
