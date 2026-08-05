// ============================================
// WHAT THIS FILE DOES (plain English):
// The co-op cost simulator math: fixed hosting costs, storage pressure,
// optional messaging, and break-even members. Ported from the stewardship
// portal so mobile + admin share one model. Display dues default is $24/year.
// Copy never says "AI" — matching compute only.
// ============================================

// Bridger v1 cost model (self-hosted assumptions + optional toggles).

export const STRIPE_PERCENT = 0.029
export const STRIPE_FIXED_FEE = 0.3
export const BASE64_MULTIPLIER = 1.33
export const BACKUP_MULTIPLIER = 2.0
export const STORAGE_RESERVE = 120 // added once effective storage passes 50 GB
export const STORAGE_RESERVE_THRESHOLD_GB = 50

export interface FixedCosts {
  vps: number
  domain: number
  appleDeveloper: number
  googlePlay: number
  basicAccounting: number
  legalBasic: number
}

// Optional/future costs. Enabled by default; amounts start at $0 until priced.
export type FutureKey = "emailSms" | "pushNotifications" | "objectStorage"

export interface FutureToggle {
  enabled: boolean
  amount: number
}

export interface CostModelInputs {
  members: number
  annualDues: number
  /** Share of members who pay annual dues (0..1). */
  payingRate: number
  monthlyActiveRate: number // 0..1
  mapLoadsPerActiveUserPerMonth: number
  photosPerMemberPerMonth: number
  /** Friend photos an active member scrolls through each day. */
  friendPhotosViewedPerActiveUserPerDay: number
  avgPhotoMb: number
  fixed: FixedCosts
  mapboxCost: number // manual estimate; often $0 inside free tiers early
  paymentsEnabled: boolean
  future: Record<FutureKey, FutureToggle>
  // Optional paid people (annual dollars). Empty/0 means volunteer.
  salaryTotal: number
}

export interface CostModelResult {
  fixedTotal: number
  vpsExtra: number
  vpsTotal: number
  paymentFees: number
  netDuesPerMember: number
  mapboxEstimate: number
  annualImageGb: number
  effectiveStorageGb: number
  storageReserve: number
  futureTotal: number
  salaryTotal: number
  annualCosts: number
  annualRevenue: number
  breakEvenMembers: number | null
  monthlyActiveUsers: number
  annualMapLoads: number
  annualFriendPhotoViews: number
  monthlyEgressGb: number
}

const MAPBOX_FREE_LOADS = 50_000
const MAPBOX_COST_PER_1K_LOADS = 0.75

/** Low early-stage floor + per-member rate for transactional email / SMS. */
const EMAIL_SMS_FLOOR = 60
const EMAIL_SMS_PER_MEMBER_YEAR = 0.12

/** Low early-stage floor + per-member rate for mobile push. */
const PUSH_FLOOR = 36
const PUSH_PER_MEMBER_YEAR = 0.06

function estimateEmailSmsCost(members: number): number {
  return Math.max(
    EMAIL_SMS_FLOOR,
    Math.round(members * EMAIL_SMS_PER_MEMBER_YEAR),
  )
}

function estimatePushCost(members: number): number {
  return Math.max(PUSH_FLOOR, Math.round(members * PUSH_PER_MEMBER_YEAR))
}

/** Resolved annual cost for a future line (manual override or scaled default). */
export function resolveFutureCost(
  key: FutureKey,
  toggle: FutureToggle,
  members: number,
): number {
  if (!toggle.enabled) return 0
  if (toggle.amount > 0) return toggle.amount
  if (key === "emailSms") return estimateEmailSmsCost(members)
  if (key === "pushNotifications") return estimatePushCost(members)
  return 0
}

/** Mapbox estimate from usage when no manual override is set in assumptions. */
function estimateMapboxCost(annualMapLoads: number, manual: number): number {
  if (manual > 0) return manual
  if (annualMapLoads <= MAPBOX_FREE_LOADS) return 0
  return Math.round(
    ((annualMapLoads - MAPBOX_FREE_LOADS) / 1000) * MAPBOX_COST_PER_1K_LOADS,
  )
}

/** Extra VPS spend as storage pressure, bandwidth, and member count grow. */
function extraVpsCost(
  effectiveStorageGb: number,
  monthlyEgressGb: number,
  members: number,
): number {
  const pressureGb = Math.max(effectiveStorageGb, monthlyEgressGb)
  let extra = 0
  if (pressureGb > 20) {
    extra += Math.ceil((pressureGb - 20) / 40) * 240
  }
  if (members > 10_000) {
    extra += Math.ceil((members - 10_000) / 25_000) * 360
  }
  return extra
}

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })

