/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EMAIL_RE } from "../../lib/constants"
import { decryptBytes, hmacEmail } from "../../lib/crypto"
import { getWaitlistCount } from "../../lib/waitlistCount"
import prisma from "../../prisma"
import { verifyBetaCode } from "../auth/service"
import {
  notifyReviewTeamOfNewIdea,
  notifySubmitterOfReviewDecision,
  sendCustomIdeaUpdate,
} from "./ideaNotifications"
import { ensureSeeded } from "./seed"

// --- validation vocab -------------------------------------------------------

export const IDEA_CATEGORIES = [
  "connection",
  "activities",
  "events",
  "friends",
  "groups",
  "safety",
  "privacy",
  "accessibility",
  "monetization",
  "other",
] as const

export const IDEA_URGENCIES = [
  "not_urgent",
  "helpful_soon",
  "important",
  "critical",
] as const

export const IDEA_STATUSES = [
  "submitted",
  "under_review",
  "needs_more_detail",
  "cost_estimate_needed",
  "community_discussion",
  "planned",
  "deferred",
  "declined",
  "implemented",
] as const

const BETA_VOTES = ["yes", "no", "extend"] as const
const VOTING_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const IDEA_AUTO_APPROVE_MS = 48 * 60 * 60 * 1000
const INTEREST_LEVELS = ["curious", "interested", "committed"] as const

// Structured idea submission vocab.
export const IMPACT_LEVELS = ["high", "medium", "low"] as const
export const COST_GUESSES = ["small", "medium", "large", "major"] as const
export const FUNDING_MODELS = [
  "free",
  "subscription",
  "pay_as_you_go",
  "other",
] as const
export const EVIDENCE_TYPES = [
  "user_feedback",
  "competitor",
  "academic",
  "industry",
  "personal",
  "survey",
] as const
export const RISK_TYPES = [
  "privacy",
  "confusion",
  "moderation",
  "cost",
  "complexity",
  "engagement",
] as const
export const COST_AREAS = [
  "design",
  "engineering",
  "infrastructure",
  "marketing",
] as const

const COST_LEVELS = ["small", "medium", "large", "very_large"] as const
const QUAL_LEVELS = ["low", "medium", "high"] as const

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null
}

// Sanitize a multi-select into a csv of only allowed tokens.
function csvOf(value: unknown, allowed: readonly string[]): string | null {
  const parts = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : []
  const picked = parts
    .map((v) => String(v).trim())
    .filter((v) => allowed.includes(v))
  return picked.length ? picked.join(",") : null
}

// --- admin identification ---------------------------------------------------
// No role column exists on User, so co-op admins are configured by username in
// the COOP_ADMIN_USERNAMES env var (comma-separated, case-insensitive).

const ADMIN_USERNAMES = (process.env.COOP_ADMIN_USERNAMES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

function adminEmailAllowList(): string[] {
  return (process.env.COOP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function adminEmailHashes(): string[] {
  return adminEmailAllowList().map((email) => hmacEmail(email))
}

export async function isAdminUser(userId: number | null): Promise<boolean> {
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, emailHash: true, emailCipher: true },
  })
  if (!user) return false

  const allowedEmails = adminEmailAllowList()
  const allowedHashes = adminEmailHashes()
  if (allowedHashes.length > 0) {
    if (allowedHashes.includes(user.emailHash)) return true
    if (user.emailCipher) {
      try {
        const email = decryptBytes(user.emailCipher).trim().toLowerCase()
        if (allowedEmails.includes(email)) return true
      } catch {
        // ignore decrypt failures
      }
    }
  }

  if (!user.username || ADMIN_USERNAMES.length === 0) return false
  return ADMIN_USERNAMES.includes(user.username.toLowerCase())
}

export async function getBetaAccessStatus(
  userId: number | null,
): Promise<boolean> {
  if (!userId) return false
  // Every Bridger account requires a valid beta code at registration, so any
  // signed-in member is a beta tester and may vote. (A future paying-member
  // gate will replace this once dues are live.)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  return !!user
}

// --- waitlist (the "second punch") ------------------------------------------
// After signing in, a member also has to be on the Bridger waitlist. The
// waitlist and user records share the same email HMAC + cipher (same keys), so
// we can check membership and copy the email over without re-deriving it.

export async function getWaitlistStatus(
  userId: number | null,
): Promise<boolean> {
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailHash: true },
  })
  if (!user) return false
  const existing = await prisma.waitlist.findUnique({
    where: { emailHash: user.emailHash },
    select: { id: true },
  })
  return Boolean(existing)
}

export async function joinWaitlist(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailHash: true, emailCipher: true },
  })
  if (!user) return { error: "user_not_found", status: 404 }

  await prisma.waitlist.upsert({
    where: { emailHash: user.emailHash },
    update: {},
    create: {
      emailHash: user.emailHash,
      emailCipher: user.emailCipher,
      source: "co-op",
    },
  })
  return { ok: true, onWaitlist: true }
}

