// ============================================
// WHAT THIS FILE DOES (plain English):
// SECURITY: every route here is gated by AdminGuard. These are the endpoints
// the admin console calls to set the live quiz, publish co-op notes, edit Home
// defaults, scaffold quizzes/delights, and more.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import type {
  AdaptationPolicy,
  Cover,
  DelightScope,
  HomeDefaults,
  QuizDimension,
  QuizQuestion,
  ThemedPrompt
} from '@bridger/shared';
import { AdminGuard } from '../admin-auth/admin.guard';
import { PortalService } from '../coop/portal.service';
import { AdminService } from './admin.service';
import { TelemetryService } from '../telemetry/telemetry.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly telemetry: TelemetryService,
    private readonly portal: PortalService
  ) {}

  // --- Home defaults + themed prompts + live quiz ---

  @Get('config/home-defaults')
  getHomeDefaults() {
    return this.admin.getHomeDefaults();
  }

  @Put('config/home-defaults')
  putHomeDefaults(@Body() body: HomeDefaults) {
    return this.admin.putHomeDefaults(body);
  }

  @Get('config/themed-prompts')
  getThemedPrompts() {
    return this.admin.getThemedPrompts();
  }

  @Put('config/themed-prompts')
  putThemedPrompts(@Body() body: ThemedPrompt[] | { prompts: ThemedPrompt[] }) {
    const prompts = Array.isArray(body) ? body : body.prompts;
    return this.admin.putThemedPrompts(prompts ?? []);
  }

  @Put('config/live-quiz')
  setLiveQuiz(@Body() body: { slug: string; goLiveDate?: string }) {
    return this.admin.setLiveQuiz(body.slug, body.goLiveDate);
  }

  // --- Quizzes ---

  @Get('quizzes')
  listQuizzes() {
    return this.admin.listQuizzes();
  }

  @Post('quizzes')
  createQuiz(@Body() body: { slug: string; title: string }) {
    return this.admin.createQuiz(body.slug, body.title);
  }

  @Patch('quizzes/:slug')
  patchQuiz(
    @Param('slug') slug: string,
    @Body()
    body: {
      title?: string;
      description?: string | null;
      status?: 'live' | 'draft' | 'archived';
      comparable?: boolean;
      webTakeable?: boolean;
      cover?: Cover | null;
    }
  ) {
    return this.admin.patchQuiz(slug, body);
  }

  @Get('quizzes/:slug/design')
  getDesign(@Param('slug') slug: string) {
    return this.admin.getQuizDesign(slug);
  }

  @Put('quizzes/:slug/design')
  putDesign(
    @Param('slug') slug: string,
    @Body()
    body: {
      goal?: string;
      dimensions?: QuizDimension[];
      moderatorInstructions?: string;
      adaptationPolicy?: AdaptationPolicy;
      questions?: QuizQuestion[];
    }
  ) {
    return this.admin.putQuizDesign(slug, body);
  }

  // --- Weekly activities ---

  @Get('activities')
  listActivities() {
    return this.admin.listActivities();
  }

  @Post('activities')
  createActivity(
    @Body()
    body: {
      title: string;
      prompt: string;
      closesIn?: string;
      emoji?: string;
      cover?: Cover;
    }
  ) {
    return this.admin.createActivity(body);
  }

  @Patch('activities/:id')
  patchActivity(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      prompt?: string;
      active?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      closesIn?: string | null;
      emoji?: string | null;
      cover?: Cover | null;
    }
  ) {
    return this.admin.patchActivity(id, body);
  }

  // --- Co-op ---

  @Get('coop/announcements')
  listAnnouncements() {
    return this.admin.listAnnouncements();
  }

  @Post('coop/announcements')
  createAnnouncement(
    @Body()
    body: {
      title: string;
      body: string;
      ctaLabel?: string;
      ctaUrl?: string;
    }
  ) {
    return this.admin.createAnnouncement(body);
  }

  @Patch('coop/announcements/:id')
  patchAnnouncement(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      body?: string;
      ctaLabel?: string | null;
      ctaUrl?: string | null;
    }
  ) {
    return this.admin.patchAnnouncement(id, body);
  }

  @Post('coop/announcements/:id/publish')
  publishAnnouncement(@Param('id') id: string) {
    return this.admin.publishAnnouncement(id);
  }

  @Get('coop/members')
  listMembers() {
    return this.admin.listMembers();
  }

  // --- Co-op portal CRM (ideas + vote tallies for operators) ---

  @Get('coop/portal/ideas')
  listPortalIdeas(@Query('status') status?: string) {
    return this.portal.adminListIdeas(status);
  }

  @Get('coop/portal/ideas/:id')
  getPortalIdea(@Param('id') id: string) {
    return this.portal.adminGetIdea(id);
  }

  @Patch('coop/portal/ideas/:id')
  patchPortalIdea(
    @Param('id') id: string,
    @Body() body: { status: string; public?: boolean }
  ) {
    return this.portal.adminSetIdeaStatus(id, body.status, body.public);
  }

  @Get('coop/portal/votes/summary')
  portalVotesSummary() {
    return this.portal.adminVotesSummary();
  }

  @Get('coop/portal/pending-count')
  portalPendingCount() {
    return this.portal.adminPendingIdeaCount().then((n) => ({ count: n }));
  }

  // --- Delights ---

  @Get('delights')
  listDelights() {
    return this.admin.listDelights();
  }

  @Post('delights')
  createDelight(
    @Body() body: { slug?: string; id?: string; name: string; scope: DelightScope }
  ) {
    // Accept either "slug" or "id" as the plugin folder name.
    const slug = body.slug ?? body.id;
    return this.admin.createDelight({
      slug: slug!,
      name: body.name,
      scope: body.scope
    });
  }

  @Patch('delights/:id')
  patchDelight(
    @Param('id') id: string,
    @Body()
    body: {
      enabled?: boolean;
      scope?: DelightScope;
      schedule?: { from?: string; to?: string };
      name?: string;
    }
  ) {
    return this.admin.patchDelight(id, body);
  }

  // --- Weekly recap (podcast questions) ---

  @Get('recap/weeks')
  listRecapWeeks() {
    return this.admin.listRecapWeeks();
  }

  @Post('recap/weeks')
  createRecapWeek(@Body() body: { weekOf: string; questions: string[] }) {
    return this.admin.createRecapWeek(body);
  }

  @Patch('recap/weeks/:id')
  patchRecapWeek(
    @Param('id') id: string,
    @Body() body: { weekOf?: string; questions?: string[]; active?: boolean }
  ) {
    return this.admin.patchRecapWeek(id, body);
  }

  @Get('recap/submitted-questions')
  listRecapSubmittedQuestions() {
    return this.admin.listRecapSubmittedQuestions();
  }

  // --- Broken paths (404 trails from the app) ---

  @Get('not-found-hits')
  listNotFoundHits() {
    return this.telemetry.listNotFoundHits();
  }
}
