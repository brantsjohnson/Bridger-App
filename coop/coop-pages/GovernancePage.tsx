import { Link } from "react-router-dom"

import {
  Badge,
  Card,
  InfoLink,
  InfoTip,
  SectionTitle,
  type BadgeTone,
} from "../../components/coop-ui/ui"
import { useMission } from "../../lib/api/coop"
import { cn } from "../../lib/cn"

// --- comparison data --------------------------------------------------------

type Cell = "yes" | "planned" | "limited" | "no"

const COMPARISON_COLUMNS: {
  label: string
  href?: string
  linkTitle?: string
}[] = [
  {
    label: "Green Bay Packers",
    href: "https://www.packers.com/community/shareholders",
    linkTitle:
      "Packers shareholders elect the board, but most member participation is limited to that annual vote.",
  },
  {
    label: "REI",
    href: "https://www.rei.com/about-rei/governance",
    linkTitle:
      "REI members elect the board and receive a small dividend, but day-to-day participation is still mostly periodic.",
  },
  {
    label: "Credit Union",
    href: "https://corporatefinanceinstitute.com/resources/wealth-management/credit-union/",
    linkTitle:
      "Credit unions are usually just electing a board of directors — that is all.",
  },
  { label: "Phase 0" },
  { label: "Phase 1" },
  { label: "Phase 2" },
  { label: "Phase 3" },
]

const BRIDGER_PHASE_START = 3
const BRIDGER_PHASE_COUNT = 4
const OTHER_COOP_COUNT = BRIDGER_PHASE_START

const PHASE_PROGRESSION_TIP =
  "A No in an earlier Bridger phase does not mean it never happens. Participation unlocks in order, so each ability turns on in the phase where members are ready for it."

const CHARTER_AMEND_TIP =
  "Charter changes follow a defined process. They do not open on a whim. Founders ratify the founding charter in Phase 0; fuller member amendment votes stay partial until the board is elected in Phase 3."

const COST_TRANSPARENCY_TIP =
  "Bridger is volunteer-run until dues begin. We share planning estimates and manual cost breakdowns, not live accounting. Until members are paying dues, full cost transparency is not required. Limited reflects that honestly. Once dues start in Phase 1, transparency expands."

const COMPARISON_ROWS: {
  row: string
  values: Cell[]
  tip?: string
  tipLabel?: string
}[] = [
  {
    row: "Suggest features & ideas",
    values: ["no", "limited", "no", "yes", "yes", "yes", "yes"],
  },
  {
    row: "Vote on each version before public use",
    values: ["no", "no", "no", "yes", "yes", "yes", "yes"],
  },
  {
    row: "Cost transparency",
    values: ["limited", "limited", "limited", "limited", "yes", "yes", "yes"],
    tip: COST_TRANSPARENCY_TIP,
    tipLabel: "How cost transparency works",
  },
  {
    row: "Everyday voting (themes, activities, prompts)",
    values: ["no", "no", "no", "no", "yes", "yes", "yes"],
  },
  {
    row: "Member perks & discounts",
    values: ["no", "yes", "yes", "no", "no", "yes", "yes"],
  },
  {
    row: "Elect the board",
    values: ["yes", "yes", "yes", "no", "no", "no", "yes"],
  },
  {
    row: "Profit sharing (when possible)",
    values: ["no", "no", "no", "no", "no", "no", "yes"],
    tip: "If Bridger generates surplus after operating costs and reserves, the board can return value to members when finances allow. There is no guarantee every year. It depends on what the co-op can sustainably afford.",
    tipLabel: "How profit sharing works",
  },
  {
    row: "Amend the charter",
    values: ["no", "limited", "limited", "no", "no", "no", "limited"],
    tip: CHARTER_AMEND_TIP,
    tipLabel: "How charter amendments work",
  },
]

const CELL_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  yes: { label: "Yes", tone: "yes" },
  planned: { label: "Planned", tone: "planned" },
  limited: { label: "Limited", tone: "limited" },
  moderate: { label: "Moderate", tone: "limited" },
  no: { label: "No", tone: "no" },
}