// Preferred annual membership dues options members can vote on (whole dollars).
export const DUES_PRESETS = [5, 10, 15, 20, 30, 50] as const
// Dues used for any "what if" math before the community has voted.
const DEFAULT_DUES = 30

type IdeaStatus = (typeof IDEA_STATUSES)[number]

function clampText(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, max)
}

// --- public author shape ----------------------------------------------------
// We expose only the public handle, never email or internal numeric joins
// beyond what is needed to render the page.

function authorLabel(user: { username: string | null; name: string }): string {
  return user.username ?? user.name ?? "A member"
}

// --- overview ---------------------------------------------------------------

export async function getOverview() {
  await ensureSeeded()

  const [
    ideasSubmitted,
    ideasSupported,
    ideasImplemented,
    interestCount,
    missionSupportCount,
    currentBeta,
    betaFeedback,
    economics,
  ] = await Promise.all([
    prisma.idea.count(),
    prisma.ideaSupport.count(),
    prisma.idea.count({ where: { status: "implemented" } }),
    prisma.coOpInterest.count(),
    prisma.missionSupport.count(),
    prisma.betaVersion.findFirst({
      where: { isCurrent: true },
      orderBy: { sortOrder: "desc" },
    }),
    prisma.betaVote.count(),
    prisma.economicsAssumption.findFirst({ where: { active: true } }),
  ])

  const annualCosts = economics ? sumCosts(economics) : 0
  const breakEven = economics ? Math.ceil(annualCosts / DEFAULT_DUES) : 0

  // Release confidence for the current beta's active voting round.
  let releaseConfidence = "Needs Review"
  if (currentBeta) {
    const votes = await prisma.betaVote.groupBy({
      by: ["vote"],
      where: { betaVersionId: currentBeta.id, round: currentBeta.votingRound },
      _count: true,
    })
    releaseConfidence = confidenceFromVotes(votes, currentBeta.decision)
  }

  const totalVolunteerHours = await prisma.role.aggregate({
    where: { active: true },
    _sum: { estimatedMonthlyHours: true },
  })

  return {
    ideas: {
      submitted: ideasSubmitted,
      supported: ideasSupported,
      implemented: ideasImplemented,
    },
    beta: {
      currentVersion: currentBeta?.versionName ?? "Coming soon",
      feedbackReceived: betaFeedback,
      releaseConfidence,
    },
    coop: {
      currentPhase: "Phase 1: Founding Community",
      futureMembersInterested: interestCount,
      missionPrinciplesSupported: missionSupportCount,
    },
    economics: {
      estimatedMonthlyCost: Math.round(annualCosts / 12),
      volunteerHours: totalVolunteerHours._sum.estimatedMonthlyHours ?? 0,
      breakEvenMembers: breakEven,
    },
  }
}

function sumCosts(e: {
  hosting: number
  ai: number
  storage: number
  emailSms: number
  legal: number
  accounting: number
  development: number
  moderation: number
  marketing: number
  support: number
  events: number
  communityActivities: number
}): number {
  return (
    e.hosting +
    e.ai +
    e.storage +
    e.emailSms +
    e.legal +
    e.accounting +
    e.development +
    e.moderation +
    e.marketing +
    e.support +
    e.events +
    e.communityActivities
  )
}

function confidenceFromVotes(
  votes: { vote: string; _count: number }[],
  decision?: string,
): "Strong" | "Mixed" | "Needs Review" {
  if (decision === "approved") return "Strong"
  if (decision === "rejected") return "Needs Review"
  const map = new Map(votes.map((v) => [v.vote, v._count]))
  const yes = map.get("yes") ?? 0
  const no = map.get("no") ?? 0
  const extend = map.get("extend") ?? 0
  const total = yes + no + extend
  if (total === 0) return "Needs Review"
  const yesShare = yes / total
  const noShare = no / total
  if (yesShare >= 0.6 && noShare < 0.2) return "Strong"
  if (noShare >= 0.4) return "Needs Review"
  return "Mixed"
}

// --- ideas ------------------------------------------------------------------

interface ListIdeaFilters {
  status?: string
  category?: string
  sort?: string
  pending?: string
}

