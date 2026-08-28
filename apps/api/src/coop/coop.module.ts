// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles co-op membership, announcements, PurchaseGateway, and the member
// portal routes so the rest of the API can reuse CoopService (e.g. /me/storage).
// PosthogModule is here so payment webhooks can emit coop_renewed / coop_expired.
// ============================================
import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OptionalSupabaseAuthGuard } from '../auth/optional-auth.guard';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { PosthogModule } from '../posthog/posthog.module';
import { CoopController } from './coop.controller';
import { CoopService } from './coop.service';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PromoService } from './promo.service';
import { PurchaseGateway } from './purchase.gateway';
import { RevenueCatWebhookController } from './revenuecat.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { RequireCoopMemberGuard } from './require-coop-member.guard';

@Module({
  imports: [AdminAuthModule, PosthogModule],
  controllers: [
    CoopController,
    PortalController,
    RevenueCatWebhookController,
    StripeWebhookController
  ],
  providers: [
    CoopService,
    PortalService,
    PromoService,
    PurchaseGateway,
    StripeService,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
    RequireCoopMemberGuard
  ],
  exports: [CoopService, PortalService, PromoService, StripeService]
})
export class CoopModule {}
