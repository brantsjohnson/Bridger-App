import { useState, type FormEvent } from "react"
import { Link, useParams } from "react-router-dom"

import { useCoopAuth } from "../../components/coop-ui/CoopAuth"
import {
  CATEGORY_LABELS,
  COST_GUESS_LABELS,
  COST_GUESS_TO_SCALE,
  EVIDENCE_TYPE_LABELS,
  formatUsd,
  FUNDING_MODEL_LABELS,
  labelsFor,
  levelLabel,
  RISK_TYPE_LABELS,
  scaleCost,
  statusMeta,
} from "../../components/coop-ui/labels"
import { Badge, Card, CoopButton } from "../../components/coop-ui/ui"
import {
  useAddComment,
  useDues,
  useIdea,
  useToggleSupport,
} from "../../lib/api/coop"
import { DEFAULT_ANNUAL_DUES } from "../../lib/coop-math/costModel"

function DetailBlock({
  label,
  value,
  tags,
}: {
  label: string
  value?: string | null
  tags?: string[]
}) {
  if (!value && (!tags || tags.length === 0)) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-(--coop-ink-soft)">{label}</h3>
      {tags && tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}
      {value && (
        <p className="mt-2 whitespace-pre-wrap text-(--coop-ink)">{value}</p>
      )}
    </div>
  )
}