/** Plain-language walkthrough of the current cost estimate. */
export function buildCostExplanation(
  inputs: CostModelInputs,
  result: CostModelResult,
): string[] {
  const activePct = Math.round(inputs.monthlyActiveRate * 100)
  const lines: string[] = [
    `Bridger v1 is modeled as a self-hosted stack (VPS, domain, PostgreSQL, Mapbox). Required fixed costs are ${fmt(result.fixedTotal)} per year before any scale-up.`,
  ]

  if (result.vpsExtra > 0) {
    lines.push(
      `At ${inputs.members.toLocaleString()} members, each posting about ${inputs.photosPerMemberPerMonth} photos per month and each active member loading ${inputs.friendPhotosViewedPerActiveUserPerDay} friend photos per day, storage reaches about ${result.effectiveStorageGb.toFixed(1)} GB with backups and serving photos adds about ${result.monthlyEgressGb.toFixed(1)} GB of monthly bandwidth. We add ${fmt(result.vpsExtra)} in extra server capacity on top of the ${fmt(inputs.fixed.vps)} base VPS.`,
    )
  } else {
    lines.push(
      `Each member posts about ${inputs.photosPerMemberPerMonth} photos per month (~${(inputs.photosPerMemberPerMonth / 30).toFixed(1)}/day). Active members load about ${inputs.friendPhotosViewedPerActiveUserPerDay} friend photos per day. Server cost stays at the ${fmt(inputs.fixed.vps)} base VPS because storage (${result.effectiveStorageGb.toFixed(1)} GB with backups) and bandwidth (${result.monthlyEgressGb.toFixed(1)} GB/mo) have not crossed the thresholds that trigger a scale-up.`,
    )
  }

  if (inputs.mapboxCost > 0) {
    lines.push(
      `Mapbox is set manually to ${fmt(result.mapboxEstimate)} per year in the cost assumptions.`,
    )
  } else if (result.mapboxEstimate > 0) {
    lines.push(
      `With ${activePct}% of members active and ${inputs.mapLoadsPerActiveUserPerMonth} map loads each per month, we estimate ${result.annualMapLoads.toLocaleString()} loads per year. After Mapbox's free tier, that adds about ${fmt(result.mapboxEstimate)}.`,
    )
  } else {
    lines.push(
      `Map loads are estimated at ${result.annualMapLoads.toLocaleString()} per year (${activePct}% active × ${inputs.mapLoadsPerActiveUserPerMonth} loads/mo). That likely stays within Mapbox free tiers, so Mapbox cost is $0 unless you set a manual estimate.`,
    )
  }

  if (result.storageReserve > 0) {
    lines.push(
      `Because effective image storage exceeds ${STORAGE_RESERVE_THRESHOLD_GB} GB, we also hold a ${fmt(result.storageReserve)} reserve for storage migration or expansion.`,
    )
  }

  if (result.futureTotal > 0) {
    lines.push(
      `Messaging and storage you have enabled add ${fmt(result.futureTotal)} per year. Email and push scale with member count when left at $0 in assumptions.`,
    )
  }

  if (result.salaryTotal > 0) {
    lines.push(`Paid team roles add ${fmt(result.salaryTotal)} per year.`)
  }

  if (result.paymentFees > 0) {
    lines.push(
      `Card payments (Stripe) add ${fmt(result.paymentFees)} in processing fees at ${fmt(inputs.annualDues)}/yr dues.`,
    )
  }

  lines.push(`Total estimated annual costs: ${fmt(result.annualCosts)}.`)
  return lines
}

export const FUTURE_LABELS: Record<FutureKey, string> = {
  emailSms: "Email / SMS",
  pushNotifications: "Push notifications",
  objectStorage: "Object storage",
}

export const DEFAULT_ANNUAL_DUES = 24

export const DEFAULT_FIXED: FixedCosts = {
  vps: 360,
  domain: 25,
  appleDeveloper: 99,
  googlePlay: 0,
  basicAccounting: 600,
  legalBasic: 1000,
}

export const DEFAULT_COST_INPUTS: CostModelInputs = {
  members: 500,
  annualDues: DEFAULT_ANNUAL_DUES,
  payingRate: 0.05,
  monthlyActiveRate: 0.65,
  mapLoadsPerActiveUserPerMonth: 8,
  photosPerMemberPerMonth: 30,
  friendPhotosViewedPerActiveUserPerDay: 50,
  avgPhotoMb: 0.5,
  fixed: { ...DEFAULT_FIXED },
  mapboxCost: 0,
  paymentsEnabled: false,
  future: {
    emailSms: { enabled: true, amount: 0 },
    pushNotifications: { enabled: true, amount: 0 },
    objectStorage: { enabled: true, amount: 0 },
  },
  salaryTotal: 0,
}

