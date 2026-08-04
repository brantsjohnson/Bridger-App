import type { BadgeTone } from "./ui"

export const CATEGORY_LABELS: Record<string, string> = {
  connection: "Connection",
  activities: "Activities",
  events: "Events",
  friends: "Friends",
  groups: "Groups",
  safety: "Safety",
  privacy: "Privacy",
  accessibility: "Accessibility",
  monetization: "Monetization",
  other: "Other",
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const URGENCY_LABELS: Record<string, string> = {
  not_urgent: "Not urgent",
  helpful_soon: "Helpful soon",
  important: "Important",
  critical: "Critical",
}

export const URGENCY_OPTIONS = Object.entries(URGENCY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

// --- structured idea submission template ----------------------------------

export interface ChoiceOption {
  value: string
  label: string
  hint?: string
}

export const IMPACT_LABELS: Record<string, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
}

export const IMPACT_OPTIONS: ChoiceOption[] = [
  { value: "high", label: "High impact" },
  { value: "medium", label: "Medium impact" },
  { value: "low", label: "Low impact" },
]

export const IMPACT_TONE: Record<string, BadgeTone> = {
  high: "yes",
  medium: "planned",
  low: "neutral",
}

export const COST_GUESS_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  major: "Major",
}

export const COST_GUESS_OPTIONS: ChoiceOption[] = [
  { value: "small", label: "Small", hint: "Less than 1 week" },
  { value: "medium", label: "Medium", hint: "1 to 4 weeks" },
  { value: "large", label: "Large", hint: "1 to 3 months" },
  { value: "major", label: "Major", hint: "3+ months" },
]

export const FUNDING_MODEL_LABELS: Record<string, string> = {
  free: "Free",
  subscription: "Part of a subscription",
  pay_as_you_go: "Pay as you go",
  other: "Other",
}

export const FUNDING_MODEL_OPTIONS: ChoiceOption[] = [
  { value: "free", label: "Free" },
  { value: "subscription", label: "Part of a subscription" },
  { value: "pay_as_you_go", label: "Pay as you go" },
  { value: "other", label: "Other" },
]

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  user_feedback: "User feedback",
  competitor: "Competitor examples",
  academic: "Academic research",
  industry: "Industry reports",
  personal: "Personal experience",
  survey: "Survey results",
}

export const EVIDENCE_TYPE_OPTIONS: ChoiceOption[] = Object.entries(
  EVIDENCE_TYPE_LABELS,
).map(([value, label]) => ({ value, label }))

export const RISK_TYPE_LABELS: Record<string, string> = {
  privacy: "Privacy concerns",
  confusion: "User confusion",
  moderation: "Increased moderation",
  cost: "Higher costs",
  complexity: "Feature complexity",
  engagement: "Lower engagement elsewhere",
}

export const RISK_TYPE_OPTIONS: ChoiceOption[] = Object.entries(
  RISK_TYPE_LABELS,
).map(([value, label]) => ({ value, label }))

export const COST_AREA_LABELS: Record<string, string> = {
  design: "Design",
  engineering: "Engineering",
  infrastructure: "Infrastructure",
  marketing: "Marketing",
}

export const COST_AREA_OPTIONS: ChoiceOption[] = Object.entries(
  COST_AREA_LABELS,
).map(([value, label]) => ({ value, label }))

export function labelsFor(
  values: string[] | null | undefined,
  map: Record<string, string>,
): string[] {
  if (!values) return []
  return values.map((v) => map[v] ?? v)
}

// Map a submitter's cost guess (small|medium|large|major) onto the build-time
// scale used for funding math, so an unestimated idea can still show a range.
export const COST_GUESS_TO_SCALE: Record<string, string> = {
  small: "small",
  medium: "medium",
  large: "large",
  major: "very_large",
}

export interface StatusMeta {
  label: string
  tone: BadgeTone
  explanation: string
}