export async function listIdeas(
  filters: ListIdeaFilters,
  viewerId: number | null,
  opts?: { asAdmin?: boolean },
) {
  await ensureSeeded()

  const admin = opts?.asAdmin || (await isAdminUser(viewerId))
  const where: Record<string, unknown> = {}

  if (filters.pending === "1") {
    // Admin-only review queue of unapproved ideas.
    if (!admin) return []
    where.approved = false
  } else if (!admin) {
    // The public only sees approved ideas; an author can still see their own.
    where.OR = [{ approved: true }, ...(viewerId ? [{ userId: viewerId }] : [])]
  }

  if (filters.status && IDEA_STATUSES.includes(filters.status as IdeaStatus)) {
    where.status = filters.status
  }
  if (
    filters.category &&
    IDEA_CATEGORIES.includes(
      filters.category as (typeof IDEA_CATEGORIES)[number],
    )
  ) {
    where.category = filters.category
  }

  const ideas = await prisma.idea.findMany({
    where,
    orderBy:
      filters.sort === "newest"
        ? { createdAt: "desc" }
        : { supports: { _count: "desc" } },
    include: {
      user: { select: { username: true, name: true } },
      costEstimate: {
        select: { buildTime: true, estimatedMonthlyCost: true },
      },
      _count: { select: { supports: true, comments: true } },
      supports: viewerId
        ? { where: { userId: viewerId }, select: { id: true } }
        : false,
    },
    take: 200,
  })

  return ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    problem: idea.problem,
    category: idea.category,
    urgency: idea.urgency,
    impactLevel: idea.impactLevel,
    costGuess: idea.costGuess,
    fundingModel: idea.fundingModel,
    fundingModelNote: idea.fundingModelNote,
    implementationTime: idea.implementationTime,
    cost: idea.cost,
    approved: idea.approved,
    status: idea.status,
    author: authorLabel(idea.user),
    supportCount: idea._count.supports,
    commentCount: idea._count.comments,
    buildTime: idea.costEstimate?.buildTime ?? null,
    estimatedMonthlyCost: idea.costEstimate?.estimatedMonthlyCost ?? null,
    viewerSupports: Array.isArray(idea.supports) && idea.supports.length > 0,
    createdAt: idea.createdAt,
  }))
}

export async function getIdea(
  id: number,
  viewerId: number | null,
  opts?: { asAdmin?: boolean },
) {
  await ensureSeeded()

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, name: true } },
      costEstimate: true,
      _count: { select: { supports: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true, name: true } } },
      },
      supports: viewerId
        ? { where: { userId: viewerId }, select: { id: true } }
        : false,
    },
  })
  if (!idea) return null

  // Unapproved ideas are visible only to their author and to admins.
  if (!idea.approved) {
    const admin = opts?.asAdmin || (await isAdminUser(viewerId))
    if (!admin && idea.userId !== viewerId) return null
  }

  return {
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    problem: idea.problem,
    affectedUsers: idea.affectedUsers,
    proposedSolution: idea.proposedSolution,
    benefits: idea.benefits,
    drawbacks: idea.drawbacks,
    successMetrics: idea.successMetrics,
    estimatedReach: idea.estimatedReach,
    category: idea.category,
    urgency: idea.urgency,
    evidence: idea.evidence,
    evidenceTypes: idea.evidenceTypes
      ? idea.evidenceTypes.split(",").filter(Boolean)
      : [],
    riskTypes: idea.riskTypes ? idea.riskTypes.split(",").filter(Boolean) : [],
    impactLevel: idea.impactLevel,
    impactRationale: idea.impactRationale,
    costGuess: idea.costGuess,
    fundingModel: idea.fundingModel,
    fundingModelNote: idea.fundingModelNote,
    implementationTime: idea.implementationTime,
    cost: idea.cost,
    notifyEmail: idea.notifyEmail,
    costAreas: idea.costAreas,
    approved: idea.approved,
    isOwner: idea.userId === viewerId,
    status: idea.status,
    decisionNote: idea.decisionNote,
    author: authorLabel(idea.user),
    supportCount: idea._count.supports,
    viewerSupports: Array.isArray(idea.supports) && idea.supports.length > 0,
    costEstimate: idea.costEstimate
      ? {
          buildTime: idea.costEstimate.buildTime,
          maintenanceLevel: idea.costEstimate.maintenanceLevel,
          complexityLevel: idea.costEstimate.complexityLevel,
          userImpact: idea.costEstimate.userImpact,
          privacyImpact: idea.costEstimate.privacyImpact,
          missionAlignment: idea.costEstimate.missionAlignment,
          estimatedMonthlyCost: idea.costEstimate.estimatedMonthlyCost,
        }
      : null,
    comments: idea.comments.map((c) => ({
      id: c.id,
      body: c.body,
      author: authorLabel(c.user),
      createdAt: c.createdAt,
    })),
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }
}

interface CreateIdeaInput {
  title?: string
  summary?: string
  problem?: string
  evidence?: string
  drawbacks?: string
  costGuess?: string
  fundingModel?: string
  fundingModelNote?: string
  notifyEmail?: string
  category?: string
}

