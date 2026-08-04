// Lightweight, dependency-free SVG/CSS charts kept intentionally calm:
// muted palette, few colors, clear labels.

import { InfoLink } from "./ui"

export interface BarDatum {
  label: string
  value: number
  highlight?: boolean
  /** Optional external link (e.g. the org's real governance docs). */
  href?: string
  /** Hover description shown in the info popover. */
  linkTitle?: string
}

export function HBarChart({
  data,
  max,
  unit = "",
}: {
  data: BarDatum[]
  max: number
  unit?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        const pct = max > 0 ? Math.min(100, (d.value / max) * 100) : 0
        return (
          <div key={d.label} className="flex items-center gap-3">
            <div className="flex w-36 shrink-0 items-center gap-1.5 text-sm text-(--coop-ink-soft)">
              <span>{d.label}</span>
              {d.href && d.linkTitle && (
                <InfoLink
                  href={d.href}
                  label={`More about ${d.label} governance`}
                >
                  <p>{d.linkTitle}</p>
                </InfoLink>
              )}
            </div>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-(--coop-line)">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  background: d.highlight ? "var(--coop-accent)" : "#b9c4d6",
                }}
              />
            </div>
            <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
              {d.value}
              {unit}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface Slice {
  label: string
  value: number
  color: string
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: Slice[]
  centerLabel?: string
  centerValue?: string
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1
  const radius = 70
  const circumference = 2 * Math.PI * radius

  // Precompute each slice's dash length and starting offset (prefix sum) so we
  // never mutate a variable during render.
  const dashes = slices.map((s) => (s.value / total) * circumference)
  const arcs = slices.map((slice, i) => ({
    slice,
    dash: dashes[i],
    offset: dashes.slice(0, i).reduce((a, b) => a + b, 0),
  }))

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        className="shrink-0"
        role="img"
        aria-label="Cost breakdown"
      >
        <g transform="translate(90,90) rotate(-90)">
          <circle
            r={radius}
            fill="none"
            stroke="var(--coop-line)"
            strokeWidth="22"
          />
          {arcs.map(({ slice, dash, offset }) => (
            <circle
              key={slice.label}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          ))}
        </g>
        {centerValue && (
          <text
            x="90"
            y="86"
            textAnchor="middle"
            className="fill-(--coop-ink)"
            style={{ fontSize: 20, fontWeight: 700 }}
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x="90"
            y="104"
            textAnchor="middle"
            className="fill-(--coop-ink-faint)"
            style={{ fontSize: 11 }}
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="flex min-w-[180px] flex-1 flex-col gap-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="inline-block size-3 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-(--coop-ink-soft)">{s.label}</span>
            <span className="font-semibold tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
