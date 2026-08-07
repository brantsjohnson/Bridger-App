// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns a matchable attribute row into one clean line of text we can embed,
// like: hobby: bouldering — 'started during lockdown, V4'.
// ============================================

export interface AttributeForEmbed {
  key: string;
  value: unknown;
}

/** Build canonical embed text for one attribute. */
export function normalizeAttribute(attr: AttributeForEmbed): string {
  const valueText = valueToText(attr.value);
  if (!valueText) return `${attr.key}`;
  return `${attr.key} — ${valueText}`;
}

/** Join many attributes into one person-level document. */
export function normalizePersonCorpus(attrs: AttributeForEmbed[]): string {
  return attrs
    .map(normalizeAttribute)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

function valueToText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Common shapes: { label }, { text }, { name } — but never prefer raw name for PII;
    // these are attribute labels the user typed as facts.
    if (typeof obj.label === 'string') return obj.label.trim();
    if (typeof obj.text === 'string') return obj.text.trim();
    if (typeof obj.value === 'string') return obj.value.trim();
    if (typeof obj.title === 'string') return obj.title.trim();
    try {
      return JSON.stringify(obj);
    } catch {
      return '';
    }
  }
  return '';
}