const perMemberStripeFee = (dues: number) =>
  dues * STRIPE_PERCENT + STRIPE_FIXED_FEE

export function computeCosts(inputs: CostModelInputs): CostModelResult {
  const fixedTotal =
    inputs.fixed.vps +
    inputs.fixed.domain +
    inputs.fixed.appleDeveloper +
    inputs.fixed.googlePlay +
    inputs.fixed.basicAccounting +
    inputs.fixed.legalBasic

  const monthlyActiveUsers = inputs.members * inputs.monthlyActiveRate
  const annualMapLoads =
    monthlyActiveUsers * inputs.mapLoadsPerActiveUserPerMonth * 12

  const annualImageGb =
    (inputs.members *
      inputs.photosPerMemberPerMonth *
      12 *
      inputs.avgPhotoMb *
      BASE64_MULTIPLIER) /
    1024
  const effectiveStorageGb = annualImageGb * BACKUP_MULTIPLIER
  const annualFriendPhotoViews =
    monthlyActiveUsers * inputs.friendPhotosViewedPerActiveUserPerDay * 30 * 12
  const monthlyEgressGb =
    (monthlyActiveUsers *
      inputs.friendPhotosViewedPerActiveUserPerDay *
      30 *
      inputs.avgPhotoMb) /
    1024
  const storageReserve =
    effectiveStorageGb > STORAGE_RESERVE_THRESHOLD_GB ? STORAGE_RESERVE : 0

  const vpsExtra = extraVpsCost(
    effectiveStorageGb,
    monthlyEgressGb,
    inputs.members,
  )
  const vpsTotal = inputs.fixed.vps + vpsExtra
  const mapboxEstimate = estimateMapboxCost(annualMapLoads, inputs.mapboxCost)

  const paymentFees = inputs.paymentsEnabled
    ? inputs.members * perMemberStripeFee(inputs.annualDues)
    : 0
  const netDuesPerMember = inputs.paymentsEnabled
    ? inputs.annualDues - perMemberStripeFee(inputs.annualDues)
    : inputs.annualDues

  const futureTotal = (Object.keys(inputs.future) as FutureKey[]).reduce(
    (sum, key) =>
      sum + resolveFutureCost(key, inputs.future[key], inputs.members),
    0,
  )

  const annualCosts =
    vpsTotal +
    inputs.fixed.domain +
    inputs.fixed.appleDeveloper +
    inputs.fixed.googlePlay +
    inputs.fixed.basicAccounting +
    inputs.fixed.legalBasic +
    paymentFees +
    mapboxEstimate +
    storageReserve +
    futureTotal +
    inputs.salaryTotal

  const annualRevenue = inputs.members * inputs.payingRate * netDuesPerMember
  const breakEvenMembers =
    inputs.payingRate > 0 && netDuesPerMember > 0
      ? Math.ceil(annualCosts / (netDuesPerMember * inputs.payingRate))
      : null

  return {
    fixedTotal,
    vpsExtra,
    vpsTotal,
    paymentFees,
    netDuesPerMember,
    mapboxEstimate,
    annualImageGb,
    effectiveStorageGb,
    storageReserve,
    futureTotal,
    salaryTotal: inputs.salaryTotal,
    annualCosts,
    annualRevenue,
    breakEvenMembers,
    monthlyActiveUsers,
    annualMapLoads,
    annualFriendPhotoViews,
    monthlyEgressGb,
  }
}

const py = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

