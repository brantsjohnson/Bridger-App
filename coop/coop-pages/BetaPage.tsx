import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

import { useCoopAuth } from "../../components/coop-ui/CoopAuth"
import { MembershipDues } from "../../components/coop-ui/MembershipDues"
import { MissionPrinciples } from "../../components/coop-ui/MissionPrinciples"
import {
  Badge,
  Card,
  CoopButton,
  InfoTip,
  SectionTitle,
} from "../../components/coop-ui/ui"
import { useBeta, useVoteBeta, type BetaVersion } from "../../lib/api/coop"
import { cn } from "../../lib/cn"

const VOTE_OPTIONS: {
  value: "yes" | "no" | "extend"
  label: string
  hint: string
}[] = [
  {
    value: "yes",
    label: "Yes, approve it",
    hint: "Ship this version to the public.",
  },
  {
    value: "no",
    label: "No, don't like it",
    hint: "Do not release this version.",
  },
  {
    value: "extend",
    label: "Extend deliberation by one week",
    hint: "Keep voting open for another week.",
  },
]

function timeLeft(closesAt: string | null): string {
  if (!closesAt) return ""
  const ms = new Date(closesAt).getTime() - Date.now()
  if (ms <= 0) return "Closing…"
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days}d ${hours}h left`
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  return `${hours}h ${mins}m left`
}

function DecisionBadge({ version }: { version: BetaVersion }) {
  if (version.decision === "approved")
    return <Badge tone="yes">Approved · deploying to public</Badge>
  if (version.decision === "rejected")
    return <Badge tone="no">Not released</Badge>
  if (version.decision === "archived")
    return <Badge tone="neutral">Archived</Badge>
  return (
    <Badge tone="planned">
      Voting open · {timeLeft(version.votingClosesAt)}
    </Badge>
  )
}

function TallyBar({ version }: { version: BetaVersion }) {
  const total = version.totalVotes || 1
  const segments = [
    { label: "Yes", value: version.yesVotes, color: "var(--coop-good)" },
    { label: "No", value: version.noVotes, color: "var(--coop-bad, #c0552b)" },
    { label: "Extend", value: version.extendVotes, color: "var(--coop-warn)" },
  ]
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-(--coop-line)">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--coop-ink-faint)">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}: {s.value}
          </span>
        ))}
        <span className="ml-auto">{version.totalVotes} votes this round</span>
      </div>
    </div>
  )
}

function AccessGate() {
  const { requireSignIn } = useCoopAuth()

  return (
    <div className="mt-8 border-t border-(--coop-line) pt-6">
      <h3 className="font-bold">Sign in to vote</h3>
      <p className="mt-1 text-sm text-(--coop-ink-soft)">
        Voting is open to Bridger members. Sign in with your Bridger account to
        review this version and cast your vote.
      </p>
      <CoopButton
        variant="primary"
        className="mt-4"
        onClick={() => requireSignIn()}
      >
        Sign in to vote
      </CoopButton>
    </div>
  )
}

function VotePanel({ version }: { version: BetaVersion }) {
  const { isSignedIn } = useCoopAuth()
  const vote = useVoteBeta()
  const [choice, setChoice] = useState<"yes" | "no" | "extend" | "">(
    version.viewerVote ?? "",
  )
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  if (version.decision !== "open") {
    return (
      <div className="mt-8 border-t border-(--coop-line) pt-6">
        <h3 className="font-bold">Voting closed</h3>
        <p className="mt-1 text-sm text-(--coop-ink-soft)">
          {version.decision === "approved"
            ? "Members approved this version. It is being deployed to the public."
            : version.decision === "rejected"
              ? "Members did not approve this version, so it will not be released."
              : "This version is archived."}
        </p>
      </div>
    )
  }

  if (!isSignedIn) {
    return <AccessGate />
  }

  const submit = () => {
    setError("")
    if (!choice) {
      setError("Choose how you want to vote first.")
      return
    }
    vote.mutate(
      {
        id: version.id,
        payload: { vote: choice, comment: comment || undefined },
      },
      {
        onSuccess: () => setSaved(true),
        onError: () =>
          setError("Could not record your vote. Please try again."),
      },
    )
  }

  return (
    <div className="mt-8 border-t border-(--coop-line) pt-6">
      <div className="flex items-center gap-2">
        <h3 className="font-bold">Cast your vote</h3>
        <InfoTip label="How beta voting works">
          <p>
            Voting is open for one week after release. If yes wins, the version
            ships to the public. If no wins, it is not released. If extend wins,
            voting stays open another week: yes and no votes carry over by
            default and can be changed, while extend voters are cleared and vote
            again.
          </p>
        </InfoTip>
        <span className="ml-auto text-xs text-(--coop-ink-faint)">
          Round {version.votingRound} · {timeLeft(version.votingClosesAt)}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {VOTE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setChoice(o.value)
              setSaved(false)
            }}
            className={cn(
              "coop-btn flex-col items-start gap-0.5 py-2 text-left",
              {
                "coop-btn-primary": choice === o.value,
              },
            )}
          >
            <span className="font-semibold">{o.label}</span>
            <span className="text-xs opacity-80">{o.hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <label className="coop-label">Anything to add? (optional)</label>
        <textarea
          className="coop-textarea"
          rows={2}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            setSaved(false)
          }}
        />
      </div>

      {version.viewerVote && (
        <p className="mt-2 text-xs text-(--coop-ink-faint)">
          Your current vote this round: {version.viewerVote}. You can change it
          until voting closes.
        </p>
      )}

      {error && (
        <div className="mt-3 text-sm font-medium text-[#aa3a3a]">{error}</div>
      )}
      {saved && !error && (
        <div className="mt-3 text-sm font-medium text-(--coop-good)">
          Vote recorded. Thanks for helping decide.
        </div>
      )}

      <CoopButton
        variant="primary"
        className="mt-4"
        onClick={submit}
        disabled={vote.isPending}
      >
        {vote.isPending
          ? "Saving…"
          : version.viewerVote
            ? "Update my vote"
            : "Submit vote"}
      </CoopButton>
    </div>
  )
}

function MarkedList({
  text,
  mark,
  markClassName,
}: {
  text: string
  mark: string
  markClassName: string
}) {
  const items = text
    .split("\n")
    .map((line) => line.replace(/^[•\-\u2022\s]+/, "").trim())
    .filter(Boolean)

  return (
    <ul className="mt-1 flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={cn("mt-0.5 font-bold", markClassName)}>{mark}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function TryItBlock({ version }: { version: BetaVersion }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!version.accessCode) return
    void navigator.clipboard?.writeText(version.accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mt-5 rounded-xl bg-(--coop-accent-soft) p-4">
      <h3 className="text-sm font-bold text-(--coop-accent)">
        Try this version yourself
      </h3>
      <p className="mt-1 text-sm text-[#2b3a52]">
        Want to try it first? Open Bridger, sign in or create an account, and
        use the beta code below to get into this version before you vote.
      </p>

      {version.accessCode && (
        <div className="mt-3">
          <span className="coop-label">Beta access code</span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-(--coop-line) bg-white px-3 py-1.5 font-mono text-base font-bold tracking-wide">
              {version.accessCode}
            </code>
            <button
              type="button"
              className="coop-btn coop-btn-sm"
              onClick={copy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {version.testUrl && (
        <a
          href={version.testUrl}
          className="coop-btn mt-3 inline-flex w-full justify-center sm:w-auto"
        >
          Open Bridger →
        </a>
      )}
    </div>
  )
}

function ReleaseDate({ date }: { date: string | null }) {
  if (!date) return null
  return (
    <p className="mt-1 text-sm text-(--coop-ink-faint)">
      Released{" "}
      {new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </p>
  )
}

export default function BetaPage() {
  const { data: versions, isLoading } = useBeta()
  const { hash } = useLocation()

  const current = versions?.find((v) => v.isCurrent)
  const past = versions?.filter((v) => !v.isCurrent) ?? []

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [hash, versions])

  return (
    <div>
      <SectionTitle
        eyebrow="Vote"
        title="Test new versions and vote on what ships"
        subtitle="Members who are testing Bridger review each new version, try it out, and vote on whether it should go live. Voting is open for one week after a version is released."
      />

      {isLoading && (
        <p className="text-(--coop-ink-faint)">Loading versions…</p>
      )}

      {current && (
        <div className="mb-10">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{current.versionName}</h2>
              <span className="ml-auto">
                <DecisionBadge version={current} />
              </span>
            </div>
            <ReleaseDate date={current.releaseDate} />

            <p className="mt-3 text-(--coop-ink-soft)">{current.summary}</p>

            {current.releaseNotes && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-(--coop-ink-soft)">
                  What's in this update
                </h3>
                <MarkedList
                  text={current.releaseNotes}
                  mark="✓"
                  markClassName="text-(--coop-good)"
                />
              </div>
            )}

            {current.unfinished && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-(--coop-ink-soft)">
                  Not finished yet in this version
                </h3>
                <MarkedList
                  text={current.unfinished}
                  mark="✕"
                  markClassName="text-[#c0552b]"
                />
              </div>
            )}

            {current.knownIssues && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-(--coop-ink-soft)">
                  Known issues
                </h3>
                <p className="mt-1 text-sm">{current.knownIssues}</p>
              </div>
            )}

            <TryItBlock version={current} />

            <VotePanel version={current} />

            {(current.viewerVote || current.decision !== "open") && (
              <div className="mt-6 border-t border-(--coop-line) pt-6">
                <TallyBar version={current} />
              </div>
            )}
          </Card>
        </div>
      )}

      <div id="dues" className="mb-10 scroll-mt-24">
        <MembershipDues />
      </div>

      <div className="mb-10">
        <MissionPrinciples />
      </div>

      <h2 className="mb-4 text-xl font-bold">Past versions</h2>
      <div className="flex flex-col gap-4">
        {past.map((v) => (
          <Card key={v.id}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">{v.versionName}</h3>
              <span className="ml-auto">
                <DecisionBadge version={v} />
              </span>
            </div>
            <p className="mt-2 text-sm text-(--coop-ink-soft)">{v.summary}</p>
            <div className="mt-3">
              <TallyBar version={v} />
            </div>
          </Card>
        ))}
        {past.length === 0 && !isLoading && (
          <p className="text-sm text-(--coop-ink-faint)">
            No past versions yet.
          </p>
        )}
      </div>

      <p className="coop-hint mt-8 max-w-2xl">
        Voting decides whether a version is released to the public. If members
        do not approve a version, it is not shipped. Extending deliberation
        keeps the vote open another week so the community can keep testing.
      </p>
    </div>
  )
}