export async function createIdea(userId: number, input: CreateIdeaInput) {
  const title = clampText(input.title, 140)
  const summary = clampText(input.summary, 600)
  const problem = clampText(input.problem, 2000)
  const evidence = clampText(input.evidence, 2000)
  const risks = clampText(input.drawbacks, 2000)
  const costGuess = oneOf(input.costGuess, COST_GUESSES)
  const fundingModel = oneOf(input.fundingModel, FUNDING_MODELS)
  const fundingModelNote = clampText(input.fundingModelNote, 500)
  const notifyEmailRaw = clampText(input.notifyEmail, 254)
  const notifyEmail =
    notifyEmailRaw && EMAIL_RE.test(notifyEmailRaw) ? notifyEmailRaw : null

  if (title.length < 3) return { error: "title_required", status: 400 }
  if (summary.length < 3) return { error: "summary_required", status: 400 }
  if (problem.length < 10) return { error: "problem_required", status: 400 }
  if (evidence.length < 10) return { error: "evidence_required", status: 400 }
  if (risks.length < 10) return { error: "risks_required", status: 400 }
  if (!costGuess) return { error: "length_required", status: 400 }
  if (!fundingModel) return { error: "funding_model_required", status: 400 }
  if (fundingModel === "other" && fundingModelNote.length < 3) {
    return { error: "funding_model_note_required", status: 400 }
  }
  if (notifyEmailRaw && !notifyEmail) {
    return { error: "invalid_notify_email", status: 400 }
  }

  const category = IDEA_CATEGORIES.includes(
    input.category as (typeof IDEA_CATEGORIES)[number],
  )
    ? (input.category as string)
    : "other"

  const idea = await prisma.idea.create({
    data: {
      userId,
      title,
      summary,
      problem,
      evidence,
      drawbacks: risks,
      costGuess,
      fundingModel,
      fundingModelNote: fundingModel === "other" ? fundingModelNote : null,
      notifyEmail,
      category,
      urgency: "not_urgent",
      approved: false,
      status: "submitted",
    },
    include: { user: { select: { username: true, name: true } } },
  })

  void notifyReviewTeamOfNewIdea({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    problem: idea.problem,
    evidence: idea.evidence,
    evidenceTypes: idea.evidenceTypes,
    drawbacks: idea.drawbacks,
    riskTypes: idea.riskTypes,
    costGuess: idea.costGuess,
    fundingModel: idea.fundingModel,
    fundingModelNote: idea.fundingModelNote,
    implementationTime: idea.implementationTime,
    cost: idea.cost,
    costAreas: idea.costAreas,
    notifyEmail: idea.notifyEmail,
    status: idea.status,
    decisionNote: idea.decisionNote,
    authorLabel: authorLabel(idea.user),
  })

  return { ok: true, id: idea.id }
}

export async function toggleSupport(ideaId: number, userId: number) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } })
  if (!idea) return { error: "not_found", status: 404 }
  if (!idea.approved) return { error: "not_approved", status: 403 }

  const existing = await prisma.ideaSupport.findUnique({
    where: { ideaId_userId: { ideaId, userId } },
  })
  if (existing) {
    await prisma.ideaSupport.delete({ where: { id: existing.id } })
  } else {
    await prisma.ideaSupport.create({ data: { ideaId, userId } })
  }
  const supportCount = await prisma.ideaSupport.count({ where: { ideaId } })
  return { ok: true, supporting: !existing, supportCount }
}

export async function addComment(ideaId: number, userId: number, body: string) {
  const text = clampText(body, 2000)
  if (text.length < 1) return { error: "empty_comment", status: 400 }
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } })
  if (!idea) return { error: "not_found", status: 404 }
  if (!idea.approved) return { error: "not_approved", status: 403 }
  const comment = await prisma.ideaComment.create({
    data: { ideaId, userId, body: text },
    include: { user: { select: { username: true, name: true } } },
  })
  return {
    ok: true,
    comment: {
      id: comment.id,
      body: comment.body,
      author: authorLabel(comment.user),
      createdAt: comment.createdAt,
    },
  }
}

// --- admin: review, adjust, approve ----------------------------------------

interface CostEstimateInput {
  buildTime?: string
  maintenanceLevel?: string
  complexityLevel?: string
  userImpact?: string
  privacyImpact?: string
  missionAlignment?: string
  estimatedMonthlyCost?: number | string | null
}

interface UpdateIdeaInput {
  title?: string
  summary?: string
  problem?: string
  evidence?: string
  drawbacks?: string
  implementationTime?: string
  cost?: string
  impactLevel?: string
  impactRationale?: string
  costGuess?: string
  costAreas?: unknown
  evidenceTypes?: unknown
  riskTypes?: unknown
  category?: string
  status?: string
  decisionNote?: string
  approved?: boolean
  costEstimate?: CostEstimateInput
}

