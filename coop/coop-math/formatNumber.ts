export function formatCoopNumber(n: number, step = 1): string {
  if (step < 1) {
    const decimals = String(step).split(".")[1]?.length ?? 1
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
  }
  return Math.round(n).toLocaleString()
}

export function parseCoopNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim()
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN
  return Number(cleaned)
}
