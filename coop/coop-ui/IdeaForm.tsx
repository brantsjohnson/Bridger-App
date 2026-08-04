import { useState, type FormEvent } from "react"

import {
  useCreateIdea,
  useDues,
  useParticipation,
  type CreateIdeaPayload,
} from "../../lib/api/coop"
import { cn } from "../../lib/cn"
import { DEFAULT_ANNUAL_DUES } from "../../lib/coop-math/costModel"
import { fireCoopConfetti } from "../../lib/coopConfetti"
import {
  COST_GUESS_OPTIONS,
  formatUsd,
  FUNDING_MODEL_OPTIONS,
  ideaScalePreview,
  type ChoiceOption,
} from "./labels"
import { CoopButton, InfoTip } from "./ui"

function Section({
  index,
  title,
  hint,
  info,
  children,
}: {
  index: number
  title: string
  hint?: string
  info?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-(--coop-line) pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="coop-card-index">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-base font-bold text-(--coop-ink)">{title}</h3>
        {info && <InfoTip label={`More on ${title}`}>{info}</InfoTip>}
      </div>
      {hint && <p className="coop-hint mt-1">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ChoiceGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: ChoiceOption[]
  value: string
  onChange: (next: string) => void
  columns?: 1 | 2
}) {
  return (
    <div
      className={cn("grid gap-2", {
        "grid-cols-1 sm:grid-cols-2": columns === 2,
        "grid-cols-1": columns === 1,
      })}
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            className={cn("coop-choice", { "coop-choice-active": active })}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            <span className="font-semibold">{option.label}</span>
            {option.hint && (
              <span className="mt-0.5 block text-xs text-(--coop-ink-faint)">
                {option.hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function CostPreview({ costGuess }: { costGuess: string }) {
  const { data: dues } = useDues()
  const waitlistCount = dues?.waitlistCount ?? 0
  const members = waitlistCount > 0 ? waitlistCount : 1
  const annualDues = dues?.defaultDues ?? DEFAULT_ANNUAL_DUES
  const current = ideaScalePreview(costGuess, members, annualDues)
  const atScale = ideaScalePreview(costGuess, 100_000, annualDues)

  if (!current) return null

  return (
    <div className="mt-3 rounded-sm border border-(--coop-line) bg-(--coop-surface) p-3 text-sm text-(--coop-ink-soft)">
      <p>
        About {formatUsd(current.scale.buildCost)} to build,{" "}
        {formatUsd(current.scale.monthlyUpkeep)}/mo to maintain.
      </p>
      {current.pool > 0 && (
        <p className="mt-2">
          At current waitlist ({members.toLocaleString()} members ×{" "}
          {formatUsd(annualDues)}/yr): build is {current.buildPct}; upkeep is{" "}
          {current.upkeepPct}.
        </p>
      )}
      {atScale && atScale.pool > 0 && (
        <p className="mt-1">
          At 100,000 members × {formatUsd(annualDues)}/yr: build is{" "}
          {atScale.buildPct}; upkeep is {atScale.upkeepPct}.
        </p>
      )}
      <p className="coop-hint mt-2">
        Planning estimates to help voters see scale, not a quote.
      </p>
    </div>
  )
}

interface FormState {
  title: string
  summary: string
  problem: string
  evidence: string
  drawbacks: string
  costGuess: string
  fundingModel: string
  fundingModelNote: string
  notifyEmail: string
}

const EMPTY: FormState = {
  title: "",
  summary: "",
  problem: "",
  evidence: "",
  drawbacks: "",
  costGuess: "",
  fundingModel: "",
  fundingModelNote: "",
  notifyEmail: "",
}

export function IdeaForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const create = useCreateIdea()
  const { data: participation } = useParticipation(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>(EMPTY)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    if (form.title.trim().length < 3 || form.summary.trim().length < 3) {
      setError("Add a short title and a one-line description.")
      return
    }
    if (form.problem.trim().length < 10) {
      setError("Describe the problem this solves in a sentence or two.")
      return
    }
    if (form.evidence.trim().length < 10) {
      setError("Add at least one source or explanation of the evidence.")
      return
    }
    if (form.drawbacks.trim().length < 10) {
      setError("Describe the risks or tradeoffs. Every idea has some.")
      return
    }
    if (!form.costGuess) {
      setError("Choose how long you think this would take to implement.")
      return
    }
    if (!form.fundingModel) {
      setError("Choose how this feature should be paid for.")
      return
    }
    if (
      form.fundingModel === "other" &&
      form.fundingModelNote.trim().length < 3
    ) {
      setError("Describe how this feature should be paid for.")
      return
    }
    const payload: CreateIdeaPayload = {
      title: form.title,
      summary: form.summary,
      problem: form.problem,
      evidence: form.evidence,
      drawbacks: form.drawbacks,
      costGuess: form.costGuess,
      fundingModel: form.fundingModel,
      fundingModelNote:
        form.fundingModel === "other"
          ? form.fundingModelNote.trim()
          : undefined,
      notifyEmail: form.notifyEmail.trim() || undefined,
    }
    try {
      const isFirstIdea = (participation?.ideasSubmitted.length ?? 0) === 0
      const res = await create.mutateAsync(payload)
      if (isFirstIdea) void fireCoopConfetti()
      onCreated(res.id)
    } catch {
      setError("Could not submit your idea. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-(--coop-ink-soft)">
        A good idea is more than a wish. Walk through each step so the community
        and the team can weigh it fairly. An admin reviews every submission for
        accuracy before it opens for support and comments. If it is not reviewed
        within 48 hours, it is approved automatically. Impact on users is
        measured by how many people support the idea once it is published.
      </p>

      <Section
        index={1}
        title="Idea"
        hint="A short title and a one-line description of what you are proposing."
      >
        <input
          className="coop-input"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="A short, clear name for the idea"
          maxLength={140}
          required
        />
        <textarea
          className="coop-textarea mt-2"
          rows={2}
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="In one or two sentences, what is the idea?"
          maxLength={600}
          required
        />
      </Section>

      <Section
        index={2}
        title="Problem"
        hint="What problem does this solve?"
        info="If you cannot explain the problem clearly, the idea probably is not ready yet. Start here."
      >
        <textarea
          className="coop-textarea"
          rows={3}
          value={form.problem}
          onChange={(e) => set("problem", e.target.value)}
          placeholder="Who is affected, and what is hard for them today?"
          required
        />
      </Section>

      <Section
        index={3}
        title="Evidence and research"
        hint="What evidence suggests this would help? At least one source or explanation is required."
        info={
          <span>
            Examples: user feedback, competitor examples, academic research,
            industry reports, personal experience, survey results.
          </span>
        }
      >
        <textarea
          className="coop-textarea"
          rows={3}
          value={form.evidence}
          onChange={(e) => set("evidence", e.target.value)}
          placeholder="Point to a source, a quote, a study, or your own experience."
          required
        />
      </Section>

      <Section
        index={4}
        title="Risks and tradeoffs"
        hint="What could go wrong?"
        info="This step exists to encourage critical thinking, not just advocacy. Naming the downsides makes a stronger case."
      >
        <textarea
          className="coop-textarea"
          rows={3}
          value={form.drawbacks}
          onChange={(e) => set("drawbacks", e.target.value)}
          placeholder="What are the real downsides, costs, or unintended effects?"
          required
        />
      </Section>

      <Section
        index={5}
        title="Length to implement"
        hint="How long do you think this would take to build?"
        info="Pick the closest size. A live preview below shows what that scale could cost at today's waitlist and at 100,000 members."
      >
        <ChoiceGroup
          options={COST_GUESS_OPTIONS}
          value={form.costGuess}
          onChange={(value) => set("costGuess", value)}
        />
        {form.costGuess && <CostPreview costGuess={form.costGuess} />}
      </Section>

      <Section
        index={6}
        title="How should this feature be paid for?"
        hint="This helps voters understand whether an idea adds ongoing cost per use."
        info="Free features still have infrastructure cost. Subscription and pay-as-you-go ideas often scale with usage."
      >
        <ChoiceGroup
          options={FUNDING_MODEL_OPTIONS}
          value={form.fundingModel}
          onChange={(value) => set("fundingModel", value)}
        />
        {form.fundingModel === "other" && (
          <input
            className="coop-input mt-3"
            value={form.fundingModelNote}
            onChange={(e) => set("fundingModelNote", e.target.value)}
            placeholder="Describe how users would pay for this"
            required
          />
        )}
      </Section>

      <Section
        index={7}
        title="Review updates (optional)"
        hint="If this idea is denied, needs correction, or we have questions about accuracy, we can email you."
      >
        <input
          className="coop-input"
          type="email"
          value={form.notifyEmail}
          onChange={(e) => set("notifyEmail", e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
        />
      </Section>

      {error && (
        <div className="text-sm font-medium text-[#aa3a3a]">{error}</div>
      )}

      <div className="flex justify-end gap-2 border-t border-(--coop-line) pt-4">
        <CoopButton type="button" variant="ghost" onClick={onClose}>
          Cancel
        </CoopButton>
        <CoopButton type="submit" variant="primary" disabled={create.isPending}>
          {create.isPending ? "Submitting…" : "Submit for review"}
        </CoopButton>
      </div>
    </form>
  )
}
