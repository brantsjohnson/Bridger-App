// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the connections routes (friends list, requests, invite/QR, how-you-met,
// remove, block). Imports TiersModule so how-you-met can set a circle with caps.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { MatchingModule } from '../matching/matching.module';
import { TiersModule } from '../tiers/tiers.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';

@Module({
  imports: [TiersModule, MatchingModule],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, SupabaseAuthGuard]
})
export class ConnectionsModule {}
