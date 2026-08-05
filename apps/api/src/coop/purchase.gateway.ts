// ============================================
// WHAT THIS FILE DOES (plain English):
// The only door for "pay annual dues." Today it soft-joins (no real charge)
// so Apple / Google / Card buttons in the app all work the same. When StoreKit
// or Play Billing is ready, receipt validation lands HERE — nowhere else.
//
// PAYMENT: never process peer Venmo/Cash App here. Co-op dues are the annual
// membership SKU only (see COOP.md).
// ============================================
import { Injectable } from '@nestjs/common';
import { CoopService } from './coop.service';

export type DuesMethod = 'apple' | 'google' | 'card' | 'soft';

@Injectable()
export class PurchaseGateway {
  constructor(private readonly coop: CoopService) {}

  /**
   * Start annual dues for a user.
   * TODO (IAP): validate store receipt → insert payments (kind coop_dues,
   * amount 2400 cents) → then setMembership. Until then, soft-join only.
   */
  async startAnnualDues(
    userId: string,
    _method: DuesMethod
  ): Promise<{ status: 'soft_joined' | 'pending_iap'; membership: Awaited<ReturnType<CoopService['setMembership']>> }> {
    const membership = await this.coop.setMembership(userId, { join: true });
    return { status: 'soft_joined', membership };
  }
}
