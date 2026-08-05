// ============================================
// WHAT THIS FILE DOES (plain English):
// Pure math for quiz scoring. You hand it the weight maps from every option
// the person picked; it sums them per dimension and scales the totals into
// 0-1. No database, no AI: same inputs always give the same scores.
// ============================================

/**
 * Sum selected option weight maps, then normalize each dimension to 0-1.
 * PRIVACY / INTEGRITY: this is the only path that sets scores. The AI
 * moderator must never call this with invented numbers.
 */
export function scoreFromWeights(
  selectedWeights: Record<string, number>[]
): Record<string, number> {
  const sums: Record<string, number> = {};

  for (const weights of selectedWeights) {
    for (const [key, value] of Object.entries(weights)) {
      if (typeof value !== 'number' || Number.isNaN(value)) continue;
      sums[key] = (sums[key] ?? 0) + value;
    }
  }

  const keys = Object.keys(sums);
  if (keys.length === 0) return {};

  // Scale so the strongest dimension lands at 1 (or 0 when everything is zero).
  const maxAbs = Math.max(
    ...keys.map((k) => Math.abs(sums[k] ?? 0)),
    0
  );
  if (maxAbs === 0) {
    return Object.fromEntries(keys.map((k) => [k, 0]));
  }

  const normalized: Record<string, number> = {};
  for (const key of keys) {
    const raw = (sums[key] ?? 0) / maxAbs;
    normalized[key] = Math.max(0, Math.min(1, raw));
  }
  return normalized;
}

/**
 * Pick the option label with the highest total weight magnitude across
 * selections. Used for fun quizzes that have no named dimensions.
 */
export function topOptionLabel(
  selections: Array<{ label: string; weights: Record<string, number> }>
): string | undefined {
  const first = selections[0];
  if (!first) return undefined;

  let bestLabel = first.label;
  let bestScore = -Infinity;

  for (const sel of selections) {
    const magnitude = Object.values(sel.weights).reduce(
      (acc, v) => acc + Math.abs(v),
      0
    );
    if (magnitude > bestScore) {
      bestScore = magnitude;
      bestLabel = sel.label;
    }
  }

  return bestLabel;
}

/** Dimension key with the highest normalized score (for who-got-who grouping). */
export function topDimensionKey(
  scores: Record<string, number>
): string | undefined {
  const entries = Object.entries(scores);
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top?.[0];
}
