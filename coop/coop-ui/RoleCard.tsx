import type { Role } from "../../lib/api/coop"
import { ROLE_STATUS_LABELS } from "./labels"
import { Badge, Card } from "./ui"

function weeklyFromMonthly(monthlyHours: number) {
  return Math.round((monthlyHours / 4.33) * 10) / 10
}

function weeklyHoursLabel(role: Role): string | null {
  const { estimatedMinWeeklyHours: min, estimatedMaxWeeklyHours: max } = role
  if (min != null && max != null) return `${min}–${max} hrs / week`
  if (max != null) return `up to ${max} hrs / week`
  if (role.estimatedMonthlyHours != null) {
    return `~${weeklyFromMonthly(role.estimatedMonthlyHours)} hrs / week`
  }
  return null
}

export function RoleCard({ role }: { role: Role }) {
  const status = ROLE_STATUS_LABELS[role.status] ?? {
    label: role.status,
    tone: "neutral" as const,
  }
  const hoursLabel = weeklyHoursLabel(role)

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold">{role.title}</h3>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="mt-1 flex-1 text-sm text-(--coop-ink-soft)">
        {role.summary}
      </p>
      {hoursLabel != null && (
        <p className="mt-2 text-xs text-(--coop-ink-faint)">
          {hoursLabel} (varies week to week)
        </p>
      )}
      <details className="coop-disclosure mt-3">
        <summary className="coop-disclosure-summary">Responsibilities</summary>
        <ul className="mt-2 list-inside list-disc text-sm text-(--coop-ink-soft)">
          {role.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {role.risks.length > 0 && (
          <div className="mt-3">
            <p className="coop-hint mb-1">Risks carried by this role:</p>
            <div className="flex flex-wrap gap-1.5">
              {role.risks.map((r) => (
                <Badge key={r} tone="limited">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </details>
    </Card>
  )
}
