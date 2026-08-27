// ============================================
// WHAT THIS FILE DOES (plain English):
// Tracks each member's Billy AI allowance in dollars of model cost.
// Taste gets a small monthly reset. Billy+ gets a larger grant with capped
// rollover. Nest is the only writer; members can only read their own rows.
//
// --- PAYMENT / PRIVACY ---
// Ledger never stores prompts or chat text. Soft stub activates Billy+ until
// real IAP/Stripe lands.
// ============================================
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  DEFAULT_BILLY_CONFIG,
  type BillyConfigDto,
  type BillyPlan,
  type BillyStatusDto,
  type BillySubscriptionStatus
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class BillyBillingService {
  private readonly log = new Logger(BillyBillingService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // THIS SECTION DOES: load admin-tunable grant amounts (singleton row).
  async getConfig(): Promise<BillyConfigDto> {
    const { data } = await this.supabase.admin
      .from('billy_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (!data) return { ...DEFAULT_BILLY_CONFIG };
    return {
      tasteGrantUsd: Number(data.taste_grant_usd),
      plusPriceUsd: Number(data.plus_price_usd),
      plusGrantUsd: Number(data.plus_grant_usd),
      rolloverCapMultiplier: Number(data.rollover_cap_multiplier),
      tasteRollover: Boolean(data.taste_rollover),
      minBalanceToStartTurnUsd: Number(data.min_balance_to_start_turn_usd)
    };
  }

  async putConfig(patch: Partial<BillyConfigDto>): Promise<BillyConfigDto> {
    const cur = await this.getConfig();
    const next: BillyConfigDto = {
      tasteGrantUsd: patch.tasteGrantUsd ?? cur.tasteGrantUsd,
      plusPriceUsd: patch.plusPriceUsd ?? cur.plusPriceUsd,
      plusGrantUsd: patch.plusGrantUsd ?? cur.plusGrantUsd,
      rolloverCapMultiplier:
        patch.rolloverCapMultiplier ?? cur.rolloverCapMultiplier,
      tasteRollover: patch.tasteRollover ?? cur.tasteRollover,
      minBalanceToStartTurnUsd:
        patch.minBalanceToStartTurnUsd ?? cur.minBalanceToStartTurnUsd
    };
    await this.supabase.admin.from('billy_config').upsert({
      id: 1,
      taste_grant_usd: next.tasteGrantUsd,
      plus_price_usd: next.plusPriceUsd,
      plus_grant_usd: next.plusGrantUsd,
      rollover_cap_multiplier: next.rolloverCapMultiplier,
      taste_rollover: next.tasteRollover,
      min_balance_to_start_turn_usd: next.minBalanceToStartTurnUsd
    });
    return next;
  }

  // THIS SECTION DOES: when someone turns Billy on, start taste + first grant.
  async ensureTasteSubscription(userId: string): Promise<void> {
    await this.ensureBalanceRow(userId);
    const { data: sub } = await this.supabase.admin
      .from('billy_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub?.status === 'active' && (sub.plan === 'taste' || sub.plan === 'plus')) {
      await this.maybeRollPeriod(userId);
      return;
    }

    const cfg = await this.getConfig();
    const start = new Date();
    const end = new Date(start.getTime() + PERIOD_MS);
    await this.supabase.admin.from('billy_subscriptions').upsert({
      user_id: userId,
      plan: 'taste',
      status: 'active',
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false
    });
    await this.applyTasteGrant(userId, cfg.tasteGrantUsd);
  }

  /** Soft stub / admin: activate Billy+ and grant plus amount. */
  async activatePlus(userId: string, method: 'stub' | 'admin'): Promise<BillyStatusDto> {
    void method;
    await this.ensureBalanceRow(userId);
    const cfg = await this.getConfig();
    const start = new Date();
    const end = new Date(start.getTime() + PERIOD_MS);
    await this.supabase.admin.from('billy_subscriptions').upsert({
      user_id: userId,
      plan: 'plus',
      status: 'active',
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
      provider_ref: method === 'stub' ? 'soft_stub' : 'admin_grant'
    });
    await this.applyPlusGrant(userId, cfg);
    return this.getStatus(userId);
  }

  async cancelPlusAtPeriodEnd(userId: string): Promise<BillyStatusDto> {
    const { data: sub } = await this.supabase.admin
      .from('billy_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!sub || sub.plan !== 'plus') {
      return this.getStatus(userId);
    }
    await this.supabase.admin
      .from('billy_subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'canceling'
      })
      .eq('user_id', userId);
    return this.getStatus(userId);
  }

  async getStatus(userId: string): Promise<BillyStatusDto> {
    await this.maybeRollPeriod(userId);
    const cfg = await this.getConfig();
    const { data: sub } = await this.supabase.admin
      .from('billy_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('balance_usd')
      .eq('user_id', userId)
      .maybeSingle();

    const plan = (sub?.plan as BillyPlan) ?? 'none';
    const status = (sub?.status as BillySubscriptionStatus) ?? 'none';
    const grant =
      plan === 'plus' ? cfg.plusGrantUsd : plan === 'taste' ? cfg.tasteGrantUsd : 0;
    const balanceUsd = Number(bal?.balance_usd ?? 0);

    return {
      plan,
      status: sub ? status : 'none',
      balanceUsd,
      grantUsdPerMonth: grant,
      rolloverCapUsd: cfg.plusGrantUsd * cfg.rolloverCapMultiplier,
      periodEnd: sub?.current_period_end ?? null,
      plusPriceUsd: cfg.plusPriceUsd,
      canStartTurn: balanceUsd >= cfg.minBalanceToStartTurnUsd
    };
  }

  // THIS SECTION DOES: block a turn when Billy time is used up.
  async assertCanStartTurn(userId: string): Promise<BillyStatusDto> {
    const status = await this.getStatus(userId);
    const cfg = await this.getConfig();
    if (status.balanceUsd < cfg.minBalanceToStartTurnUsd) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          code: 'billy_allowance_exhausted',
          message: "You've used this month's Billy time.",
          periodEnd: status.periodEnd,
          plan: status.plan
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }
    return status;
  }

  // THIS SECTION DOES: subtract model cost after a successful personal_agent job.
  async debit(
    userId: string,
    estimatedUsd: number,
    job: string,
    costLogId?: string | null
  ): Promise<void> {
    if (!(estimatedUsd > 0)) return;
    await this.ensureBalanceRow(userId);
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const current = Number(bal?.balance_usd ?? 0);
    const next = Math.max(0, round4(current - estimatedUsd));
    const spent = Number(bal?.lifetime_spent_usd ?? 0) + estimatedUsd;
    await this.supabase.admin
      .from('billy_balances')
      .update({
        balance_usd: next,
        lifetime_spent_usd: spent
      })
      .eq('user_id', userId);
    await this.supabase.admin.from('billy_ledger').insert({
      user_id: userId,
      kind: 'spend',
      amount_usd: -estimatedUsd,
      balance_after_usd: next,
      job,
      cost_log_id: costLogId ?? null
    });
  }

  async recordOpsAlert(input: {
    source: 'anthropic' | 'openai' | 'ai_budget';
    code: string;
    detail: string;
    job?: string | null;
  }): Promise<void> {
    const { error } = await this.supabase.admin.from('ai_ops_alerts').insert({
      source: input.source,
      code: input.code,
      detail: input.detail.slice(0, 280),
      job: input.job ?? null
    });
    if (error) this.log.warn(`ops alert insert failed: ${error.message}`);
  }

  async listOpenAlerts() {
    const { data } = await this.supabase.admin
      .from('ai_ops_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    return data ?? [];
  }

  async resolveAlert(id: string) {
    await this.supabase.admin
      .from('ai_ops_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', id);
  }

  async overview() {
    const cfg = await this.getConfig();
    const alerts = await this.listOpenAlerts();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { data: costs } = await this.supabase.admin
      .from('ai_job_cost_log')
      .select('job, estimated_usd')
      .gte('created_at', monthStart.toISOString())
      .in('job', ['agent_query', 'agent_reasoning', 'agent_voice']);

    let personalAgentSpendUsd = 0;
    for (const row of costs ?? []) {
      personalAgentSpendUsd += Number(row.estimated_usd ?? 0);
    }

    const { data: topSpend } = await this.supabase.admin
      .from('billy_balances')
      .select('user_id, lifetime_spent_usd, balance_usd')
      .order('lifetime_spent_usd', { ascending: false })
      .limit(20);

    return {
      config: cfg,
      openAlerts: alerts,
      personalAgentSpendUsdMonth: round4(personalAgentSpendUsd),
      topUsers: (topSpend ?? []).map((r) => ({
        userRef: r.user_id,
        lifetimeSpentUsd: Number(r.lifetime_spent_usd),
        balanceUsd: Number(r.balance_usd)
      }))
    };
  }

  async adjustAdmin(
    userId: string,
    amountUsd: number,
    note: string
  ): Promise<BillyStatusDto> {
    await this.ensureBalanceRow(userId);
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('balance_usd')
      .eq('user_id', userId)
      .maybeSingle();
    const current = Number(bal?.balance_usd ?? 0);
    const next = round4(Math.max(0, current + amountUsd));
    await this.supabase.admin
      .from('billy_balances')
      .update({ balance_usd: next })
      .eq('user_id', userId);
    await this.supabase.admin.from('billy_ledger').insert({
      user_id: userId,
      kind: 'adjust_admin',
      amount_usd: amountUsd,
      balance_after_usd: next,
      note: note.slice(0, 200)
    });
    return this.getStatus(userId);
  }

  // --- Pure helpers used by unit tests ---

  /** Plus rollover: bank at most grant * multiplier. */
  static computePlusBalance(input: {
    currentBalance: number;
    grantUsd: number;
    rolloverCapMultiplier: number;
  }): { balance: number; expireAmount: number } {
    const cap = input.grantUsd * input.rolloverCapMultiplier;
    const raw = input.currentBalance + input.grantUsd;
    if (raw <= cap) return { balance: round4(raw), expireAmount: 0 };
    return { balance: round4(cap), expireAmount: round4(raw - cap) };
  }

  private async ensureBalanceRow(userId: string) {
    await this.supabase.admin.from('billy_balances').upsert(
      { user_id: userId },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
  }

  private async applyTasteGrant(userId: string, grantUsd: number) {
    // Taste: reset balance to grant (no rollover).
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('lifetime_granted_usd')
      .eq('user_id', userId)
      .maybeSingle();
    const lifetime = Number(bal?.lifetime_granted_usd ?? 0) + grantUsd;
    await this.supabase.admin
      .from('billy_balances')
      .update({
        balance_usd: grantUsd,
        lifetime_granted_usd: lifetime
      })
      .eq('user_id', userId);

    await this.supabase.admin.from('billy_ledger').insert({
      user_id: userId,
      kind: 'grant_taste',
      amount_usd: grantUsd,
      balance_after_usd: grantUsd
    });
  }

  private async applyPlusGrant(userId: string, cfg: BillyConfigDto) {
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    const current = Number(bal?.balance_usd ?? 0);
    const { balance, expireAmount } = BillyBillingService.computePlusBalance({
      currentBalance: current,
      grantUsd: cfg.plusGrantUsd,
      rolloverCapMultiplier: cfg.rolloverCapMultiplier
    });
    const lifetime =
      Number(bal?.lifetime_granted_usd ?? 0) + cfg.plusGrantUsd;
    await this.supabase.admin
      .from('billy_balances')
      .update({
        balance_usd: balance,
        lifetime_granted_usd: lifetime
      })
      .eq('user_id', userId);
    if (expireAmount > 0) {
      await this.supabase.admin.from('billy_ledger').insert({
        user_id: userId,
        kind: 'expire',
        amount_usd: -expireAmount,
        balance_after_usd: balance
      });
    }
    await this.supabase.admin.from('billy_ledger').insert({
      user_id: userId,
      kind: 'grant_plus',
      amount_usd: cfg.plusGrantUsd,
      balance_after_usd: balance
    });
  }

  private async maybeRollPeriod(userId: string) {
    const { data: sub } = await this.supabase.admin
      .from('billy_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!sub?.current_period_end) return;
    if (new Date(sub.current_period_end).getTime() > Date.now()) return;

    if (sub.status === 'canceling' || sub.cancel_at_period_end) {
      await this.forfeit(userId);
      const nextPlan = sub.plan === 'plus' ? 'taste' : 'none';
      if (nextPlan === 'taste') {
        // Dropping Plus → taste for next period if still opted into Billy elsewhere.
        const cfg = await this.getConfig();
        const start = new Date();
        const end = new Date(start.getTime() + PERIOD_MS);
        await this.supabase.admin
          .from('billy_subscriptions')
          .update({
            plan: 'taste',
            status: 'active',
            cancel_at_period_end: false,
            current_period_start: start.toISOString(),
            current_period_end: end.toISOString(),
            provider_ref: null
          })
          .eq('user_id', userId);
        await this.applyTasteGrant(userId, cfg.tasteGrantUsd);
      } else {
        await this.supabase.admin
          .from('billy_subscriptions')
          .update({
            plan: 'none',
            status: 'canceled',
            cancel_at_period_end: false
          })
          .eq('user_id', userId);
      }
      return;
    }

    if (sub.status !== 'active') return;
    const cfg = await this.getConfig();
    const start = new Date();
    const end = new Date(start.getTime() + PERIOD_MS);
    await this.supabase.admin
      .from('billy_subscriptions')
      .update({
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString()
      })
      .eq('user_id', userId);
    if (sub.plan === 'plus') {
      await this.applyPlusGrant(userId, cfg);
    } else if (sub.plan === 'taste') {
      await this.applyTasteGrant(userId, cfg.tasteGrantUsd);
    }
  }

  private async forfeit(userId: string) {
    const { data: bal } = await this.supabase.admin
      .from('billy_balances')
      .select('balance_usd')
      .eq('user_id', userId)
      .maybeSingle();
    const current = Number(bal?.balance_usd ?? 0);
    if (current <= 0) return;
    await this.supabase.admin
      .from('billy_balances')
      .update({ balance_usd: 0 })
      .eq('user_id', userId);
    await this.supabase.admin.from('billy_ledger').insert({
      user_id: userId,
      kind: 'forfeit',
      amount_usd: -current,
      balance_after_usd: 0
    });
  }
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
