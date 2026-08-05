// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles co-op membership, announcements, PurchaseGateway, and the member
// portal routes so the rest of the API can reuse CoopService (e.g. /me/storage).
// ============================================
import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OptionalSupabaseAuthGuard } from '../auth/optional-auth.guard';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopController } from './coop.controller';
import { CoopService } from './coop.service';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PurchaseGateway } from './purchase.gateway';
import { RequireCoopMemberGuard } from './require-coop-member.guard';

@Module({
  imports: [AdminAuthModule],
  controllers: [CoopController, PortalController],
  providers: [
    CoopService,
    PortalService,
    PurchaseGateway,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
    RequireCoopMemberGuard
  ],
  exports: [CoopService, PortalService]
})
export class CoopModule {}
