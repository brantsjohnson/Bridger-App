// ============================================
// WHAT THIS FILE DOES (plain English):
// Stripe sends events here when someone pays, renews, or cancels co-op by card.
// We verify the webhook signature with the raw body, then update membership.
// This route is public (no Bridger login); the signature is the auth.
// ============================================
import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';

@Controller('coop/webhooks')
export class StripeWebhookController {
  constructor(private readonly stripe: StripeService) {}

  @Post('stripe')
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined
  ) {
    const raw = req.rawBody;
    if (!raw || !signature) {
      return { ok: false, error: 'missing_body_or_signature' };
    }
    return this.stripe.handleWebhook(raw, signature);
  }
}
