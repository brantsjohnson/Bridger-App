import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { useCoopAuth } from "../../components/coop-ui/CoopAuth"
import { CoopSlider } from "../../components/coop-ui/CoopSlider"
import { IdeaForm } from "../../components/coop-ui/IdeaForm"
import {
  CATEGORY_LABELS,
  COST_GUESS_LABELS,
  COST_GUESS_TO_SCALE,
  formatUsd,
  FUNDING_MODEL_LABELS,
  ideaAnnualCost,
  SCALE_REFERENCE_USERS,
  scaleCost,
  statusMeta,
} from "../../components/coop-ui/labels"
import {
  Badge,
  Card,
  CoopButton,
  CoopModal,
  InfoTip,
  SectionTitle,
} from "../../components/coop-ui/ui"
import {
  useWaitlistBaseline,
  WaitlistSliderHint,
} from "../../components/coop-ui/useWaitlistBaseline"
import {
  useIdeas,
  useToggleSupport,
  type IdeaListItem,
} from "../../lib/api/coop"
import { cn } from "../../lib/cn"

function IdeasScalePanel({
  memberVal,
  waitlist,
}: {
  memberVal: number
  waitlist: ReturnType<typeof useWaitlistBaseline>
}) {
  const maxMembers = Math.max(10000, waitlist.min * 20)

  return (
    <div className="mb-6 rounded-sm border border-(--coop-line) bg-(--coop-surface) p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-(--coop-ink-soft)">
          Drag the slider to model how many people use Bridger. Each idea card
          below updates to show roughly what that feature would cost to run per
          year at that size.
        </p>
        <InfoTip label="How idea costs are calculated">
          Every idea has a build scale (Small to Very Large) from its estimate.
          The one-time build cost is fixed by that scale. The yearly running
          cost scales with usage: at {SCALE_REFERENCE_USERS.toLocaleString()}{" "}
          people it is the feature&apos;s base monthly upkeep × 12, and it grows
          in proportion to how many people use the app. These are planning
          estimates, not quotes.
        </InfoTip>
      </div>

      <div className="mt-4">
        <CoopSlider
          label="People using Bridger"
          value={memberVal}
          onChange={waitlist.setValue}
          min={waitlist.min}
          max={maxMembers}
          step={1}
          sliderStep={Math.max(1, Math.round(waitlist.min / 10) || 10)}
          hint={
            <WaitlistSliderHint
              waitlistCount={waitlist.waitlistCount}
              connected={waitlist.connected}
              divergedFromWaitlist={waitlist.divergedFromWaitlist}
              onReset={waitlist.resetToWaitlist}
            />
          }
        />
      </div>
    </div>
  )
}

function SupportButton({ idea }: { idea: IdeaListItem }) {
  const { requireSignIn } = useCoopAuth()
  const toggle = useToggleSupport()
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        requireSignIn(() => toggle.mutate(idea.id))
      }}
      className={cn("coop-btn coop-btn-sm", {
        "coop-btn-primary": idea.viewerSupports,
      })}
      title="Support this idea"
    >
      Support {idea.supportCount}
    </button>
  )
}

function IdeaCard({ idea, members }: { idea: IdeaListItem; members: number }) {
  const meta = statusMeta(idea.status)
  const buildScale =
    idea.buildTime ??
    (idea.costGuess ? COST_GUESS_TO_SCALE[idea.costGuess] : null)
  const scale = scaleCost(buildScale)
  const cost = scale ? ideaAnnualCost(scale, members) : null
  return (
    <Card hover className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/co-op/ideas/${idea.id}`}
          className="text-lg font-bold text-(--coop-ink) hover:underline"
        >
          {idea.title}
        </Link>
        {idea.approved ? (
          <SupportButton idea={idea} />
        ) : (
          <Badge tone="limited">Pending review</Badge>
        )}
      </div>
      <p className="text-sm text-(--coop-ink-soft)">{idea.summary}</p>
      {(idea.implementationTime || idea.costGuess) && (
        <div className="text-xs text-(--coop-ink-faint)">
          {idea.costGuess && (
            <p>
              Build time: {COST_GUESS_LABELS[idea.costGuess] ?? idea.costGuess}
            </p>
          )}
          {idea.implementationTime && !idea.costGuess && (
            <p>Build time: {idea.implementationTime}</p>
          )}
          {idea.cost && <p className="mt-1">Cost: {idea.cost}</p>}
        </div>
      )}
      {idea.fundingModel && (
        <p className="text-xs text-(--coop-ink-faint)">
          Paid for:{" "}
          {FUNDING_MODEL_LABELS[idea.fundingModel] ?? idea.fundingModel}
        </p>
      )}
      {scale && cost && (
        <div className="text-xs text-(--coop-ink-faint)">
          <p>
            Scale: {scale.label}
            {!idea.buildTime && " (submitter estimate)"}
          </p>
          <p className="mt-1">
            At {members.toLocaleString()} people: about{" "}
            <span className="font-semibold text-(--coop-ink)">
              {formatUsd(cost.annualUpkeep)}/yr
            </span>{" "}
            to run, plus ~{formatUsd(cost.buildCost)} one-time to build
          </p>
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <Badge>{CATEGORY_LABELS[idea.category] ?? idea.category}</Badge>
        {idea.costGuess && (
          <Badge tone="limited">
            {COST_GUESS_LABELS[idea.costGuess] ?? idea.costGuess} build
          </Badge>
        )}
        <span className="ml-auto text-xs text-(--coop-ink-faint)">
          {idea.commentCount} {idea.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
    </Card>
  )
}

export default function IdeasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { requireSignIn, isAdmin } = useCoopAuth()
  const waitlist = useWaitlistBaseline()

  const [sort, setSort] = useState("top")
  const [formOpen, setFormOpen] = useState(false)

  const memberVal = waitlist.value

  const { data: ideas, isLoading } = useIdeas({ sort })

  // Auto-open the form when arriving via "Submit an idea".
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      requireSignIn(() => setFormOpen(true))
      searchParams.delete("new")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, requireSignIn])

  return (
    <div>
      <SectionTitle
        eyebrow="Ideas"
        title="Suggest features and shape Bridger"
        subtitle="Great ideas should be easy to share and easy to understand. This space helps the community suggest features, explain the problem they solve, and support ideas they believe in. Ideas focus on the problem first, then the solution."
      />

      <IdeasScalePanel memberVal={memberVal} waitlist={waitlist} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CoopButton
          variant="primary"
          onClick={() => requireSignIn(() => setFormOpen(true))}
        >
          Submit an idea
        </CoopButton>

        {isAdmin && (
          <CoopButton
            variant="default"
            onClick={() => navigate("/co-op/admin")}
          >
            Admin review
          </CoopButton>
        )}

        <select
          className="coop-select coop-btn-sm ml-auto w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort ideas"
        >
          <option value="top">Most supported</option>
          <option value="newest">New</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-(--coop-ink-faint)">Loading ideas…</p>
      ) : ideas && ideas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} members={memberVal} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-(--coop-ink-soft)">
            No ideas here yet. Be the first to suggest one.
          </p>
        </Card>
      )}

      <CoopModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Submit an idea"
        wide
      >
        <IdeaForm
          onClose={() => setFormOpen(false)}
          onCreated={(id) => {
            setFormOpen(false)
            navigate(`/co-op/ideas/${id}`)
          }}
        />
      </CoopModal>
    </div>
  )
}
