// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for Updates (Scrapbook pages): daily limit, today's pages,
// create a page, change or delete a page you posted, list posts, replies,
// Catch-Up, and the author's Profile calendar archive (posts after the 24h
// live window). Every route needs a valid login token.
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import type { ReactionKind, Tier } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { StoriesService, type PageInputDto } from './stories.service';

@Controller('stories')
@UseGuards(SupabaseAuthGuard)
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  /** How many photos + videos you can still add today (cap 4 across pages). */
  @Get('quota')
  quota(@CurrentUser() user: AuthUser) {
    return this.stories.getQuota(user.id);
  }

  /** Your own pages from today (for the page strip on the compose screen). */
  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    return this.stories.listToday(user.id);
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
      /** Scrapbook page: elements with uploaded media ids. */
      page?: PageInputDto;
    }
  ) {
    return this.stories.create(user.id, body);
  }

  /**
   * Change a page you posted earlier today (added photo, new layout, caption,
   * audience). Bumps the revision so friends see the ring light again.
   */
  @Patch('posts/:postId/page')
  updatePage(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body()
    body: {
      page: PageInputDto;
      mediaId?: string;
      caption?: string;
      visibleToTier?: Tier;
    }
  ) {
    return this.stories.updatePage(user.id, postId, body);
  }

  /** Delete one of your pages (used when two pages are merged into one). */
  @Delete('posts/:postId')
  deletePost(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.stories.deletePost(user.id, postId);
  }

  /**
   * Turn a voice note into words. Body is base64 audio only. The transcript
   * comes back so the phone can show it on the page. Never logged.
   */
  @Post('transcribe')
  transcribe(
    @CurrentUser() user: AuthUser,
    @Body() body: { audioBase64?: string; filename?: string }
  ) {
    return this.stories.transcribeVoice(user.id, body.audioBase64 ?? '', body.filename);
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
