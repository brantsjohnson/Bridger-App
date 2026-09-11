// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny, safe helpers for turning raw attribute rows from the API into clean
// lists the Profile modules (Favorites, Top 5, Obsession, Places,
// This-or-that) can render. The API sometimes hands back a row whose `value`
// is missing (null/undefined) when a write was partial. These helpers drop
// those empty rows so opening a Profile module never crashes on a null.
// (Mirrors the same null-guards About/hobbies already do inline.)
// ============================================

/** The one shape every attribute loader gets back: a row wrapping a value. */
type ValueRow<T> = { value: T | null | undefined };

// --- COMPACT: drop rows with no value so the list is all real items ---
/**
 * Keep only the rows that actually carry a value.
 * (Filters out null/undefined `value` and narrows the type to T.)
 */
export function compactValues<T>(rows: ValueRow<T>[]): T[] {
  return rows.map((r) => r.value).filter((v): v is T => v != null);
}

// --- COMPACT + ORDER: same, then put them in their saved display order ---
/**
 * Drop empty rows first, then sort what is left by each item's `order`.
 * The empty-row filter must run BEFORE the sort so the comparator never reads
 * `.order` off a null (that null read is what crashed Top 5 / Obsession).
 */
export function compactSortedByOrder<T extends { order: number }>(
  rows: ValueRow<T>[]
): T[] {
  return compactValues(rows).sort((a, b) => a.order - b.order);
}
