import { useEffect, useState } from "react"

import { cn } from "../../lib/cn"
import { formatCoopNumber, parseCoopNumber } from "../../lib/coop-math/formatNumber"

interface CoopNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function CoopNumberInput({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  className,
  id,
  disabled,
  placeholder,
}: CoopNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clears local draft when the controlled value changes
    setDraft(null)
  }, [value])

  const commit = () => {
    if (draft === null) return
    const parsed = parseCoopNumber(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(null)
      return
    }
    onChange(clamp(parsed, min, max))
    setDraft(null)
  }

  return (
    <input
      type="text"
      inputMode={step < 1 ? "decimal" : "numeric"}
      id={id}
      disabled={disabled}
      placeholder={placeholder}
      className={cn("coop-input text-right tabular-nums", className)}
      value={draft ?? formatCoopNumber(value, step)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
      }}
    />
  )
}