function ComparisonCell({ cell }: { cell: Cell }) {
  const meta = CELL_LABEL[cell]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

interface TriggerGroup {
  label: string
  items: string[]
}

interface Phase {
  name: string
  cost?: string
  description: string
  why: string
  includes: string[]
  highlight?: string
  triggers?: string[]
  triggerGroups?: TriggerGroup[]
  current?: boolean
}

const PHASES: Phase[] = [
  {
    name: "Phase 0: Beta Launch",
    cost: "Free",
    description:
      "Members here are the founding cohort. They get hands-on early access and a real hand in shaping the rules the co-op will launch under.",
    why: "A co-op needs something real to steward and a charter people actually agreed to. The founding cohort tests the product and ratifies the charter and pricing, so everything later rests on rules members chose.",
    includes: [
      "Hands-on early access",
      "Suggest features & ideas",
      "Vote on each version before public use",
      "Say in what the co-op should cost",
      "Shape the draft charter",
      "Ratify the charter & pricing",
    ],
    highlight:
      "What makes them founders, not just testers: they ratify the charter and the pricing.",
    triggers: [
      "Beta is tested and stable",
      "Charter and pricing finalized from official paying member input and ratified",
      "Waitlist is ready to be notified",
    ],
    current: true,
  },
  {
    name: "Phase 1: Full Co-op",
    cost: "Dues begin",
    description:
      "Now it's real membership. Joining means paying dues at the ratified price, and in return members get full rights, starting with the fun, frequent ones.",
    why: "Real membership only makes sense once the product is stable and the price is set. Paid members start with frequent, low-stakes votes so the habit of participating is built before bigger decisions arrive.",
    includes: [
      "Vote on quiz themes, activities & daily prompts",
      "Vote on each version before public use",
      "Keep suggesting ideas",
    ],
    highlight:
      "This is where the voting habit gets built: lots of small, visible wins that make membership feel alive.",
    triggers: [
      "A solid base of waitlist members has joined and stayed engaged (steady engagement, not just a launch-day spike)",
      "A set number of paying members retained past 60 to 90 days",
    ],
  },
  {
    name: "Phase 2: Grow Co-op",
    description:
      "Dues start paying members back. This is where belonging delivers tangible value.",
    why: "Member perks need a paying base and steady engagement to fund them.",
    includes: ["Discounts & member-only perks"],
    highlight: "Belonging now saves or earns members something.",
    triggerGroups: [
      {
        label: "Path A: Bridger is self-sustaining and alive",
        items: [
          "Dues cover operating costs plus at least one team member paid a full-time living wage, from dues and revenue (not outside funding or the founder's own pocket)",
          "Held for 6 consecutive months",
          "At least 20% of paying members turn out when something goes to a vote",
        ],
      },
      {
        label: "Path B: Bridger has become large and committed",
        items: [
          "Paying membership has grown well past break-even and stayed sticky: retention above 70% over the same 6-month window",
          "At least 20% of paying members turn out to vote",
        ],
      },
    ],
  },
  {
    name: "Phase 3: Elect Board",
    description:
      "The vote that matters most. Top-level governance becomes member-driven.",
    why: "Electing a board is the highest-stakes governance step. It comes last, once the co-op is financially sustainable or large and members reliably turn out to vote.",
    includes: [
      "Elect the board that steers the co-op",
      "Board takes on major financial & strategic calls, including how surplus is handled",
      "Profit sharing (when possible)",
    ],
    highlight: "Top-level governance becomes member-driven.",
    triggers: [],
  },
]

function MissionSection() {
  const { data: principles } = useMission()

  return (
    <div id="mission" className="mt-12 scroll-mt-24">
      <Card>
        <SectionTitle
          title="Mission principles"
          subtitle="These are the commitments Bridger is being built around. They will be baked into the charter. The list here is just a reference, members support and weigh in on them over on the Vote tab."
        />
        <ul className="flex flex-col gap-2">
          {principles?.map((p) => (
            <li key={p.id} className="flex gap-2 text-sm">
              <span className="mt-0.5 font-bold text-(--coop-accent)">✓</span>
              <span>
                <span className="font-semibold">{p.title}.</span>{" "}
                <span className="text-(--coop-ink-soft)">{p.description}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-(--coop-ink-faint)">
          Have an idea for a mission principle that is not listed here? Add it
          on the Ideas tab.
        </p>
        <Link
          to="/co-op/vote#mission"
          className="coop-btn coop-btn-primary mt-4 inline-flex w-full justify-center sm:w-auto"
        >
          Support mission principles on the Vote tab →
        </Link>
      </Card>
    </div>
  )
}

export default function GovernancePage() {
  return (
    <div>
      <SectionTitle
        eyebrow="Co-op Model"
        title="A modern co-op for social technology"
        subtitle="Learn what a co-op is, how existing co-ops work, and how Bridger is expanding participation over time."
      />

      {/* Why a co-op */}
      <Card>
        <h2 className="text-xl font-bold">
          Why Bridger Is Building Toward a Co-op
        </h2>
        <div className="coop-prose mt-3">
          <p>
            Bridger is being built to help people spend less time scrolling and
            more time building meaningful real-world relationships.
          </p>
          <p>
            Many social platforms become unhealthy because their business models
            reward attention, addiction, data extraction, and endless
            engagement. Bridger&apos;s future co-op is designed to protect
            against that.
          </p>
          <p>
            Co-op members are long-term stewards and a check on Bridger&apos;s
            mission. Not every idea ships right away, and we can disagree, but
            the goal is to make sure this technology is used for good.
          </p>
        </div>
      </Card>

      {/* Comparison table */}
      <div className="mt-10">
        <h2 className="text-xl font-bold">What Co-ops Usually Do</h2>
        <p className="mt-2 max-w-2xl text-(--coop-ink-soft)">
          A simple comparison of how participation tends to work across
          well-known co-ops, and how Bridger expands through each phase.
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-(--coop-ink-faint)">
          A &ldquo;No&rdquo; in an earlier Bridger phase just means it unlocks
          later
          <InfoTip label="How the Bridger phases read">
            <p>{PHASE_PROGRESSION_TIP}</p>
          </InfoTip>
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border-b border-(--coop-line) p-3 text-left font-semibold text-(--coop-ink-soft)"
                />
                <th
                  colSpan={OTHER_COOP_COUNT}
                  className="p-2"
                  aria-hidden="true"
                />
                <th
                  colSpan={BRIDGER_PHASE_COUNT}
                  className="border-b-0 p-0 align-bottom"
                >
                  <div className="flex flex-col items-center px-3 pt-2">
                    <span className="text-sm font-bold text-(--coop-accent)">
                      Bridger
                    </span>
                    <div
                      className="mt-1 h-2.5 w-full max-w-md rounded-t-md border-x-2 border-t-2 border-(--coop-accent)"
                      aria-hidden="true"
                    />
                  </div>
                </th>
              </tr>
              <tr>
                {COMPARISON_COLUMNS.map((col, i) => (
                  <th
                    key={col.label}
                    className={cn(
                      "border-b border-(--coop-line) p-3 text-left font-semibold",
                      {
                        "text-(--coop-accent)": i >= BRIDGER_PHASE_START,
                        "text-(--coop-ink-soft)": i < BRIDGER_PHASE_START,
                      },
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.href && col.linkTitle && (
                        <InfoLink
                          href={col.href}
                          label={`More about ${col.label} governance`}
                        >
                          <p>{col.linkTitle}</p>
                        </InfoLink>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r) => (
                <tr key={r.row}>
                  <td className="border-b border-(--coop-line) p-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {r.row}
                      {r.tip && r.tipLabel && (
                        <InfoTip label={r.tipLabel}>
                          <p>{r.tip}</p>
                        </InfoTip>
                      )}
                    </span>
                  </td>
                  {r.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn("border-b border-(--coop-line) p-3", {
                        "bg-(--coop-accent-soft)/40": i >= BRIDGER_PHASE_START,
                      })}
                    >
                      <ComparisonCell cell={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roadmap */}
      <div id="roadmap" className="mt-10 scroll-mt-24">
        <SectionTitle
          title="Governance roadmap"
          subtitle="Participation grows in phases. Each phase unlocks new ways to take part as the product and member base mature."
        />
        <div className="flex flex-col gap-4">
          {PHASES.map((phase, i) => (
            <Card
              key={phase.name}
              className={cn({ "border-(--coop-accent)": phase.current })}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-(--coop-accent-soft) text-sm font-bold text-(--coop-accent)">
                  {i}
                </span>
                <h3 className="text-lg font-bold">{phase.name}</h3>
                <InfoTip label={`Why ${phase.name} comes when it does`}>
                  <p className="coop-hint mb-1.5">
                    Why it works in this order:
                  </p>
                  <p>{phase.why}</p>
                </InfoTip>
                {phase.cost && (
                  <Badge tone={phase.cost === "Free" ? "yes" : "neutral"}>
                    {phase.cost}
                  </Badge>
                )}
                {phase.current && <Badge tone="planned">We are here</Badge>}
              </div>
              <p className="mt-2 text-(--coop-ink-soft)">{phase.description}</p>
              {phase.highlight && (
                <p className="mt-3 border-l-2 border-(--coop-accent) pl-3 text-sm font-medium text-(--coop-ink)">
                  {phase.highlight}
                </p>
              )}

              <details className="coop-disclosure mt-3" open={phase.current}>
                <summary className="coop-disclosure-summary">
                  What members get in this phase
                </summary>
                <div className="mt-3">
                  <ul className="flex flex-col gap-2 text-sm text-(--coop-ink-soft)">
                    {phase.includes.map((inc) => (
                      <li key={inc} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 shrink-0 font-bold text-(--coop-accent)"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                  {phase.triggers && phase.triggers.length > 0 && (
                    <div className="mt-4">
                      <p className="coop-hint mb-1.5">
                        What needs to be true before the next phase:
                      </p>
                      <ul className="list-inside list-disc text-sm text-(--coop-ink-soft)">
                        {phase.triggers.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {phase.triggerGroups && (
                    <div className="mt-4">
                      <p className="coop-hint mb-2">
                        What needs to be true before the next phase (either path
                        counts, whichever comes first):
                      </p>
                      <div className="flex flex-col gap-3">
                        {phase.triggerGroups.map((g) => (
                          <div key={g.label}>
                            <p className="text-sm font-semibold text-(--coop-ink)">
                              {g.label}
                            </p>
                            <ul className="mt-1 list-inside list-disc text-sm text-(--coop-ink-soft)">
                              {g.items.map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </Card>
          ))}
        </div>
      </div>

      {/* Membership dues teaser — voting lives on the Vote page */}
      <div id="dues" className="mt-10 scroll-mt-24">
        <Card>
          <h2 className="text-xl font-bold">Membership dues</h2>
          <p className="mt-2 max-w-2xl text-(--coop-ink-soft)">
            Dues are set by members, not by us. The goal is not to hoard profit
            but to keep Bridger sustainable so we can offer a healthy social
            alternative. Members weigh in on what annual dues should be, and the
            tool lets you see how different prices cover Bridger's running
            costs.
          </p>
          <p className="mt-2 max-w-2xl text-(--coop-ink-soft)">
            Voting on dues is open to signed-in members and lives on the Vote
            page.
          </p>
          <Link
            to="/co-op/vote#dues"
            className="coop-btn coop-btn-primary mt-4 inline-flex w-full justify-center sm:w-auto"
          >
            Go vote on membership dues →
          </Link>
        </Card>
      </div>

      <MissionSection />
    </div>
  )
}