export const STATUS_META: Record<string, StatusMeta> = {
  submitted: {
    label: "Submitted",
    tone: "neutral",
    explanation: "This idea has been shared and is waiting for a first look.",
  },
  under_review: {
    label: "Under Review",
    tone: "planned",
    explanation: "The team is reading through this idea right now.",
  },
  needs_more_detail: {
    label: "Needs More Detail",
    tone: "limited",
    explanation:
      "A few things are unclear. More detail would help us understand it.",
  },
  cost_estimate_needed: {
    label: "Cost Estimate Needed",
    tone: "limited",
    explanation:
      "We like the direction and want to estimate the work it would take.",
  },
  community_discussion: {
    label: "Community Discussion",
    tone: "planned",
    explanation: "This idea is open for the community to weigh in and discuss.",
  },
  planned: {
    label: "Planned",
    tone: "yes",
    explanation: "This idea is on the roadmap and expected to be built.",
  },
  deferred: {
    label: "Deferred",
    tone: "limited",
    explanation: "This idea may be valuable, but it is not the right time yet.",
  },
  declined: {
    label: "Declined",
    tone: "no",
    explanation:
      "After review, this idea is not moving forward, but it stays visible here.",
  },
  implemented: {
    label: "Implemented",
    tone: "yes",
    explanation: "This idea has been built and is part of Bridger.",
  },
}

export function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status,
      tone: "neutral",
      explanation: "",
    }
  )
}

export const LEVEL_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  very_large: "Very Large",
  low: "Low",
  high: "High",
}

export function levelLabel(value: string | null | undefined): string {
  if (!value) return "n/a"
  return LEVEL_LABELS[value] ?? value
}

// Rough placeholder cost of building an idea, keyed by its build-time scale.
// These are planning estimates, not quotes, and pair with the dues math so the
// community can see roughly what an idea's scale would cost to fund.
export interface ScaleCost {
  label: string
  buildCost: number
  monthlyUpkeep: number
}

export const SCALE_COST: Record<string, ScaleCost> = {
  small: { label: "Small", buildCost: 2000, monthlyUpkeep: 50 },
  medium: { label: "Medium", buildCost: 8000, monthlyUpkeep: 150 },
  large: { label: "Large", buildCost: 25000, monthlyUpkeep: 400 },
  very_large: { label: "Very Large", buildCost: 60000, monthlyUpkeep: 1000 },
}

export function scaleCost(value: string | null | undefined): ScaleCost | null {
  if (!value) return null
  return SCALE_COST[value] ?? null
}

// Number of people the flat SCALE_COST upkeep figures are calibrated to. Idea
// running costs scale up and down from here as usage changes.
export const SCALE_REFERENCE_USERS = 1000

/**
 * Rough yearly running cost of an idea at a given number of app users. The
 * one-time build cost is fixed by the feature's scale; the yearly upkeep scales
 * in proportion to how many people use the app (base upkeep is calibrated to
 * SCALE_REFERENCE_USERS people). Planning estimate, not a quote.
 */
export function ideaAnnualCost(
  scale: ScaleCost,
  members: number,
): { buildCost: number; annualUpkeep: number } {
  const usageFactor = members > 0 ? members / SCALE_REFERENCE_USERS : 0
  return {
    buildCost: scale.buildCost,
    annualUpkeep: Math.round(scale.monthlyUpkeep * 12 * usageFactor),
  }
}

export function formatUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString()
}

export function pctOfPool(cost: number, pool: number): string {
  if (pool <= 0) return "n/a"
  const ratio = cost / pool
  if (ratio < 0.01) return "<1%"
  if (ratio > 5) return `${Math.round(ratio)}× one year's dues`
  return `${Math.round(ratio * 100)}% of one year's dues`
}

export function ideaScalePreview(
  costGuess: string | null | undefined,
  members: number,
  annualDues: number,
): {
  scale: ScaleCost
  pool: number
  buildPct: string
  upkeepPct: string
} | null {
  const buildScale = costGuess ? COST_GUESS_TO_SCALE[costGuess] : null
  const scale = scaleCost(buildScale)
  if (!scale) return null
  const pool = members * annualDues
  return {
    scale,
    pool,
    buildPct: pctOfPool(scale.buildCost, pool),
    upkeepPct: pctOfPool(scale.monthlyUpkeep * 12, pool),
  }
}

export const ROLE_STATUS_LABELS: Record<
  string,
  { label: string; tone: BadgeTone }
> = {
  founder: { label: "Currently volunteer", tone: "limited" },
  volunteer: { label: "Currently volunteer", tone: "limited" },
  partially_funded: { label: "Partially funded", tone: "yes" },
  open: { label: "Currently volunteer", tone: "limited" },
}

export const BETA_VOTE_LABELS: Record<string, string> = {
  yes: "Yes, approve it",
  no: "No, don't like it",
  extend: "Extend deliberation",
}

export const CONFIDENCE_TONE: Record<string, BadgeTone> = {
  Strong: "yes",
  Mixed: "limited",
  "Needs Review": "neutral",
}