export default function IdeaDetailPage() {
  const { id } = useParams()
  const ideaId = Number(id)
  const { data: idea, isLoading } = useIdea(ideaId)
  const { data: dues } = useDues()
  const { requireSignIn } = useCoopAuth()
  const toggle = useToggleSupport()
  const addComment = useAddComment(ideaId)
  const [comment, setComment] = useState("")

  if (isLoading) {
    return <p className="text-(--coop-ink-faint)">Loading…</p>
  }
  if (!idea) {
    return (
      <div>
        <p className="text-(--coop-ink-soft)">This idea was not found.</p>
        <Link to="/co-op/ideas" className="coop-link">
          Back to all ideas
        </Link>
      </div>
    )
  }

  const meta = statusMeta(idea.status)
  const showDecision =
    (idea.status === "declined" || idea.status === "deferred") &&
    idea.decisionNote

  const handleComment = (e: FormEvent) => {
    e.preventDefault()
    const body = comment.trim()
    if (!body) return
    requireSignIn(() => {
      addComment.mutate(body, { onSuccess: () => setComment("") })
    })
  }

  return (
    <div>
      <Link
        to="/co-op/ideas"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-(--coop-ink-soft) hover:text-(--coop-ink)"
      >
        Back to all ideas
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <Badge>{CATEGORY_LABELS[idea.category] ?? idea.category}</Badge>
            {idea.costGuess && (
              <Badge tone="limited">
                {COST_GUESS_LABELS[idea.costGuess] ?? idea.costGuess} build
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold">{idea.title}</h1>
          <p className="mt-2 text-lg text-(--coop-ink-soft)">{idea.summary}</p>
          <p className="mt-2 text-sm text-(--coop-ink-faint)">
            Suggested by {idea.author}
          </p>

          {!idea.approved && (
            <Card className="mt-4 border-[#ece0c4] bg-(--coop-warn-soft)">
              <h3 className="text-sm font-bold text-(--coop-warn)">
                Pending review
              </h3>
              <p className="mt-1 text-sm text-(--coop-ink)">
                An admin is reviewing this idea for accuracy. Once it is
                approved, it will open for support and comments. If it is not
                reviewed within 48 hours, it is approved automatically.
              </p>
            </Card>
          )}

          <Card className="mt-4 bg-[#eef0f5]">
            <p className="text-sm text-(--coop-ink-soft)">{meta.explanation}</p>
          </Card>

          {showDecision && (
            <Card className="mt-4 border-[#ece0c4] bg-(--coop-warn-soft)">
              <h3 className="text-sm font-bold text-(--coop-warn)">
                Decision note
              </h3>
              <p className="mt-1 text-sm text-(--coop-ink)">
                {idea.decisionNote}
              </p>
            </Card>
          )}

          <div className="mt-6 flex flex-col gap-5">
            <DetailBlock label="The problem it solves" value={idea.problem} />
            <DetailBlock
              label="Evidence and research"
              value={idea.evidence}
              tags={labelsFor(idea.evidenceTypes, EVIDENCE_TYPE_LABELS)}
            />
            <DetailBlock
              label="Risks and tradeoffs"
              value={idea.drawbacks}
              tags={labelsFor(idea.riskTypes, RISK_TYPE_LABELS)}
            />
            <DetailBlock
              label="Length to implement"
              value={
                idea.costGuess
                  ? (COST_GUESS_LABELS[idea.costGuess] ?? idea.costGuess)
                  : idea.implementationTime
              }
            />
            <DetailBlock
              label="How it should be paid for"
              value={
                idea.fundingModel
                  ? idea.fundingModel === "other"
                    ? (idea.fundingModelNote ??
                      FUNDING_MODEL_LABELS[idea.fundingModel])
                    : FUNDING_MODEL_LABELS[idea.fundingModel]
                  : null
              }
            />
            {idea.implementationTime && !idea.costGuess && (
              <DetailBlock
                label="Implementation time (legacy)"
                value={idea.implementationTime}
              />
            )}
            {idea.cost && (
              <DetailBlock label="Cost (legacy)" value={idea.cost} />
            )}
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">
              Comments ({idea.comments.length})
            </h2>
            {idea.approved ? (
              <form
                onSubmit={handleComment}
                className="mt-3 flex flex-col gap-2"
              >
                <textarea
                  className="coop-textarea"
                  rows={2}
                  placeholder="Add a constructive comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <CoopButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={addComment.isPending}
                  >
                    {addComment.isPending ? "Posting…" : "Post comment"}
                  </CoopButton>
                </div>
              </form>
            ) : (
              <p className="mt-2 text-sm text-(--coop-ink-faint)">
                Comments open once this idea is approved.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {idea.comments.map((c) => (
                <Card key={c.id}>
                  <div className="text-sm font-semibold text-(--coop-ink-soft)">
                    {c.author}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                </Card>
              ))}
              {idea.comments.length === 0 && idea.approved && (
                <p className="text-sm text-(--coop-ink-faint)">
                  No comments yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <Card>
            <div className="text-center">
              <div className="coop-stat-value text-3xl">
                {idea.supportCount}
              </div>
              <div className="coop-stat-label">people support this</div>
            </div>
            {idea.approved ? (
              <CoopButton
                variant={idea.viewerSupports ? "default" : "primary"}
                className="mt-4 w-full"
                onClick={() => requireSignIn(() => toggle.mutate(idea.id))}
              >
                {idea.viewerSupports ? "Supporting" : "Support this idea"}
              </CoopButton>
            ) : (
              <p className="coop-hint mt-4 text-center">
                Support opens after approval.
              </p>
            )}
            <p className="coop-hint mt-3">
              Supporting an idea helps the team understand what the community
              cares about. It does not automatically mean the idea will be
              built.
            </p>
          </Card>

          {idea.costEstimate && (
            <Card className="mt-4">
              <h3 className="font-bold">Admin cost estimate</h3>
              <dl className="mt-3 flex flex-col gap-2 text-sm">
                <Row
                  label="Build time"
                  value={levelLabel(idea.costEstimate.buildTime)}
                />
                <Row
                  label="Maintenance"
                  value={levelLabel(idea.costEstimate.maintenanceLevel)}
                />
                <Row
                  label="Complexity"
                  value={levelLabel(idea.costEstimate.complexityLevel)}
                />
                <Row
                  label="User impact"
                  value={levelLabel(idea.costEstimate.userImpact)}
                />
                <Row
                  label="Privacy impact"
                  value={levelLabel(idea.costEstimate.privacyImpact)}
                />
                <Row
                  label="Mission alignment"
                  value={levelLabel(idea.costEstimate.missionAlignment)}
                />
              </dl>
            </Card>
          )}

          {(() => {
            const buildScale =
              idea.costEstimate?.buildTime ??
              (idea.costGuess ? COST_GUESS_TO_SCALE[idea.costGuess] : null)
            const scale = scaleCost(buildScale)
            if (!scale) return null
            const annualDues = dues?.defaultDues ?? DEFAULT_ANNUAL_DUES
            const fundsBuild =
              annualDues && annualDues > 0
                ? {
                    members: Math.ceil(scale.buildCost / annualDues),
                    dues: annualDues,
                  }
                : null
            const estimated = !idea.costEstimate
            return (
              <Card className="mt-4 bg-(--coop-accent-soft)">
                <h3 className="font-bold">What this scale could cost</h3>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  <Row
                    label="To build (one time)"
                    value={`~${formatUsd(scale.buildCost)}`}
                  />
                  <Row
                    label="To maintain"
                    value={`~${formatUsd(scale.monthlyUpkeep)}/mo`}
                  />
                  {fundsBuild && (
                    <Row
                      label="Members to fund the build"
                      value={`~${fundsBuild.members.toLocaleString()} at ${formatUsd(fundsBuild.dues)}/yr`}
                    />
                  )}
                </dl>
                <p className="coop-hint mt-3">
                  {estimated
                    ? "Based on the submitter's rough guess, not yet reviewed."
                    : "Planning estimate based on the idea's scale, not a quote."}
                </p>
              </Card>
            )
          })()}
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-(--coop-ink-soft)">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
