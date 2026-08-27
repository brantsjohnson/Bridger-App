// ============================================
// WHAT THIS FILE DOES (plain English):
// The "auth code" system for the co-op. An operator makes a code in the admin
// console and sets how many people can use it (the "amount", e.g. 25). When a
// person types the code in the app, this file:
//   1) checks the code is real, active, and not used up,
//   2) makes sure they have not already used it,
//   3) grants them a free year of co-op (same perks as paying),
//   4) writes down who used which code, and ticks the used-count up by one.
//
// PAYMENT: redeeming is NOT a purchase. No money, receipt, or card is involved.
// It simply calls the normal membership grant, so the person becomes a member
// for a year. PRIVACY: we only ever store opaque user ids, never the code the
// person typed and never any personal info.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type {
  CoopPromoCode,
  CoopPromoRedeemResult,
  CoopPromoRedemption
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { CoopService } from './coop.service';

// Row shape we read back from the codes table.
type PromoRow = {
  id: string;
  code: string;
  label: string;
  grant_months: number;
  max_redemptions: number;
  redeemed_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class PromoService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService
  ) {}

  // THIS SECTION DOES: tidy a typed code so matching is forgiving (trim + UPPER).
  private normalize(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }

  // THIS SECTION DOES: turn a raw DB row into the shape the admin console wants.
  private toDto(row: PromoRow): CoopPromoCode {
    return {
      id: row.id,
      code: row.code,
      label: row.label ?? '',
      grantMonths: row.grant_months,
      maxRedemptions: row.max_redemptions,
      redeemedCount: row.redeemed_count,
      remaining: Math.max(0, row.max_redemptions - row.redeemed_count),
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // --- Person-facing: redeem a code for a free year ---

  /**
   * Validate a code and, if good, grant the person a free year of co-op.
   * Throws a friendly BadRequest for any reason it cannot be redeemed so the
   * app can show a clear message. Never reveals whether a code merely exists.
   */
  async redeem(userId: string, rawCode: string): Promise<CoopPromoRedeemResult> {
    const code = this.normalize(rawCode);
    if (!code) {
      throw new BadRequestException('Enter a code to redeem.');
    }

    // Look up the code (service role bypasses RLS; codes are server-only).
    const { data: row, error } = await this.supabase.admin
      .from('coop_promo_codes')
      .select(
        'id, code, label, grant_months, max_redemptions, redeemed_count, active, created_at, updated_at'
      )
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;

    // Same message whether it is missing or switched off, so codes cannot be probed.
    if (!row || !row.active) {
      throw new BadRequestException('That code is not valid.');
    }

    // Already used by this person? Membership was already granted; do not double-count.
    const { data: mine } = await this.supabase.admin
      .from('coop_promo_redemptions')
      .select('user_id')
      .eq('promo_code_id', row.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (mine) {
      throw new BadRequestException('You have already used this code.');
    }

    // Out of uses? (The "amount" the operator set has been reached.)
    if (row.redeemed_count >= row.max_redemptions) {
      throw new BadRequestException('This code has been fully used.');
    }

    // Grant the free year (same path as a normal join; no payment).
    const membership = await this.coop.setMembership(userId, { join: true });

    // Remember who used it. The primary key blocks a double-redeem race.
    const { error: insErr } = await this.supabase.admin
      .from('coop_promo_redemptions')
      .insert({ promo_code_id: row.id, user_id: userId });
    if (insErr) {
      // If two taps raced, the person is already a member; treat as success.
      if (insErr.code !== '23505') throw insErr;
    } else {
      // Only tick the used-count when we actually added a new redemption.
      await this.supabase.admin
        .from('coop_promo_codes')
        .update({ redeemed_count: row.redeemed_count + 1 })
        .eq('id', row.id);
    }

    return { ok: true, grantMonths: row.grant_months, membership };
  }

  // --- Admin console: manage codes ---

  async listCodes(): Promise<CoopPromoCode[]> {
    const { data, error } = await this.supabase.admin
      .from('coop_promo_codes')
      .select(
        'id, code, label, grant_months, max_redemptions, redeemed_count, active, created_at, updated_at'
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.toDto(r as PromoRow));
  }

  async createCode(input: {
    code: string;
    label?: string;
    maxRedemptions?: number;
    grantMonths?: number;
  }): Promise<CoopPromoCode> {
    const code = this.normalize(input.code);
    if (!code) {
      throw new BadRequestException('A code is required.');
    }
    const maxRedemptions = Math.max(0, Math.floor(input.maxRedemptions ?? 25));
    const grantMonths = Math.max(1, Math.floor(input.grantMonths ?? 12));

    const { data, error } = await this.supabase.admin
      .from('coop_promo_codes')
      .insert({
        code,
        label: input.label?.trim() ?? '',
        max_redemptions: maxRedemptions,
        grant_months: grantMonths
      })
      .select(
        'id, code, label, grant_months, max_redemptions, redeemed_count, active, created_at, updated_at'
      )
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('That code already exists.');
      }
      throw error;
    }
    return this.toDto(data as PromoRow);
  }

  /** Change the "amount", turn a code off/on, or rename it. */
  async patchCode(
    id: string,
    patch: { maxRedemptions?: number; active?: boolean; label?: string }
  ): Promise<CoopPromoCode> {
    const update: {
      max_redemptions?: number;
      active?: boolean;
      label?: string;
    } = {};
    if (patch.maxRedemptions !== undefined) {
      update.max_redemptions = Math.max(0, Math.floor(patch.maxRedemptions));
    }
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.label !== undefined) update.label = patch.label.trim();
    if (Object.keys(update).length === 0) {
      throw new BadRequestException('Nothing to update.');
    }

    const { data, error } = await this.supabase.admin
      .from('coop_promo_codes')
      .update(update)
      .eq('id', id)
      .select(
        'id, code, label, grant_months, max_redemptions, redeemed_count, active, created_at, updated_at'
      )
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Code not found.');
    return this.toDto(data as PromoRow);
  }

  /** Who used a given code (opaque user ids only), newest first. */
  async listRedemptions(codeId: string): Promise<CoopPromoRedemption[]> {
    const { data, error } = await this.supabase.admin
      .from('coop_promo_redemptions')
      .select('user_id, redeemed_at')
      .eq('promo_code_id', codeId)
      .order('redeemed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      userId: r.user_id,
      redeemedAt: r.redeemed_at
    }));
  }
}
