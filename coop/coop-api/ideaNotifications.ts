/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EMAIL_RE } from "../../lib/constants"
import { getAppBaseUrl, sendEmail } from "../../lib/email"

const REVIEW_NOTIFY_EMAIL =
  process.env.COOP_IDEA_REVIEW_EMAIL?.trim() || "hello@bridger.social"

const NOTIFY_STATUSES = new Set(["declined", "needs_more_detail"])

const COST_GUESS_LABELS: Record<string, string> = {
  small: "Small (less than 1 week)",
  medium: "Medium (1 to 4 weeks)",
  large: "Large (1 to 3 months)",
  major: "Major (3+ months)",
}

const FUNDING_MODEL_LABELS: Record<string, string> = {
  free: "Free",
  subscription: "Part of a subscription",
  pay_as_you_go: "Pay as you go",
  other: "Other",
}

interface IdeaNotificationFields {
  id: number
  title: string
  summary: string
  problem: string
  evidence: string | null
  evidenceTypes: string | null
  drawbacks: string | null
  riskTypes: string | null
  costGuess: string | null
  fundingModel: string | null
  fundingModelNote: string | null
  implementationTime: string | null
  cost: string | null
  costAreas: string | null
  notifyEmail: string | null
  status: string
  decisionNote: string | null
  authorLabel: string
}

function ideaUrl(id: number) {
  return `${getAppBaseUrl()}/co-op/ideas/${id}`
}

function adminReviewUrl(id: number) {
  return `${getAppBaseUrl()}/co-op/admin?idea=${id}`
}

export async function notifyReviewTeamOfNewIdea(idea: IdeaNotificationFields) {
  const lengthLabel = idea.costGuess
    ? (COST_GUESS_LABELS[idea.costGuess] ?? idea.costGuess)
    : "(none)"
  const fundingLabel = idea.fundingModel
    ? (FUNDING_MODEL_LABELS[idea.fundingModel] ?? idea.fundingModel)
    : "(none)"

  const lines = [
    `A new co-op idea was submitted and needs review within 48 hours.`,
    ``,
    `Title: ${idea.title}`,
    `Author: ${idea.authorLabel}`,
    `Summary: ${idea.summary}`,
    `Problem: ${idea.problem}`,
    `Evidence: ${idea.evidence ?? "(none)"}`,
    `Evidence types: ${idea.evidenceTypes ?? "(none)"}`,
    `Risks: ${idea.drawbacks ?? "(none)"}`,
    `Risk types: ${idea.riskTypes ?? "(none)"}`,
    `Length to implement: ${lengthLabel}`,
    `How it should be paid for: ${fundingLabel}`,
    idea.fundingModel === "other" && idea.fundingModelNote
      ? `Funding note: ${idea.fundingModelNote}`
      : "",
    idea.notifyEmail ? `Contact email: ${idea.notifyEmail}` : "",
    ``,
    `Review: ${ideaUrl(idea.id)}`,
    `Admin portal: ${adminReviewUrl(idea.id)}`,
    ``,
    `If not reviewed within 48 hours, it will be approved automatically.`,
  ].filter(Boolean)

  await sendEmail({
    to: REVIEW_NOTIFY_EMAIL,
    subject: `[Bridger] New idea for review: ${idea.title}`,
    text: lines.join("\n"),
  })
}

export async function notifySubmitterOfReviewDecision(
  idea: IdeaNotificationFields,
  previousStatus: string,
) {
  if (!idea.notifyEmail || !EMAIL_RE.test(idea.notifyEmail)) return
  if (!NOTIFY_STATUSES.has(idea.status)) return
  if (idea.status === previousStatus) return

  const statusLabel =
    idea.status === "declined" ? "not moving forward" : "needs more detail"

  const lines = [
    `Your Bridger co-op idea "${idea.title}" was reviewed.`,
    ``,
    `Status: ${statusLabel}`,
    idea.decisionNote ? `Note: ${idea.decisionNote}` : "",
    ``,
    `View your idea: ${ideaUrl(idea.id)}`,
  ].filter(Boolean)

  await sendEmail({
    to: idea.notifyEmail,
    subject: `[Bridger] Update on your idea: ${idea.title}`,
    text: lines.join("\n"),
  })
}

export async function sendCustomIdeaUpdate({
  to,
  subject,
  message,
  ideaTitle,
  ideaId,
}: {
  to: string
  subject: string
  message: string
  ideaTitle: string
  ideaId: number
}) {
  const lines = [
    `Update on your Bridger co-op idea "${ideaTitle}":`,
    ``,
    message,
    ``,
    `View your idea: ${ideaUrl(ideaId)}`,
  ]

  await sendEmail({
    to,
    subject,
    text: lines.join("\n"),
  })
}
