import { useEffect, useState } from "react"
import { Link, Navigate, useSearchParams } from "react-router-dom"

import { useCoopAuth } from "../../components/coop-ui/CoopAuth"
import {
  COST_GUESS_LABELS,
  FUNDING_MODEL_LABELS,
  STATUS_META,
} from "../../components/coop-ui/labels"
import { Badge, Card, CoopButton, SectionTitle } from "../../components/coop-ui/ui"
import {
  useAdminIdea,
  useAdminIdeas,
  useAdminUpdateIdea,
  useApproveIdea,
  useDenyIdea,
  useSendIdeaUpdate,
  type IdeaDetail,
  type IdeaListItem,
} from "../../lib/api/coop"
import { cn } from "../../lib/cn"

const QUAL_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const BUILD_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "very_large", label: "Very large" },
]

function AdminSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-(--coop-ink-soft)">{label}</span>
      <select
        className="coop-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function IdeaReviewPanel({ idea }: { idea: IdeaDetail }) {
  const update = useAdminUpdateIdea(idea.id)
  const approve = useApproveIdea()
  const deny = useDenyIdea()
  const sendUpdate = useSendIdeaUpdate(idea.id)
  const ce = idea.costEstimate

  const [status, setStatus] = useState(idea.status)
  const [decisionNote, setDecisionNote] = useState(idea.decisionNote ?? "")
  const [denyNote, setDenyNote] = useState("")
  const [updateSubject, setUpdateSubject] = useState("")
  const [updateMessage, setUpdateMessage] = useState("")
  const [buildTime, setBuildTime] = useState(ce?.buildTime ?? "")
  const [maintenance, setMaintenance] = useState(ce?.maintenanceLevel ?? "")
  const [complexity, setComplexity] = useState(ce?.complexityLevel ?? "")
  const [userImpact, setUserImpact] = useState(ce?.userImpact ?? "")
  const [privacyImpact, setPrivacyImpact] = useState(ce?.privacyImpact ?? "")
  const [mission, setMission] = useState(ce?.missionAlignment ?? "")
  const [monthly, setMonthly] = useState(
    ce?.estimatedMonthlyCost != null ? String(ce.estimatedMonthlyCost) : "",
  )
  const [saved, setSaved] = useState(false)
  const [updateSent, setUpdateSent] = useState(false)
  const [actionError, setActionError] = useState("")

  const buildPayload = () => ({
    status,
    decisionNote,
    costEstimate: {
      buildTime: buildTime || undefined,
      maintenanceLevel: maintenance || undefined,
      complexityLevel: complexity || undefined,
      userImpact: userImpact || undefined,
      privacyImpact: privacyImpact || undefined,
      missionAlignment: mission || undefined,
      estimatedMonthlyCost: monthly === "" ? null : Number(monthly),
    },
  })

  const save = () => {
    setActionError("")
    update.mutate(buildPayload(), {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
      onError: () => setActionError("Could not save adjustments."),
    })
  }

  const handleApprove = () => {
    setActionError("")
    approve.mutate(idea.id, {
      onError: () => setActionError("Could not approve this idea."),
    })
  }

  const handleDeny = () => {
    setActionError("")
    deny.mutate(
      { ideaId: idea.id, note: denyNote || decisionNote },
      {
        onSuccess: () => setDenyNote(""),
        onError: () => setActionError("Could not deny this idea."),
      },
    )
  }

  const handleSendUpdate = () => {
    setActionError("")
    sendUpdate.mutate(
      {
        subject: updateSubject.trim() || undefined,
        message: updateMessage.trim(),
      },
      {
        onSuccess: () => {
          setUpdateSent(true)
          setUpdateMessage("")
          setTimeout(() => setUpdateSent(false), 2500)
        },
        onError: () =>
          setActionError(
            idea.notifyEmail
              ? "Could not send the update email."
              : "This idea has no contact email on file.",
          ),
      },
    )
  }

  const busy =
    update.isPending ||
    approve.isPending ||
    deny.isPending ||
    sendUpdate.isPending

  return (
    <Card className="mt-4 border-(--coop-accent) bg-[#eef0f5]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Review actions</h2>
        <Badge tone={idea.approved ? "yes" : "limited"}>
          {idea.approved ? "Approved" : "Pending"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminSelect
          label="Status"
          value={status}
          options={Object.entries(STATUS_META).map(([value, m]) => ({
            value,
            label: m.label,
          }))}
          onChange={setStatus}
        />
      </div>

      <h3 className="mt-5 text-sm font-bold text-(--coop-ink-soft)">
        Cost estimate
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminSelect
          label="Build time"
          value={buildTime}
          options={BUILD_OPTIONS}
          onChange={setBuildTime}
        />
        <AdminSelect
          label="Maintenance"
          value={maintenance}
          options={QUAL_OPTIONS}
          onChange={setMaintenance}
        />
        <AdminSelect
          label="Complexity"
          value={complexity}
          options={QUAL_OPTIONS}
          onChange={setComplexity}
        />
        <AdminSelect
          label="User impact"
          value={userImpact}
          options={QUAL_OPTIONS}
          onChange={setUserImpact}
        />
        <AdminSelect
          label="Privacy impact"
          value={privacyImpact}
          options={QUAL_OPTIONS}
          onChange={setPrivacyImpact}
        />
        <AdminSelect
          label="Mission alignment"
          value={mission}
          options={QUAL_OPTIONS}
          onChange={setMission}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-(--coop-ink-soft)">
            Est. monthly cost (USD)
          </span>
          <input
            className="coop-input"
            type="number"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="e.g. 150"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-semibold text-(--coop-ink-soft)">
          Decision note (shown if deferred or declined)
        </span>
        <textarea
          className="coop-textarea"
          rows={2}
          value={decisionNote}
          onChange={(e) => setDecisionNote(e.target.value)}
        />
      </label>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="font-semibold text-(--coop-ink-soft)">
          Deny note (optional override for deny email)
        </span>
        <textarea
          className="coop-textarea"
          rows={2}
          value={denyNote}
          onChange={(e) => setDenyNote(e.target.value)}
          placeholder="Leave blank to use the decision note above"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <CoopButton variant="default" size="sm" onClick={save} disabled={busy}>
          Save adjustments
        </CoopButton>
        {!idea.approved && (
          <CoopButton
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={busy}
          >
            Approve and publish
          </CoopButton>
        )}
        <CoopButton
          variant="ghost"
          size="sm"
          onClick={handleDeny}
          disabled={busy}
        >
          Deny
        </CoopButton>
        {saved && (
          <span className="text-sm font-medium text-(--coop-accent)">
            Saved.
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-(--coop-line) pt-5">
        <h3 className="text-sm font-bold text-(--coop-ink-soft)">
          Send update to submitter
        </h3>
        <p className="coop-hint mt-1">
          {idea.notifyEmail
            ? `Will email ${idea.notifyEmail}`
            : "No contact email on file for this idea."}
        </p>
        <input
          className="coop-input mt-3"
          value={updateSubject}
          onChange={(e) => setUpdateSubject(e.target.value)}
          placeholder="Optional subject"
        />
        <textarea
          className="coop-textarea mt-2"
          rows={3}
          value={updateMessage}
          onChange={(e) => setUpdateMessage(e.target.value)}
          placeholder="Your message to the submitter"
        />
        <div className="mt-2 flex items-center gap-2">
          <CoopButton
            variant="default"
            size="sm"
            onClick={handleSendUpdate}
            disabled={busy || !idea.notifyEmail || !updateMessage.trim()}
          >
            Send update
          </CoopButton>
          {updateSent && (
            <span className="text-sm font-medium text-(--coop-accent)">
              Sent.
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-3 text-sm font-medium text-[#aa3a3a]">{actionError}</p>
      )}
    </Card>
  )
}

function IdeaListButton({
  idea,
  active,
  onClick,
}: {
  idea: IdeaListItem
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("coop-choice text-left", {
        "coop-choice-active": active,
      })}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold">{idea.title}</span>
        <Badge tone={idea.approved ? "yes" : "limited"}>
          {idea.approved ? "Approved" : "Pending"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-(--coop-ink-faint)">{idea.summary}</p>
    </button>
  )
}

export default function AdminPage() {
  const { isSignedIn, isAdmin, loading: authLoading } = useCoopAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [queue, setQueue] = useState<"pending" | "all">("pending")

  const selectedId = Number(searchParams.get("idea") || 0)

  const { data: ideas, isLoading: ideasLoading } = useAdminIdeas(
    queue,
    isSignedIn && isAdmin,
  )
  const { data: selected, isLoading: detailLoading } = useAdminIdea(
    selectedId,
    isSignedIn && isAdmin && selectedId > 0,
  )

  useEffect(() => {
    if (!ideas?.length) return
    if (!selectedId || !ideas.some((idea) => idea.id === selectedId)) {
      setSearchParams({ idea: String(ideas[0].id) }, { replace: true })
    }
  }, [ideas, selectedId, setSearchParams])

  if (authLoading) {
    return <p className="text-(--coop-ink-faint)">Loading…</p>
  }

  if (!isSignedIn || !isAdmin) {
    return <Navigate to="/co-op/ideas" replace />
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Admin"
        title="Idea review"
        subtitle="Approve, deny, adjust, or send updates on submitted ideas. Unreviewed ideas are approved automatically after 48 hours."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <CoopButton
          variant={queue === "pending" ? "primary" : "default"}
          size="sm"
          onClick={() => setQueue("pending")}
        >
          Pending review
        </CoopButton>
        <CoopButton
          variant={queue === "all" ? "primary" : "default"}
          size="sm"
          onClick={() => setQueue("all")}
        >
          All ideas
        </CoopButton>
        <Link to="/co-op/ideas" className="coop-link ml-auto text-sm">
          Back to ideas
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-2">
          {ideasLoading ? (
            <p className="text-(--coop-ink-faint)">Loading queue…</p>
          ) : ideas && ideas.length > 0 ? (
            ideas.map((idea) => (
              <IdeaListButton
                key={idea.id}
                idea={idea}
                active={idea.id === selectedId}
                onClick={() => setSearchParams({ idea: String(idea.id) })}
              />
            ))
          ) : (
            <Card>
              <p className="text-(--coop-ink-soft)">
                {queue === "pending"
                  ? "Nothing waiting for review."
                  : "No ideas yet."}
              </p>
            </Card>
          )}
        </div>

        <div>
          {detailLoading ? (
            <p className="text-(--coop-ink-faint)">Loading idea…</p>
          ) : selected ? (
            <>
              <Card>
                <h2 className="text-2xl font-bold">{selected.title}</h2>
                <p className="mt-2 text-(--coop-ink-soft)">
                  {selected.summary}
                </p>
                <p className="mt-2 text-sm text-(--coop-ink-faint)">
                  By {selected.author}
                  {selected.notifyEmail
                    ? ` · Contact: ${selected.notifyEmail}`
                    : " · No contact email"}
                </p>
                <div className="mt-4 flex flex-col gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-(--coop-ink-soft)">
                      Problem
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {selected.problem}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-(--coop-ink-soft)">
                      Evidence
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {selected.evidence}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-(--coop-ink-soft)">
                      Risks
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {selected.drawbacks}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.costGuess && (
                      <Badge tone="limited">
                        {COST_GUESS_LABELS[selected.costGuess] ??
                          selected.costGuess}{" "}
                        build
                      </Badge>
                    )}
                    {selected.fundingModel && (
                      <Badge>
                        {FUNDING_MODEL_LABELS[selected.fundingModel] ??
                          selected.fundingModel}
                      </Badge>
                    )}
                  </div>
                  {selected.fundingModel === "other" &&
                    selected.fundingModelNote && (
                      <p className="text-(--coop-ink-soft)">
                        Funding note: {selected.fundingModelNote}
                      </p>
                    )}
                </div>
                <Link
                  to={`/co-op/ideas/${selected.id}`}
                  className="coop-link mt-4 inline-block text-sm"
                >
                  View public page
                </Link>
              </Card>
              <IdeaReviewPanel key={selected.id} idea={selected} />
            </>
          ) : (
            <Card>
              <p className="text-(--coop-ink-soft)">
                Select an idea from the queue to review it.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