export async function updateIdea(
  adminId: number,
  ideaId: number,
  input: UpdateIdeaInput,
  opts?: { bypassAdminCheck?: boolean },
) {
  if (!opts?.bypassAdminCheck && !(await isAdminUser(adminId))) {
    return { error: "forbidden", status: 403 }
  }
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } })
  if (!idea) return { error: "not_found", status: 404 }

  const data: Record<string, unknown> = {}
  if (typeof input.title === "string") data.title = clampText(input.title, 140)
  if (typeof input.summary === "string")
    data.summary = clampText(input.summary, 600)
  if (typeof input.problem === "string")
    data.problem = clampText(input.problem, 2000)
  if (typeof input.evidence === "string")
    data.evidence = clampText(input.evidence, 2000)
  if (typeof input.drawbacks === "string")
    data.drawbacks = clampText(input.drawbacks, 2000)
  if (typeof input.implementationTime === "string")
    data.implementationTime = clampText(input.implementationTime, 2000)
  if (typeof input.cost === "string") data.cost = clampText(input.cost, 2000)
  if (typeof input.impactRationale === "string")
    data.impactRationale = clampText(input.impactRationale, 2000)
  if (typeof input.decisionNote === "string")
    data.decisionNote = clampText(input.decisionNote, 2000) || null
  if (input.impactLevel !== undefined)
    data.impactLevel = oneOf(input.impactLevel, IMPACT_LEVELS)
  if (input.costGuess !== undefined)
    data.costGuess = oneOf(input.costGuess, COST_GUESSES)
  if (input.evidenceTypes !== undefined)
    data.evidenceTypes = csvOf(input.evidenceTypes, EVIDENCE_TYPES)
  if (input.riskTypes !== undefined)
    data.riskTypes = csvOf(input.riskTypes, RISK_TYPES)
  if (input.costAreas !== undefined)
    data.costAreas = clampText(input.costAreas, 500) || null
  if (
    input.category !== undefined &&
    IDEA_CATEGORIES.includes(input.category as (typeof IDEA_CATEGORIES)[number])
  )
    data.category = input.category
  if (
    input.status !== undefined &&
    IDEA_STATUSES.includes(input.status as IdeaStatus)
  )
    data.status = input.status
  if (typeof input.approved === "boolean") {
    data.approved = input.approved
    if (input.approved && !idea.approved) data.approvedAt = new Date()
  }

  await prisma.idea.update({ where: { id: ideaId }, data })

  const updated = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { user: { select: { username: true, name: true } } },
  })
  if (updated) {
    void notifySubmitterOfReviewDecision(
      {
        id: updated.id,
        title: updated.title,
        summary: updated.summary,
        problem: updated.problem,
        evidence: updated.evidence,
        evidenceTypes: updated.evidenceTypes,
        drawbacks: updated.drawbacks,
        riskTypes: updated.riskTypes,
        costGuess: updated.costGuess,
        fundingModel: updated.fundingModel,
        fundingModelNote: updated.fundingModelNote,
        implementationTime: updated.implementationTime,
        cost: updated.cost,
        costAreas: updated.costAreas,
        notifyEmail: updated.notifyEmail,
        status: updated.status,
        decisionNote: updated.decisionNote,
        authorLabel: authorLabel(updated.user),
      },
      idea.status,
    )
  }

  // Admin-authored cost estimate (the "general accuracy" pass).
  if (input.costEstimate) {
    const c = input.costEstimate
    const monthly =
      c.estimatedMonthlyCost === null ||
      c.estimatedMonthlyCost === undefined ||
      c.estimatedMonthlyCost === ""
        ? null
        : Math.max(0, Math.round(Number(c.estimatedMonthlyCost)) || 0)
    const estData = {
      buildTime: oneOf(c.buildTime, COST_LEVELS),
      maintenanceLevel: oneOf(c.maintenanceLevel, QUAL_LEVELS),
      complexityLevel: oneOf(c.complexityLevel, QUAL_LEVELS),
      userImpact: oneOf(c.userImpact, QUAL_LEVELS),
      privacyImpact: oneOf(c.privacyImpact, QUAL_LEVELS),
      missionAlignment: oneOf(c.missionAlignment, QUAL_LEVELS),
      estimatedMonthlyCost: monthly,
      createdBy: adminId,
    }
    await prisma.ideaCostEstimate.upsert({
      where: { ideaId },
      update: estData,
      create: { ideaId, ...estData },
    })
  }

  return { ok: true }
}

export async function listAdminIdeas(
  adminId: number,
  filters: { pending?: boolean } = {},
  opts?: { bypassAdminCheck?: boolean },
) {
  if (!opts?.bypassAdminCheck && !(await isAdminUser(adminId))) {
    return { error: "forbidden", status: 403 }
  }
  return listIdeas(
    filters.pending ? { pending: "1", sort: "newest" } : { sort: "newest" },
    adminId,
    opts?.bypassAdminCheck ? { asAdmin: true } : undefined,
  )
}

export async function getAdminIdea(
  adminId: number,
  ideaId: number,
  opts?: { bypassAdminCheck?: boolean },
) {
  if (!opts?.bypassAdminCheck && !(await isAdminUser(adminId))) {
    return { error: "forbidden", status: 403 }
  }
  const idea = await getIdea(
    ideaId,
    adminId,
    opts?.bypassAdminCheck ? { asAdmin: true } : undefined,
  )
  if (!idea) return { error: "not_found", status: 404 }
  return idea
}