// A faithful Python version of the model with the current inputs filled in, so
// every number on the page can be reproduced and checked.
export function buildCostPython(inputs: CostModelInputs): string {
  const futureLines = (Object.keys(inputs.future) as FutureKey[])
    .map(
      (key) =>
        `    "${key}": ${py(resolveFutureCost(key, inputs.future[key], inputs.members))},`,
    )
    .join("\n")

  return `import math

# -----------------------
# Inputs
# -----------------------
members              = ${inputs.members}
annual_dues          = ${py(inputs.annualDues)}
paying_rate          = ${py(inputs.payingRate)}

monthly_active_rate                   = ${py(inputs.monthlyActiveRate)}
map_loads_per_active_user_per_month   = ${py(inputs.mapLoadsPerActiveUserPerMonth)}
photos_per_member_per_month           = ${py(inputs.photosPerMemberPerMonth)}
friend_photos_viewed_per_active_user_per_day = ${py(inputs.friendPhotosViewedPerActiveUserPerDay)}
avg_photo_mb                          = ${py(inputs.avgPhotoMb)}

# -----------------------
# Required fixed costs (self-hosted v1 stack)
# -----------------------
fixed_costs = {
    "vps":              ${py(inputs.fixed.vps)},   # the server
    "domain":           ${py(inputs.fixed.domain)},
    "apple_developer":  ${py(inputs.fixed.appleDeveloper)},   # App Store program ($99/yr)
    "google_play":      ${py(inputs.fixed.googlePlay)},   # only when an Android app ships
    "basic_accounting": ${py(inputs.fixed.basicAccounting)},
    "legal_basic":      ${py(inputs.fixed.legalBasic)},
}

# -----------------------
# Payment processing (Stripe) - off until dues are actually collected
# -----------------------
payment_enabled  = ${inputs.paymentsEnabled ? "True" : "False"}
stripe_percent   = ${STRIPE_PERCENT}
stripe_fixed_fee = ${STRIPE_FIXED_FEE}

if payment_enabled:
    payment_fees        = members * ((annual_dues * stripe_percent) + stripe_fixed_fee)
    net_dues_per_member = annual_dues - ((annual_dues * stripe_percent) + stripe_fixed_fee)
else:
    payment_fees        = 0
    net_dues_per_member = annual_dues

# -----------------------
# Mapbox - manual estimate until real usage is known (often free early)
# -----------------------
mapbox_cost = ${py(inputs.mapboxCost)}
monthly_active_users = members * monthly_active_rate
annual_map_loads     = monthly_active_users * map_loads_per_active_user_per_month * 12

# Mapbox: manual override, or estimate from usage after free tier
MAPBOX_FREE_LOADS = ${MAPBOX_FREE_LOADS}
if mapbox_cost == 0:
    if annual_map_loads > MAPBOX_FREE_LOADS:
        mapbox_cost = round(((annual_map_loads - MAPBOX_FREE_LOADS) / 1000) * ${MAPBOX_COST_PER_1K_LOADS})
    else:
        mapbox_cost = 0

# -----------------------
# Database / image storage pressure
# Photos live as base64 text in PostgreSQL, so they inflate ~33%, and backups
# roughly double the footprint. This is not a separate bill today, but it tells
# us when VPS storage becomes a problem.
# -----------------------
base64_multiplier = ${BASE64_MULTIPLIER}
backup_multiplier = ${BACKUP_MULTIPLIER}

annual_image_gb = (
    members * photos_per_member_per_month * 12 * avg_photo_mb * base64_multiplier
) / 1024
effective_storage_gb = annual_image_gb * backup_multiplier
storage_reserve = ${STORAGE_RESERVE} if effective_storage_gb > ${STORAGE_RESERVE_THRESHOLD_GB} else 0

monthly_egress_gb = (
    monthly_active_users
    * friend_photos_viewed_per_active_user_per_day
    * 30
    * avg_photo_mb
) / 1024
infrastructure_pressure_gb = max(effective_storage_gb, monthly_egress_gb)

# VPS: base server + scale-up as storage, bandwidth, and members grow
vps_extra = 0
if infrastructure_pressure_gb > 20:
    vps_extra += math.ceil((infrastructure_pressure_gb - 20) / 40) * 240
if members > 10000:
    vps_extra += math.ceil((members - 10000) / 25000) * 360
vps_total = fixed_costs["vps"] + vps_extra

# -----------------------
# Optional messaging & storage — email/push scale when amount left at 0
# email: max($${EMAIL_SMS_FLOOR}, members * ${EMAIL_SMS_PER_MEMBER_YEAR})
# push:  max($${PUSH_FLOOR}, members * ${PUSH_PER_MEMBER_YEAR})
future_costs = {
${futureLines}
}

# Optional paid people (annual). Empty means the team is volunteer.
paid_people = ${py(inputs.salaryTotal)}

# -----------------------
# Totals
# -----------------------
annual_costs = (
    fixed_costs["domain"]
    + fixed_costs["apple_developer"]
    + fixed_costs["google_play"]
    + fixed_costs["basic_accounting"]
    + fixed_costs["legal_basic"]
    + vps_total
    + payment_fees
    + mapbox_cost
    + storage_reserve
    + sum(future_costs.values())
    + paid_people
)

annual_revenue     = members * paying_rate * net_dues_per_member
break_even_members = (
    math.ceil(annual_costs / (net_dues_per_member * paying_rate))
    if net_dues_per_member and paying_rate
    else None
)

print(f"Annual costs:        \${annual_costs:,.0f}")
print(f"Annual revenue:      \${annual_revenue:,.0f}")
print(f"Break-even members:  {break_even_members:,}")
print(f"Annual map loads:    {annual_map_loads:,.0f}")
print(f"Friend photo views:  {monthly_active_users * friend_photos_viewed_per_active_user_per_day * 30 * 12:,.0f}/yr")
print(f"Effective storage:   {effective_storage_gb:,.1f} GB")
print(f"Monthly egress:      {monthly_egress_gb:,.1f} GB")`
}
