import { useEffect, useState, type ReactNode } from "react"

import { cn } from "../../lib/cn"
import { formatCoopNumber, parseCoopNumber } from "../../lib/coop-math/formatNumber"

export interface CoopSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  sliderStep?: number
  prefix?: string
  suffix?: string
  hint?: ReactNode
  /** Slider track max (input can go higher when set). */
  sliderMax?: number
  inputMin?: number
  inputMax?: number
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function roundToStep(n: number, step: number) {
  if (step >= 1) return Math.round(n)
  const decimals = String(step).split(".")[1]?.length ?? 0
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

export function CoopSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  sliderStep,
  prefix,
  suffix,
  hint,
  sliderMax,
  inputMin,
  inputMax,
}: CoopSliderProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const trackMax = sliderMax ?? max
  const effectiveInputMin = inputMin ?? min
  const effectiveInputMax = inputMax ?? max
  const trackStep = sliderStep ?? step
  const sliderValue = clamp(Math.min(value, trackMax), min, trackMax)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clears local draft when the controlled value changes
    setDraft(null)
  }, [value])

  const commitDraft = () => {
    if (draft === null) return
    const parsed = parseCoopNumber(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(null)
      return
    }
    onChange(
      roundToStep(clamp(parsed, effectiveInputMin, effectiveInputMax), step),
    )
    setDraft(null)
  }

  const displayValue = draft ?? formatCoopNumber(value, step)
  const inputMode = step < 1 ? "decimal" : "numeric"

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-(--coop-ink-soft)">
          {label}
        </label>
        <div className="flex shrink-0 items-center">
          {(prefix || suffix) && (
            <div className="coop-input-affix">
              {prefix && (
                <span className="coop-input-affix-prefix">{prefix}</span>
              )}
              <input
                type="text"
                inputMode={inputMode}
                className={cn(
                  "coop-input coop-slider-input text-right tabular-nums",
                  { "min-w-24": !prefix && !suffix },
                )}
                value={displayValue}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur()
                }}
                aria-label={label}
              />
              {suffix && (
                <span className="coop-input-affix-suffix">{suffix}</span>
              )}
            </div>
          )}
          {!prefix && !suffix && (
            <input
              type="text"
              inputMode={inputMode}
              className={cn(
                "coop-input coop-slider-input min-w-24 text-right tabular-nums",
              )}
              value={displayValue}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur()
              }}
              aria-label={label}
            />
          )}
        </div>
      </div>
      <input
        type="range"
        className="coop-range"
        min={min}
        max={trackMax}
        step={trackStep}
        value={sliderValue}
        onChange={(e) => {
          setDraft(null)
          onChange(Number(e.target.value))
        }}
      />
      {hint}
    </div>
  )
}