export async function approveIdea(
  adminId: number,
  ideaId: number,
  opts?: { bypassAdminCheck?: boolean },
) {
  return updateIdea(
    adminId,
    ideaId,
    {
      approved: true,
      status: "community_discussion",
    },
    opts,
  )
}

export async function denyIdea(
  adminId: number,
  ideaId: number,
  note?: string,
  opts?: { bypassAdminCheck?: boolean },
) {
  return updateIdea(
    adminId,
    ideaId,
    {
      approved: false,
      status: "declined",
      decisionNote: note ?? "",
    },
    opts,
  )
}

export async function sendIdeaUpdateEmail(
  adminId: number,
  ideaId: number,
  input: { subject?: string; message?: string },
  opts?: { bypassAdminCheck?: boolean },
) {
  if (!opts?.bypassAdminCheck && !(await isAdminUser(adminId))) {
    return { error: "forbidden", status: 403 }
  }
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { user: { select: { username: true, name: true } } },
  })
  if (!idea) return { error: "not_found", status: 404 }

  const message = clampText(input.message, 4000)
  if (message.length < 3) {
    return { error: "message_required", status: 400 }
  }
  if (!idea.notifyEmail || !EMAIL_RE.test(idea.notifyEmail)) {
    return { error: "no_notify_email", status: 400 }
  }

  const subject =
    clampText(input.subject, 200) ||
    `[Bridger] Update on your idea: ${idea.title}`

  await sendCustomIdeaUpdate({
    to: idea.notifyEmail,
    subject,
    message,
    ideaTitle: idea.title,
    ideaId: idea.id,
  })

  return { ok: true }
}

export async function autoApproveStaleIdeas() {
  const cutoff = new Date(Date.now() - IDEA_AUTO_APPROVE_MS)
  const stale = await prisma.idea.findMany({
    where: {
      approved: false,
      createdAt: { lte: cutoff },
      status: { in: ["submitted", "under_review"] },
    },
    select: { id: true },
  })
  if (stale.length === 0) return 0

  await prisma.idea.updateMany({
    where: { id: { in: stale.map((idea) => idea.id) } },
    data: {
      approved: true,
      approvedAt: new Date(),
      status: "community_discussion",
    },
  })

  return stale.length
}

// --- beta -------------------------------------------------------------------

interface BetaVersionRow {
  id: number
  votingRound: number
  votingClosesAt: Date | null
  decision: string
  status: string
}

/** Pick the winning option for a closed voting round. Ties favor more
 *  deliberation (extend), then the conservative outcome (no), then yes.
 *  Zero votes counts as "no" so nothing ships without member approval. */
function decideBetaWinner(yes: number, no: number, extend: number) {
  const total = yes + no + extend
  if (total === 0) return "no" as const
  const max = Math.max(yes, no, extend)
  if (extend === max) return "extend" as const
  if (no === max) return "no" as const
  return "yes" as const
}

/** Lazily resolve a version whose voting window has elapsed. Handles the
 *  extend-by-a-week rule, including catching up across multiple missed weeks. */
async function finalizeBetaVersion(
  input: BetaVersionRow,
): Promise<BetaVersionRow> {
  let version = input
  let guard = 0
  const now = new Date()
  while (
    version.decision === "open" &&
    version.votingClosesAt != null &&
    version.votingClosesAt <= now &&
    guard < 12
  ) {
    guard++
    const votes = await prisma.betaVote.findMany({
      where: { betaVersionId: version.id, round: version.votingRound },
      select: { vote: true },
    })
    const yes = votes.filter((v) => v.vote === "yes").length
    const no = votes.filter((v) => v.vote === "no").length
    const extend = votes.filter((v) => v.vote === "extend").length
    const winner = decideBetaWinner(yes, no, extend)

    if (winner === "extend") {
      const nextRound = version.votingRound + 1
      const nextClose = new Date(
        version.votingClosesAt.getTime() + VOTING_WEEK_MS,
      )
      await prisma.$transaction([
        // Extend voters are cleared and must vote again next round.
        prisma.betaVote.deleteMany({
          where: {
            betaVersionId: version.id,
            round: version.votingRound,
            vote: "extend",
          },
        }),
        // Yes/no voters carry their choice forward by default.
        prisma.betaVote.updateMany({
          where: {
            betaVersionId: version.id,
            round: version.votingRound,
            vote: { in: ["yes", "no"] },
          },
          data: { round: nextRound },
        }),
        prisma.betaVersion.update({
          where: { id: version.id },
          data: { votingRound: nextRound, votingClosesAt: nextClose },
        }),
      ])
      version = {
        ...version,
        votingRound: nextRound,
        votingClosesAt: nextClose,
      }
    } else {
      const decision = winner === "yes" ? "approved" : "rejected"
      const status = winner === "yes" ? "released" : "archived"
      await prisma.betaVersion.update({
        where: { id: version.id },
        data: { decision, status },
      })
      version = { ...version, decision, status }
    }
  }
  return version
}

