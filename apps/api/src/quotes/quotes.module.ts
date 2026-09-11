// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the Inside Jokes (quotes) routes into the API.
// ============================================
import { Module } from '@nestjs/common';
import { CoopModule } from '../coop/coop.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [CoopModule],
  controllers: [QuotesController],
  providers: [QuotesService, SupabaseAuthGuard],
  exports: [QuotesService]
})
export class QuotesModule {}
