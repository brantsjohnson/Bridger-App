// ============================================
// WHAT THIS FILE DOES (plain English):
// Quick checks for Billy+ rollover math (run with tsx, no Jest).
// ============================================
import { BillyBillingService } from './billy-billing.service';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const under = BillyBillingService.computePlusBalance({
  currentBalance: 1,
  grantUsd: 3.5,
  rolloverCapMultiplier: 2
});
assert(under.balance === 4.5, `expected 4.5 got ${under.balance}`);
assert(under.expireAmount === 0, 'expected no expire under cap');

const capped = BillyBillingService.computePlusBalance({
  currentBalance: 6,
  grantUsd: 3.5,
  rolloverCapMultiplier: 2
});
assert(capped.balance === 7, `expected 7 got ${capped.balance}`);
assert(capped.expireAmount === 2.5, `expected expire 2.5 got ${capped.expireAmount}`);

console.log('billy-billing.service.spec.ts: ok');
