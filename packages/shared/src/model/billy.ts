// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared shapes for Billy AI allowances: taste vs Billy+, balance status,
// and error codes the app shows when time runs out or vendors are down.
// ============================================

/** Which Billy plan the person is on. */
export type BillyPlan = 'none' | 'taste' | 'plus';

export type BillySubscriptionStatus =
  | 'active'
  | 'canceling'
  | 'canceled'
  | 'none';

/** Stable API codes for Billy quota / outage (never prompt content). */
export type BillyQuotaCode =
  | 'billy_allowance_exhausted'
  | 'billy_vendor_outage'
  | 'billy_not_enabled'
  | 'billy_not_eligible';

/** What Settings and the Assistant screen show about Billy time. */
export interface BillyStatusDto {
  plan: BillyPlan;
  status: BillySubscriptionStatus;
  balanceUsd: number;
  grantUsdPerMonth: number;
  rolloverCapUsd: number;
  periodEnd: string | null;
  plusPriceUsd: number;
  canStartTurn: boolean;
}

/** Admin-tunable defaults (singleton billy_config). */
export interface BillyConfigDto {
  tasteGrantUsd: number;
  plusPriceUsd: number;
  plusGrantUsd: number;
  rolloverCapMultiplier: number;
  tasteRollover: boolean;
  minBalanceToStartTurnUsd: number;
}

export const DEFAULT_BILLY_CONFIG: BillyConfigDto = {
  tasteGrantUsd: 0.5,
  plusPriceUsd: 5,
  plusGrantUsd: 3.5,
  rolloverCapMultiplier: 2,
  tasteRollover: false,
  minBalanceToStartTurnUsd: 0.01
};
