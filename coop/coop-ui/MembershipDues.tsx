import { useEffect, useMemo, useState } from "react"

import { useDues, useVoteDues } from "../../lib/api/coop"
import { cn } from "../../lib/cn"
import {
  computeCosts,
  DEFAULT_ANNUAL_DUES,
  DEFAULT_COST_INPUTS,
} from "../../lib/coop-math/costModel"
import { formatCoopNumber } from "../../lib/coop-math/formatNumber"
import { useCoopAuth } from "./CoopAuth"
import { CoopSlider } from "./CoopSlider"
import { CostCalculationDetails } from "./CostCalculationDetails"
import { ScalableMemberSlider } from "./ScalableMemberSlider"
import { Card, CoopButton, InfoTip } from "./ui"
import { useWaitlistBaseline, WaitlistSliderHint } from "./useWaitlistBaseline"

const usd = (n: number) => "$" + Math.round(n).toLocaleString()

export function MembershipDues() {
  const { data } = useDues()
  const { requireSignIn } = useCoopAuth()
  const vote = useVoteDues()
  const [voteInput, setVoteInput] = useState("")
  const [payingPercent, setPayingPercent] = useState(5)
  const [simDues, setSimDues] = useState(DEFAULT_ANNUAL_DUES)
  const waitlist = useWaitlistBaseline()

  useEffect(() => {
    if (!data) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the vote field from fetched data
    setVoteInput(data.viewerAmount !== null ? String(data.viewerAmount) : "")
  }, [data?.viewerAmount, data])

  const members = waitlist.value
  const annualDues = simDues

  const costInputs = useMemo(
    () => ({ ...DEFAULT_COST_INPUTS, members, annualDues }),
    [members, annualDues],
  )
  const model = useMemo(() => computeCosts(costInputs), [costInputs])
  const annualCosts = model.annualCosts

  const payingMembers = Math.round((members * payingPercent) / 100)
  const annualRevenue = payingMembers * model.netDuesPerMember
  const netPosition = annualRevenue - annualCosts
  const breakEvenDues =
    payingMembers > 0 ? Math.ceil(annualCosts / payingMembers) : null

  const parsedVote = Number(voteInput)
  const voteValid =
    voteInput.trim() !== "" &&
    Number.isFinite(parsedVote) &&
    parsedVote >= 0 &&
    parsedVote <= 500
  const alreadyVotedThis =
    data?.viewerAmount !== null && data?.viewerAmount === parsedVote

  if (!data) {
    return (
      <Card>
        <p className="text-(--coop-ink-faint)">Loading membership dues…</p>
      </Card>
    )
  }

  const submitVote = () => {
    if (!voteValid) return
    requireSignIn(() => vote.mutate(parsedVote))
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">What should membership dues be?</h2>
      <p className="mt-2 max-w-2xl text-(--coop-ink-soft)">
        Our goal is not to be a profit hoarder but to make sure it is
        sustainable so we can have a healthy social alternative.
      </p>

      <div className="mt-5">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="coop-stat-value">{usd(annualCosts)}</div>
            <InfoTip wide label="How annual operating costs are calculated">
              <CostCalculationDetails inputs={costInputs} result={model} />
            </InfoTip>
          </div>
          <div className="coop-stat-label">Annual operating costs</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <ScalableMemberSlider
          label="People on the waitlist"
          value={members}
          min={waitlist.min}
          onChange={waitlist.setValue}
          hint={
            <WaitlistSliderHint
              waitlistCount={waitlist.waitlistCount}
              connected={waitlist.connected}
              divergedFromWaitlist={waitlist.divergedFromWaitlist}
              onReset={waitlist.resetToWaitlist}
            />
          }
        />

        <div>
          <CoopSlider
            label="Percent who pay dues"
            value={payingPercent}
            onChange={setPayingPercent}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />
          {payingPercent > 5 && (
            <Card className="mt-3 bg-(--coop-warn-soft)">
              <p className="text-sm text-(--coop-ink)">
                FYI: Not to be a buzz kill, but statistically it is hard to get
                more than about 5% of users to pay for a social platform.
                Bridger is different because it is a co-op, so we hope the share
                is higher, but time will tell.
              </p>
            </Card>
          )}
        </div>

        <CoopSlider
          label="Annual dues"
          value={annualDues}
          onChange={setSimDues}
          min={0}
          max={100}
          step={1}
          prefix="$"
          suffix="/yr"
        />
      </div>

      <div className="mt-6 border-t border-(--coop-line) pt-6">
        <Card
          className={cn({
            "bg-(--coop-good-soft)": netPosition >= 0,
            "bg-(--coop-accent-soft)": netPosition < 0,
          })}
        >
          <p className="text-sm text-(--coop-ink)">
            At <span className="font-bold">{usd(annualDues)}/yr</span>, about{" "}
            <span className="font-bold">{payingMembers.toLocaleString()}</span>{" "}
            paying members would bring in{" "}
            <span className="font-bold">{usd(annualRevenue)}</span> per year
            against <span className="font-bold">{usd(annualCosts)}</span> in
            operating costs.
          </p>
          <p className="mt-2 text-sm text-(--coop-ink)">
            {breakEvenDues === null
              ? "Break-even cannot be calculated without paying members."
              : netPosition >= 0
                ? "At this dues level, revenue covers Bridger's running costs."
                : `To break even at this scale, annual dues would need to be about ${usd(breakEvenDues)}/yr per paying member.`}
          </p>
        </Card>

        <div className="mt-6">
          <label
            htmlFor="dues-vote"
            className="text-sm font-semibold text-(--coop-ink-soft)"
          >
            How much do you think annual dues should be?
          </label>
          <div className="mt-2">
            <div className="coop-input-affix w-fit">
              <span className="coop-input-affix-prefix">$</span>
              <input
                id="dues-vote"
                type="text"
                inputMode="numeric"
                className="coop-input w-24 text-right tabular-nums"
                placeholder="30"
                value={
                  voteInput === ""
                    ? ""
                    : Number.isFinite(Number(voteInput.replace(/,/g, "")))
                      ? formatCoopNumber(Number(voteInput.replace(/,/g, "")), 1)
                      : voteInput
                }
                onChange={(e) => setVoteInput(e.target.value.replace(/,/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitVote()
                }}
              />
              <span className="coop-input-affix-suffix">/yr</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CoopButton
            variant="primary"
            disabled={vote.isPending || !voteValid || alreadyVotedThis}
            onClick={submitVote}
          >
            {vote.isPending
              ? "Submitting…"
              : alreadyVotedThis
                ? `Your vote: ${usd(parsedVote)}/yr`
                : voteValid
                  ? `Submit ${usd(parsedVote)}/yr`
                  : "Submit your vote"}
          </CoopButton>
          {data.viewerAmount !== null && !alreadyVotedThis && voteValid && (
            <span className="coop-hint">
              You currently vote {usd(data.viewerAmount)}/yr. Submitting will
              change it.
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
