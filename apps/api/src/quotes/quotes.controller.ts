// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for Inside Jokes (module name: quotes).
//   GET  /quotes?filter=&personId=
//   POST /quotes
// ============================================
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { Accent } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { QuotesService, type QuoteFilter } from './quotes.service';

@Controller('quotes')
@UseGuards(SupabaseAuthGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('filter') filter?: QuoteFilter,
    @Query('personId') personId?: string
  ) {
    return this.quotes.list(user.id, filter ?? 'all', personId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      text: string;
      quotedPersonId?: string;
      taggedIds?: string[];
      eventId?: string;
      eventName?: string;
      accent?: Accent;
      photoMediaId?: string;
    }
  ) {
    return this.quotes.create(user.id, body);
  }
}