export async function listBeta(viewerId: number | null) {
  await ensureSeeded()

  const rows = await prisma.betaVersion.findMany({
    orderBy: { sortOrder: "desc" },
  })

  // Resolve any versions whose week has elapsed before reporting tallies.
  for (const row of rows) {
    if (
      row.decision === "open" &&
      row.votingClosesAt &&
      row.votingClosesAt <= new Date()
    ) {
      await finalizeBetaVersion(row)
    }
  }

  const versions = await prisma.betaVersion.findMany({
    orderBy: { sortOrder: "desc" },
    include: {
      votes: { select: { vote: true, userId: true, round: true } },
    },
  })

  return versions.map((v) => {
    const roundVotes = v.votes.filter((x) => x.round === v.votingRound)
    const yes = roundVotes.filter((x) => x.vote === "yes").length
    const no = roundVotes.filter((x) => x.vote === "no").length
    const extend = roundVotes.filter((x) => x.vote === "extend").length
    const viewerVote = viewerId
      ? (roundVotes.find((x) => x.userId === viewerId)?.vote ?? null)
      : null
    return {
      id: v.id,
      versionName: v.versionName,
      summary: v.summary,
      releaseNotes: v.releaseNotes,
      status: v.status,
      releaseDate: v.releaseDate,
      knownIssues: v.knownIssues,
      unfinished: v.unfinished,
      feedbackNeeded: v.feedbackNeeded,
      testUrl: v.testUrl,
      accessCode: v.accessCode,
      isCurrent: v.isCurrent,
      votingRound: v.votingRound,
      votingClosesAt: v.votingClosesAt,
      decision: v.decision,
      yesVotes: yes,
      noVotes: no,
      extendVotes: extend,
      totalVotes: yes + no + extend,
      viewerVote,
    }
  })
}

interface BetaVoteInput {
  vote?: string
  comment?: string
}

export async function verifyBetaAccess(userId: number, code: unknown) {
  const trimmed = typeof code === "string" ? code.trim() : ""
  if (!trimmed) return { error: "missing_code", status: 400 }
  const result = await verifyBetaCode(trimmed)
  if (!result.valid) return { error: "invalid_code", status: 400 }
  await prisma.user.update({
    where: { id: userId },
    data: { betaAccessAt: new Date() },
  })
  return { ok: true, verified: true }
}

export async function voteBeta(
  betaVersionId: number,
  userId: number,
  input: BetaVoteInput,
) {
  if (!BETA_VOTES.includes(input.vote as (typeof BETA_VOTES)[number])) {
    return { error: "invalid_vote", status: 400 }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) {
    return { error: "access_required", status: 403 }
  }

  const found = await prisma.betaVersion.findUnique({
    where: { id: betaVersionId },
  })
  if (!found) return { error: "not_found", status: 404 }

  const version = await finalizeBetaVersion(found)
  if (version.decision !== "open") {
    return { error: "voting_closed", status: 409 }
  }

  const comment = clampText(input.comment, 2000) || null

  await prisma.betaVote.upsert({
    where: { betaVersionId_userId: { betaVersionId, userId } },
    update: { vote: input.vote as string, round: version.votingRound, comment },
    create: {
      betaVersionId,
      userId,
      vote: input.vote as string,
      round: version.votingRound,
      comment,
    },
  })
  return { ok: true }
}

// --- mission ----------------------------------------------------------------

export async function listMission(viewerId: number | null) {
  await ensureSeeded()
  const principles = await prisma.missionPrinciple.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { supports: true } },
      supports: viewerId
        ? { where: { userId: viewerId }, select: { id: true } }
        : false,
    },
  })
  return principles.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    supportCount: p._count.supports,
    viewerSupports: Array.isArray(p.supports) && p.supports.length > 0,
  }))
}

export async function toggleMissionSupport(
  principleId: number,
  userId: number,
) {
  const principle = await prisma.missionPrinciple.findUnique({
    where: { id: principleId },
  })
  if (!principle) return { error: "not_found", status: 404 }
  const existing = await prisma.missionSupport.findUnique({
    where: { principleId_userId: { principleId, userId } },
  })
  if (existing) {
    await prisma.missionSupport.delete({ where: { id: existing.id } })
  } else {
    await prisma.missionSupport.create({ data: { principleId, userId } })
  }
  const supportCount = await prisma.missionSupport.count({
    where: { principleId },
  })
  return { ok: true, supporting: !existing, supportCount }
}

// --- economics + roles ------------------------------------------------------

