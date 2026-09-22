// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns matchable facts into the text we embed for matching.
// We keep the meaning (their words, a hobby follow-up, a quiz dial number).
// We do not swap that meaning for an explicit identity label
// (a type name, a belief category, a condition).
// A name they chose ("Jazz", "Lisbon") stays, because that name is the fact.
// ============================================

export interface AttributeForEmbed {
  key: string;
  value: unknown;
}

/** One fact, as a single line. Empty when there is no meaning to keep. */
export function normalizeAttribute(attr: AttributeForEmbed): string {
  const meaning = meaningToText(attr.key, attr.value);
  if (!meaning) return '';
  return `${attr.key}: ${meaning}`;
}

/** Join many facts into one person document for the embedding job. */
export function normalizePersonCorpus(attrs: AttributeForEmbed[]): string {
  return attrs
    .map(normalizeAttribute)
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

// THIS SECTION DOES: pull the meaning out of one stored value.
function meaningToText(key: string, value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return cleanString(value);
  if (typeof value === 'number' && Number.isFinite(value)) return formatDial(value);
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) {
    return value
      .map((item) => meaningToText(key, item))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return objectMeaning(key, value as Record<string, unknown>);
  }
  return '';
}

// THIS SECTION DOES: read an object fact without turning it into a category stamp.
function objectMeaning(key: string, obj: Record<string, unknown>): string {
  // Quiz rows store a display name ("Sociability") next to the real signal (the score).
  // Embed the number. Drop the display name so every taker is not the same label.
  if (key.startsWith('quiz.')) {
    return quizDialText(obj);
  }

  const parts: string[] = [];
  const named =
    cleanString(obj.label) || cleanString(obj.group) || cleanString(obj.key);

  // The name they picked stays. Extra sentences they wrote stay with it.
  if (named) parts.push(named);
  pushUnique(parts, cleanString(obj.text));
  pushUnique(parts, cleanString(obj.answer));
  pushUnique(parts, cleanString(obj.note));
  if (typeof obj.value === 'string') pushUnique(parts, cleanString(obj.value));
  pushUnique(parts, cleanString(obj.title));
  pushUnique(parts, cleanString(obj.artist) || cleanString(obj.author));
  pushUnique(parts, followUpAnswer(obj.followUp));

  if (Array.isArray(obj.items)) {
    const items = obj.items
      .map((item) => meaningToText(key, item))
      .filter(Boolean);
    if (items.length) pushUnique(parts, items.join(', '));
  }

  // This-or-that: keep the option they picked. Do not rename it as a personality type.
  pushUnique(parts, thisOrThatPick(obj));

  if (parts.length) return parts.join(' - ');

  // Last pass: leftover words and dials. Skip pictures, ids, and map coordinates.
  const leftovers: string[] = [];
  for (const [field, raw] of Object.entries(obj)) {
    if (SKIP_FIELDS.has(field)) continue;
    if (typeof raw === 'string') pushUnique(leftovers, cleanString(raw));
    else if (typeof raw === 'number' && Number.isFinite(raw)) {
      leftovers.push(`${field} ${formatDial(raw)}`);
    }
  }
  return leftovers.join(' - ');
}

// THIS SECTION DOES: turn a private quiz dial into score text, never its title.
function quizDialText(obj: Record<string, unknown>): string {
  if (typeof obj.score !== 'number' || !Number.isFinite(obj.score)) return '';
  const score = formatDial(obj.score);
  if (typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)) {
    return `${score} confidence ${formatDial(obj.confidence)}`;
  }
  return score;
}

// THIS SECTION DOES: say which this-or-that side they chose, in their words.
function thisOrThatPick(obj: Record<string, unknown>): string {
  if (obj.pick !== 'a' && obj.pick !== 'b' && obj.pick !== 'both') return '';
  const a = cleanString(obj.a);
  const b = cleanString(obj.b);
  if (obj.pick === 'both') return [a, b].filter(Boolean).join(' and ');
  return obj.pick === 'a' ? a : b;
}

// THIS SECTION DOES: keep a hobby follow-up answer, skip the blank placeholder.
function followUpAnswer(followUp: unknown): string {
  if (!followUp || typeof followUp !== 'object') return '';
  return cleanString((followUp as Record<string, unknown>).answer);
}

function pushUnique(parts: string[], bit: string): void {
  if (!bit || parts.includes(bit)) return;
  parts.push(bit);
}

function cleanString(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || text === '—' || text === '-' || text === '–') return '';
  return text;
}

function formatDial(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Chrome and precise location. Not meaning, and not safe to embed. */
const SKIP_FIELDS = new Set([
  'id',
  'emoji',
  'accent',
  'shape',
  'tier',
  'icon',
  'quizId',
  'label',
  'followUp',
  'lat',
  'lng',
  'latitude',
  'longitude',
  'countryCode',
  'artworkUrl',
  'previewUrl',
  'spotifyId',
  'spotifyUri',
  'pickId',
  'artwork_url',
  'preview_url',
  'total',
  'visibleToTier'
]);
