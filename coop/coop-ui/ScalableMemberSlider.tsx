import type { ReactNode } from "react"

import { CoopSlider } from "./CoopSlider"

/** Slider stops here; members above this are typed into the number field. */
export const MEMBERS_SLIDER_MAX = 100_000

interface ScalableMemberSliderProps {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
  hint?: ReactNode
  /** Upper bound for typed values. Defaults to 10 million. */
  inputMax?: number
}

export function ScalableMemberSlider({
  label,
  value,
  min,
  onChange,
  hint,
  inputMax = 10_000_000,
}: ScalableMemberSliderProps) {
  return (
    <CoopSlider
      label={label}
      value={value}
      onChange={onChange}
      min={min}
      max={inputMax}
      sliderMax={MEMBERS_SLIDER_MAX}
      step={1}
      sliderStep={100}
      hint={hint}
    />
  )
}
