import { useEffect, useMemo, useRef, useState } from "react"

import { DonutChart } from "../../components/coop-ui/charts"
import { CoopNumberInput } from "../../components/coop-ui/CoopNumberInput"
import { CoopSlider } from "../../components/coop-ui/CoopSlider"
import { CostCalculationDetails } from "../../components/coop-ui/CostCalculationDetails"
import { RoleCard } from "../../components/coop-ui/RoleCard"
import { ScalableMemberSlider } from "../../components/coop-ui/ScalableMemberSlider"
import { Card, InfoTip, SectionTitle, Stat } from "../../components/coop-ui/ui"
import { WaitlistSliderHint } from "../../components/coop-ui/useWaitlistBaseline"
import { useDues, useRoles, type Role } from "../../lib/api/coop"
import { cn } from "../../lib/cn"
import {
  computeCosts,
  DEFAULT_ANNUAL_DUES,
  DEFAULT_COST_INPUTS,
  FUTURE_LABELS,
  resolveFutureCost,
  type CostModelInputs,
  type FixedCosts,
  type FutureKey,
} from "../../lib/coop-math/costModel"

const TEAM_COLOR = "#7d5ba6"

type PayState = Record<number, { enabled: boolean; monthly: number }>

const usd = (n: number) =>
  "$" + Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })

interface SliderDef {
  key: keyof SimState
  label: string
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
}

interface SimState {
  members: number
  annualDues: number
  payingPct: number
  activePct: number
  mapLoads: number
  photos: number
  friendPhotos: number
  photoMb: number
}

const SIM_DEFAULTS: SimState = {
  members: 500,
  annualDues: DEFAULT_ANNUAL_DUES,
  payingPct: 5,
  activePct: 65,
  mapLoads: 8,
  photos: 30,
  friendPhotos: 50,
  photoMb: 0.5,
}

const MAIN_SLIDERS: SliderDef[] = [
  {
    key: "annualDues",
    label: "Annual membership dues",
    min: 0,
    max: 100,
    step: 1,
    prefix: "$",
    suffix: "/yr",
  },
]

const PAYING_PCT_DISCLAIMER =
  "FYI: Not to be a buzz kill, but statistically it is hard to get more than about 5% of users to pay for a social platform. Bridger is different because it is a co-op, so we hope the share is higher, but time will tell."

const USAGE_ASSUMPTION_SLIDERS: SliderDef[] = [
  {
    key: "activePct",
    label: "Monthly active members (usage estimates)",
    min: 0,
    max: 100,
    step: 5,
    suffix: "%",
  },
  {
    key: "mapLoads",
    label: "Map loads per active member / month",
    min: 0,
    max: 30,
    step: 1,
  },
  {
    key: "photos",
    label: "Photos posted per member / month",
    min: 0,
    max: 60,
    step: 1,
  },
  {
    key: "friendPhotos",
    label: "Friend photos loaded per active member / day",
    min: 0,
    max: 200,
    step: 5,
  },
  {
    key: "photoMb",
    label: "Average photo size",
    min: 0.1,
    max: 3,
    step: 0.1,
    suffix: "MB",
  },
]

const FIXED_FIELDS: { key: keyof FixedCosts; label: string; note?: string }[] =
  [
    { key: "vps", label: "VPS (server)" },
    { key: "domain", label: "Domain" },
    { key: "appleDeveloper", label: "App store", note: "$99 / year" },
    {
      key: "googlePlay",
      label: "Google Play",
      note: "only for an Android app",
    },
    { key: "basicAccounting", label: "Basic accounting" },
    { key: "legalBasic", label: "Basic legal" },
  ]

const FUTURE_KEYS: FutureKey[] = [
  "emailSms",
  "pushNotifications",
  "objectStorage",
]