export async function getEconomics() {
  await ensureSeeded()
  const e = await prisma.economicsAssumption.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  })
  if (!e) return null
  return {
    label: e.label,
    hosting: e.hosting,
    ai: e.ai,
    storage: e.storage,
    emailSms: e.emailSms,
    legal: e.legal,
    accounting: e.accounting,
    development: e.development,
    moderation: e.moderation,
    marketing: e.marketing,
    support: e.support,
    events: e.events,
    communityActivities: e.communityActivities,
    total: sumCosts(e),
  }
}

// --- membership dues --------------------------------------------------------

export async function getDuesSummary(viewerId: number | null) {
  await ensureSeeded()

  const [
    economics,
    memberCount,
    waitlistCount,
    interestedCount,
    votes,
    viewerVote,
  ] = await Promise.all([
    prisma.economicsAssumption.findFirst({ where: { active: true } }),
    prisma.user.count(),
    getWaitlistCount(),
    prisma.coOpInterest.count(),
    prisma.duesVote.findMany({ select: { amount: true } }),
    viewerId
      ? prisma.duesVote.findUnique({ where: { userId: viewerId } })
      : null,
  ])

  const annualCosts = economics ? sumCosts(economics) : 0

  const voteCount = votes.length
  const averageAmount =
    voteCount > 0
      ? Math.round(votes.reduce((sum, v) => sum + v.amount, 0) / voteCount)
      : null

  // Count votes per preset bucket so the page can show a simple distribution.
  const distribution = DUES_PRESETS.map((amount) => ({
    amount,
    count: votes.filter((v) => v.amount === amount).length,
  }))

  const effectiveDues = averageAmount ?? DEFAULT_DUES
  const breakEvenMembers =
    effectiveDues > 0 ? Math.ceil(annualCosts / effectiveDues) : null

  return {
    presets: [...DUES_PRESETS],
    memberCount,
    waitlistCount,
    interestedCount,
    annualCosts,
    defaultDues: DEFAULT_DUES,
    voteCount,
    averageAmount,
    distribution,
    breakEvenMembers,
    viewerAmount: viewerVote?.amount ?? null,
  }
}

export async function voteDues(userId: number, amountInput: unknown) {
  const amount = Math.round(Number(amountInput))
  if (!Number.isFinite(amount) || amount < 0 || amount > 500) {
    return { error: "invalid_amount", status: 400 }
  }
  await prisma.duesVote.upsert({
    where: { userId },
    update: { amount },
    create: { userId, amount },
  })
  return { ok: true, amount }
}

export async function listRoles() {
  await ensureSeeded()
  const roles = await prisma.role.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  })
  return roles.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    responsibilities: r.responsibilities.split("\n").filter(Boolean),
    risks: r.risks ? r.risks.split("\n").filter(Boolean) : [],
    estimatedMonthlyHours: r.estimatedMonthlyHours,
    estimatedMinWeeklyHours: r.estimatedMinWeeklyHours,
    estimatedMaxWeeklyHours: r.estimatedMaxWeeklyHours,
    status: r.status,
  }))
}

// --- interest + participation ----------------------------------------------

interface InterestInput {
  interestLevel?: string
  skills?: string
  notes?: string
}

export async function saveInterest(userId: number, input: InterestInput) {
  const level = INTEREST_LEVELS.includes(
    input.interestLevel as (typeof INTEREST_LEVELS)[number],
  )
    ? (input.interestLevel as string)
    : "curious"
  const skills = clampText(input.skills, 1000) || null
  const notes = clampText(input.notes, 2000) || null

  await prisma.coOpInterest.upsert({
    where: { userId },
    update: { interestLevel: level, skills, notes },
    create: { userId, interestLevel: level, skills, notes },
  })
  return { ok: true }
}

export async function getParticipation(userId: number) {
  const [interest, ideas, supports, comments, betaVotes, missionSupports] =
    await Promise.all([
      prisma.coOpInterest.findUnique({ where: { userId } }),
      prisma.idea.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      prisma.ideaSupport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { idea: { select: { id: true, title: true } } },
      }),
      prisma.ideaComment.count({ where: { userId } }),
      prisma.betaVote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { betaVersion: { select: { versionName: true } } },
      }),
      prisma.missionSupport.count({ where: { userId } }),
    ])

  return {
    interest: interest
      ? {
          interestLevel: interest.interestLevel,
          skills: interest.skills,
          notes: interest.notes,
        }
      : null,
    ideasSubmitted: ideas,
    ideasSupported: supports.map((s) => ({
      ideaId: s.idea.id,
      title: s.idea.title,
      createdAt: s.createdAt,
    })),
    commentCount: comments,
    betaVotes: betaVotes.map((v) => ({
      versionName: v.betaVersion.versionName,
      vote: v.vote,
      createdAt: v.createdAt,
    })),
    missionPrinciplesSupported: missionSupports,
  }
}
