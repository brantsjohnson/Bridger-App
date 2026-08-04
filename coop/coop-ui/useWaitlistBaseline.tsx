/* eslint-disable react-refresh/only-export-components -- this module intentionally colocates the waitlist hook with its small presentational hint */
import { useEffect, useRef, useState } from "react"

import { useDues } from "../../lib/api/coop"

/** Keeps a slider/input tied to the live waitlist count from the API. */
export function useWaitlistBaseline() {
  const { data, isLoading, isFetching } = useDues()
  const waitlistCount = data?.waitlistCount ?? 0
  const baseline = waitlistCount > 0 ? waitlistCount : 1
  const [value, setValueState] = useState<number | null>(null)
  const userAdjusted = useRef(false)

  // Sync from API until the member moves the slider themselves.
  useEffect(() => {
    if (isLoading || !data || userAdjusted.current) return
    setValueState(baseline)
  }, [data, baseline, isLoading])

  const setValue = (next: number) => {
    userAdjusted.current = true
    setValueState(next)
  }

  const resetToWaitlist = () => {
    userAdjusted.current = false
    setValueState(baseline)
  }

  const connected = waitlistCount > 0
  const min = connected ? waitlistCount : 1
  const displayValue = value ?? baseline
  const divergedFromWaitlist = connected && displayValue !== waitlistCount

  return {
    data,
    waitlistCount,
    baseline,
    value: displayValue,
    setValue,
    resetToWaitlist,
    connected,
    divergedFromWaitlist,
    min,
    isLoading: isLoading || isFetching,
  }
}

export function WaitlistSliderHint({
  waitlistCount,
  connected,
  divergedFromWaitlist,
  onReset,
}: {
  waitlistCount: number
  connected: boolean
  divergedFromWaitlist: boolean
  onReset: () => void
}) {
  return (
    <>
      <p className="coop-hint mt-1">
        {connected ? (
          <>
            Live waitlist:{" "}
            <span className="font-semibold text-(--coop-ink)">
              {waitlistCount.toLocaleString()}
            </span>
            . This slider starts there. Drag or type to model growth beyond
            today&apos;s signups.
          </>
        ) : (
          <>
            Live waitlist count is not connected yet (showing{" "}
            {waitlistCount.toLocaleString()} from this database). Set{" "}
            <code className="text-xs">WAITLIST_READ_URL</code> on the server to
            pull the real signup total from production.
          </>
        )}
      </p>
      {divergedFromWaitlist && (
        <button type="button" className="coop-link-btn mt-1" onClick={onReset}>
          Reset to waitlist ({waitlistCount.toLocaleString()})
        </button>
      )}
    </>
  )
}