export default function EconomicsPage() {
  const { data: roles } = useRoles()
  const { data: duesData } = useDues()
  const waitlistCount = duesData?.waitlistCount ?? 0
  const membersUserSet = useRef(false)

  const [sim, setSim] = useState<SimState>(SIM_DEFAULTS)
  const [fixed, setFixed] = useState<FixedCosts>({
    ...DEFAULT_COST_INPUTS.fixed,
  })
  const [mapboxCost, setMapboxCost] = useState(DEFAULT_COST_INPUTS.mapboxCost)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false)
  const [future, setFuture] = useState(DEFAULT_COST_INPUTS.future)
  const [payTeam, setPayTeam] = useState(false)
  const [payState, setPayState] = useState<PayState>({})
  const [equalPay, setEqualPay] = useState(2000)
  const [showPython, setShowPython] = useState(false)

  useEffect(() => {
    if (!duesData || membersUserSet.current || waitlistCount <= 0) return
    setSim((prev) => ({ ...prev, members: waitlistCount }))
  }, [duesData, waitlistCount])

  const setSimValue = (key: keyof SimState, value: number) => {
    if (key === "members") membersUserSet.current = true
    setSim((prev) => ({ ...prev, [key]: value }))
  }

  const resetMembersToWaitlist = () => {
    membersUserSet.current = false
    if (waitlistCount > 0) {
      setSim((prev) => ({ ...prev, members: waitlistCount }))
    }
  }

  const waitlistConnected = waitlistCount > 0
  const membersMin = waitlistConnected ? waitlistCount : 50

  const payFor = (role: Role) => {
    const row = payState[role.id]
    return { enabled: row?.enabled ?? false, monthly: row?.monthly ?? 0 }
  }

  const setPay = (
    id: number,
    patch: Partial<{ enabled: boolean; monthly: number }>,
  ) =>
    setPayState((prev) => {
      const cur = prev[id] ?? { enabled: false, monthly: 0 }
      return { ...prev, [id]: { ...cur, ...patch } }
    })

  const selectAllPay = () => {
    if (!roles) return
    setPayState((prev) => {
      const next = { ...prev }
      for (const role of roles) {
        const cur = next[role.id] ?? { enabled: false, monthly: 0 }
        next[role.id] = { ...cur, enabled: true }
      }
      return next
    })
  }

  const unselectAllPay = () => {
    if (!roles) return
    setPayState((prev) => {
      const next = { ...prev }
      for (const role of roles) {
        const cur = next[role.id] ?? { enabled: false, monthly: 0 }
        next[role.id] = { ...cur, enabled: false }
      }
      return next
    })
  }

  const payAllEqually = () => {
    if (!roles) return
    const amount = Math.max(0, equalPay)
    setPayState(
      Object.fromEntries(
        roles.map((role) => [role.id, { enabled: true, monthly: amount }]),
      ),
    )
  }

  const salaryTotal = useMemo(() => {
    if (!payTeam || !roles) return 0
    return roles.reduce((sum, role) => {
      const row = payState[role.id]
      if (!row?.enabled) return sum
      return sum + Math.max(0, row.monthly) * 12
    }, 0)
  }, [payTeam, roles, payState])

  const inputs = useMemo<CostModelInputs>(
    () => ({
      members: sim.members,
      annualDues: sim.annualDues,
      payingRate: sim.payingPct / 100,
      monthlyActiveRate: sim.activePct / 100,
      mapLoadsPerActiveUserPerMonth: sim.mapLoads,
      photosPerMemberPerMonth: sim.photos,
      friendPhotosViewedPerActiveUserPerDay: sim.friendPhotos,
      avgPhotoMb: sim.photoMb,
      fixed,
      mapboxCost,
      paymentsEnabled,
      future,
      salaryTotal,
    }),
    [sim, fixed, mapboxCost, paymentsEnabled, future, salaryTotal],
  )

  const r = useMemo(() => computeCosts(inputs), [inputs])
  const netPosition = r.annualRevenue - r.annualCosts
  const sustainable = netPosition >= 0
  const atOrAboveBreakEven =
    r.breakEvenMembers !== null && sim.members >= r.breakEvenMembers

  const slices = [
    {
      label: "Server & infrastructure",
      value:
        r.vpsTotal +
        inputs.fixed.domain +
        r.mapboxEstimate +
        r.storageReserve +
        (future.objectStorage.enabled
          ? resolveFutureCost(
              "objectStorage",
              future.objectStorage,
              sim.members,
            )
          : 0),
      color: "#2f5fae",
    },
    {
      label: "Business admin",
      value: fixed.basicAccounting + fixed.legalBasic,
      color: "#8a909a",
    },
    {
      label: "App stores",
      value: fixed.appleDeveloper + fixed.googlePlay,
      color: "#5b8def",
    },
    { label: "Payments", value: r.paymentFees, color: "#c9973f" },
    {
      label: "Future features",
      value: FUTURE_KEYS.reduce(
        (sum, key) => sum + resolveFutureCost(key, future[key], sim.members),
        0,
      ),
      color: "#3f7d52",
    },
    { label: "Team", value: salaryTotal, color: TEAM_COLOR },
  ].filter((s) => s.value > 0)

  const breakdown: { label: string; value: number; note?: string }[] = [
    {
      label: "VPS (server)",
      value: r.vpsTotal,
      note: r.vpsExtra > 0 ? `+${usd(r.vpsExtra)} scale-up` : undefined,
    },
    { label: "Domain", value: fixed.domain },
    { label: "App store", value: fixed.appleDeveloper },
    { label: "Google Play", value: fixed.googlePlay },
    { label: "Basic accounting", value: fixed.basicAccounting },
    { label: "Basic legal", value: fixed.legalBasic },
    {
      label: "Mapbox",
      value: r.mapboxEstimate,
      note:
        mapboxCost > 0
          ? "manual estimate"
          : r.mapboxEstimate > 0
            ? "from usage"
            : "within free tier",
    },
    {
      label: "Storage reserve",
      value: r.storageReserve,
      note: r.storageReserve > 0 ? "over 50 GB" : "not needed yet",
    },
    { label: "Payments (Stripe)", value: r.paymentFees },
    ...FUTURE_KEYS.map((key) => {
      const resolved = resolveFutureCost(key, future[key], sim.members)
      const scaled =
        future[key].enabled &&
        future[key].amount === 0 &&
        (key === "emailSms" || key === "pushNotifications")
      return {
        label: FUTURE_LABELS[key],
        value: resolved,
        note: scaled
          ? "scales with members"
          : future[key].amount > 0
            ? "manual"
            : undefined,
      }
    }),
    { label: "Team", value: salaryTotal },
  ]

  return (
    <div>
      <SectionTitle
        eyebrow="Roles & Economics"
        title="What it takes to run Bridger"
        subtitle="Bridger's first version is built to stay inexpensive. The core costs today are the server, domain, Mapbox usage, and basic business administration. More expensive features are optional or future costs, so the model stays honest as the community grows."
      />

      {/* One container: simulator, results, and where the money goes. */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Sustainability simulator</h2>
          <button
            type="button"
            className="coop-link-btn"
            onClick={() => setShowPython((v) => !v)}
          >
            {showPython ? "Hide calculation" : "See how this is calculated"}
          </button>
        </div>
        <p className="mt-1 text-sm text-(--coop-ink-soft)">
          Adjust the assumptions to see what Bridger actually costs to run, and
          how member dues could cover it.
        </p>

        {showPython && (
          <div className="mt-3">
            <CostCalculationDetails inputs={inputs} result={r} />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="flex flex-col gap-5">
              <ScalableMemberSlider
                label="People on the waitlist"
                value={sim.members}
                min={membersMin}
                onChange={(n) => setSimValue("members", n)}
                hint={
                  <WaitlistSliderHint
                    waitlistCount={waitlistCount}
                    connected={waitlistConnected}
                    divergedFromWaitlist={
                      waitlistConnected && sim.members !== waitlistCount
                    }
                    onReset={resetMembersToWaitlist}
                  />
                }
              />
              {MAIN_SLIDERS.map((s) => (
                <CoopSlider
                  key={s.key}
                  label={s.label}
                  value={sim[s.key]}
                  onChange={(n) => setSimValue(s.key, n)}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              ))}
              <div>
                <CoopSlider
                  label="Percent who pay dues"
                  value={sim.payingPct}
                  onChange={(n) => setSimValue("payingPct", n)}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                />
                {sim.payingPct > 5 && (
                  <Card className="mt-3 bg-(--coop-warn-soft)">
                    <p className="text-sm text-(--coop-ink)">
                      {PAYING_PCT_DISCLAIMER}
                    </p>
                  </Card>
                )}
              </div>
            </div>

            {/* Adjustable cost assumptions, tucked away to keep the view calm. */}
            <details className="coop-disclosure mt-6">
              <summary className="coop-disclosure-summary">
                Adjust cost assumptions
              </summary>
              <div className="mt-3 flex flex-col gap-4">
                <div>
                  <p className="mb-3 text-sm font-semibold text-(--coop-ink-soft)">
                    Usage assumptions
                  </p>
                  <div className="flex flex-col gap-5">
                    {USAGE_ASSUMPTION_SLIDERS.map((s) => (
                      <CoopSlider
                        key={s.key}
                        label={s.label}
                        value={sim[s.key]}
                        onChange={(n) => setSimValue(s.key, n)}
                        min={s.min}
                        max={s.max}
                        step={s.step}
                        prefix={s.prefix}
                        suffix={s.suffix}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-(--coop-ink-soft)">
                    Required fixed costs (per year)
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {FIXED_FIELDS.map((f) => (
                      <label
                        key={f.key}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-(--coop-ink-soft)">
                          {f.label}
                          {f.note && (
                            <span className="coop-hint block text-xs">
                              {f.note}
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <span className="text-(--coop-ink-faint)">$</span>
                          <CoopNumberInput
                            className="w-24"
                            min={0}
                            step={25}
                            value={fixed[f.key]}
                            onChange={(n) =>
                              setFixed((prev) => ({
                                ...prev,
                                [f.key]: n,
                              }))
                            }
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-(--coop-ink-soft)">
                    Mapbox usage
                    <span className="coop-hint block text-xs">
                      often free early; set a manual estimate
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-(--coop-ink-faint)">$</span>
                    <CoopNumberInput
                      className="w-24"
                      min={0}
                      step={25}
                      value={mapboxCost}
                      onChange={setMapboxCost}
                    />
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="coop-checkbox"
                    checked={paymentsEnabled}
                    onChange={(e) => setPaymentsEnabled(e.target.checked)}
                  />
                  <span className="text-(--coop-ink-soft)">
                    Collect dues by card (adds Stripe fees: 2.9% + $0.30 each)
                  </span>
                </label>

                <div>
                  <p className="mb-1 text-sm font-semibold text-(--coop-ink-soft)">
                    Messaging &amp; storage
                  </p>
                  <p className="coop-hint mb-2">
                    Email and push are on by default. Leave at $0 to use a low
                    per-member estimate that grows with the waitlist, or type a
                    manual override.
                  </p>
                  <div className="flex flex-col gap-2">
                    {FUTURE_KEYS.map((key) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <input
                            type="checkbox"
                            className="coop-checkbox shrink-0"
                            checked={future[key].enabled}
                            onChange={(e) =>
                              setFuture((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  enabled: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span
                            className={cn("text-(--coop-ink-soft)", {
                              "text-(--coop-ink-faint)": !future[key].enabled,
                            })}
                          >
                            {FUTURE_LABELS[key]}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <span className="text-(--coop-ink-faint)">$</span>
                          <CoopNumberInput
                            className="w-24"
                            min={0}
                            step={100}
                            disabled={!future[key].enabled}
                            value={future[key].amount}
                            onChange={(n) =>
                              setFuture((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  amount: n,
                                },
                              }))
                            }
                          />
                          <span className="text-(--coop-ink-faint)">/yr</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            {/* Pay the team: connects the volunteer roles to real cost. */}
            <div className="mt-6 border-t border-(--coop-line) pt-5">
              <label className="flex cursor-pointer items-center gap-2.5 font-medium">
                <input
                  type="checkbox"
                  className="coop-checkbox"
                  checked={payTeam}
                  onChange={(e) => setPayTeam(e.target.checked)}
                />
                Pay the people doing this work
              </label>
              <p className="coop-hint mt-1.5">
                Today these roles are filled by volunteers. Choose who to pay
                and how much. The costs and chart update so the tradeoff is
                honest.
              </p>

              {payTeam && roles && (
                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      className="coop-btn coop-btn-ghost px-2 py-1 text-xs"
                      onClick={selectAllPay}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="coop-btn coop-btn-ghost px-2 py-1 text-xs"
                      onClick={unselectAllPay}
                    >
                      Unselect all
                    </button>
                    <span className="text-(--coop-ink-faint)">|</span>
                    <span className="text-(--coop-ink-soft)">Pay equally</span>
                    <span className="text-(--coop-ink-faint)">$</span>
                    <CoopNumberInput
                      className="w-20 text-sm"
                      min={0}
                      step={100}
                      value={equalPay}
                      onChange={setEqualPay}
                    />
                    <span className="text-(--coop-ink-faint)">/mo</span>
                    <button
                      type="button"
                      className="coop-btn coop-btn-ghost px-2 py-1 text-xs"
                      onClick={payAllEqually}
                    >
                      Apply
                    </button>
                  </div>
                  {roles.map((role) => {
                    const p = payFor(role)
                    return (
                      <div
                        key={role.id}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            className="coop-checkbox"
                            checked={p.enabled}
                            onChange={(e) =>
                              setPay(role.id, { enabled: e.target.checked })
                            }
                          />
                          <span
                            className={cn("text-(--coop-ink)", {
                              "text-(--coop-ink-faint) line-through":
                                !p.enabled,
                            })}
                          >
                            {role.title}
                          </span>
                        </label>
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-(--coop-ink-faint)">$</span>
                          <CoopNumberInput
                            className="w-24"
                            min={0}
                            step={100}
                            value={p.monthly}
                            disabled={!p.enabled}
                            onChange={(n) =>
                              setPay(role.id, {
                                monthly: n,
                              })
                            }
                          />
                          <span className="text-(--coop-ink-faint)">/mo</span>
                        </div>
                      </div>
                    )
                  })}
                  <p className="mt-1 text-sm font-semibold text-(--coop-ink)">
                    Team cost: {usd(salaryTotal)} / year
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <Stat
                  value={usd(r.annualRevenue)}
                  label="Annual revenue from dues"
                  valueTone={sustainable ? "good" : "neutral"}
                />
              </Card>
              <Card>
                <div className="flex items-start justify-between gap-1">
                  <Stat
                    value={usd(r.annualCosts)}
                    label="Estimated annual costs"
                    valueTone="cost"
                  />
                  <InfoTip
                    wide
                    label="How estimated annual costs are calculated"
                  >
                    <CostCalculationDetails inputs={inputs} result={r} />
                  </InfoTip>
                </div>
              </Card>
              <Card>
                <Stat
                  value={usd(netPosition)}
                  label="Net position"
                  valueTone={sustainable ? "good" : "bad"}
                />
              </Card>
              <Card>
                <Stat
                  value={
                    r.breakEvenMembers === null
                      ? "n/a"
                      : r.breakEvenMembers.toLocaleString()
                  }
                  label="Break-even members"
                  valueTone={
                    r.breakEvenMembers === null
                      ? "neutral"
                      : atOrAboveBreakEven
                        ? "good"
                        : "bad"
                  }
                />
              </Card>
            </div>

            <Card>
              <Stat
                value={`${r.effectiveStorageGb.toFixed(1)} GB`}
                label="Image storage pressure / year (with backups)"
              />
              <p className="coop-hint mt-2">
                Photos are stored as base64 text in PostgreSQL, so they inflate
                about a third, and backups roughly double the footprint.
              </p>
            </Card>

            <Card
              className={cn({
                "bg-(--coop-good-soft)": sustainable,
                "bg-(--coop-bad-soft)": !sustainable,
              })}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                    sustainable ? "bg-(--coop-good)" : "bg-(--coop-bad)",
                  )}
                  aria-hidden="true"
                >
                  {sustainable ? "✓" : "✕"}
                </span>
                <p
                  className={cn("text-sm font-medium", {
                    "text-(--coop-good)": sustainable,
                    "text-(--coop-bad)": !sustainable,
                  })}
                >
                  {r.breakEvenMembers === null
                    ? "Break-even members cannot be calculated with free dues."
                    : sustainable
                      ? "At this level, dues cover Bridger's running costs."
                      : "At this level, dues do not yet cover Bridger's running costs."}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Where the money goes (same container) */}
        <div className="mt-8 border-t border-(--coop-line) pt-6">
          <h3 className="text-base font-bold">Where the money goes</h3>
          <p className="mt-1 text-sm text-(--coop-ink-soft)">
            Estimated annual costs of {usd(r.annualCosts)} for{" "}
            {sim.members.toLocaleString()} members
            {salaryTotal > 0 ? ", including the team you chose to pay" : ""}.
            The server, domain, Mapbox, and storage are the real first-version
            costs; payments and future features are only counted when turned on.
          </p>
          {slices.length > 0 ? (
            <div className="mt-5">
              <DonutChart
                slices={slices}
                centerValue={usd(r.annualCosts)}
                centerLabel="per year"
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-(--coop-ink-faint)">
              No costs are turned on yet.
            </p>
          )}

          <details className="coop-disclosure mt-5">
            <summary className="coop-disclosure-summary">
              See every line in the breakdown
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
              {breakdown.map((line) => (
                <div
                  key={line.label}
                  className="flex items-baseline justify-between gap-4 border-b border-(--coop-line) py-1.5"
                >
                  <span className="flex items-baseline gap-1.5 text-sm text-(--coop-ink-soft)">
                    {line.label}
                    {line.note && (
                      <span className="coop-hint text-xs">{line.note}</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-(--coop-ink) tabular-nums">
                    {usd(line.value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </Card>

      <div id="roles" className="mt-10 scroll-mt-24">
        <SectionTitle
          title="Roles that keep Bridger running"
          subtitle="Every role represents real work. Today they are all volunteer. Use the simulator above to model what funding any of them would cost."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roles?.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        <Card className="mt-8">
          <h2 className="text-xl font-bold">Work Does Not Disappear</h2>
          <div className="coop-prose mt-3 max-w-2xl">
            <p>
              Every responsibility required to run Bridger must be funded,
              volunteered, or left undone.
            </p>
            <p>
              If there is not enough revenue to fund development, development
              slows. If there is not enough revenue to fund moderation,
              moderation depends on volunteers. If there is not enough revenue
              to fund marketing, growth depends on unpaid effort.
            </p>
            <p>
              The purpose of the Cost tab is to make those tradeoffs visible so
              the community can understand what sustainability requires.
            </p>
          </div>

          <div className="mt-8 border-t border-(--coop-line) pt-8">
            <h2 className="text-xl font-bold">
              How Paid Work Will Be Evaluated
            </h2>
            <div className="coop-prose mt-3 max-w-2xl">
              <p>
                Volunteer contributions are deeply appreciated, but
                participation does not automatically create employment,
                compensation, equity, or a leadership position.
              </p>
              <p>
                As Bridger grows, paid work may become possible. Compensation
                decisions should be based on organizational need, available
                resources, responsibility, expertise, time commitment, and the
                role required to keep the platform healthy.
              </p>
              <p>This is not about popularity. It is about sustainability.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
