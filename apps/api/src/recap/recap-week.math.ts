// ============================================
// WHAT THIS FILE DOES (plain English):
// The rules for building one Friend Pod week without a person in admin.
// Every auto week starts with rose (something good), thorn (something that
// sucked), and bud (something they are looking forward to). The last two
// slots are the most-voted unused suggestions. Empty slots get a short
// weekly fill-in. AI may write those fill-ins; this file also has a canned
// bank so the week still locks if the model is off.
// ============================================
import type { RecapQuestionSource } from '@bridger/shared';

export const RECAP_QUESTION_COUNT = 5;
export const VOTED_SLOT_COUNT = 2;

/** The three weekly check-in prompts that always lead an auto week. */
export const ROSE_THORN_BUD: readonly string[] = [
  'Your rose: something good that happened',
  'Your thorn: something that sucked',
  'Your bud: something you are looking forward to'
];

/**
 * Backup weekly prompts when votes and AI both come up short.
 * Rotated by week so two Mondays in a row do not feel identical.
 */
export const RECAP_FILL_BANK: readonly string[] = [
  'What is your favorite thing that happened this week?',
  'What is one small win from this week?',
  'Who did you spend time with?',
  'What made you laugh this week?',
  'What are you stuck on?',
  'Best thing you ate?',
  'What did you learn this week?',
  'What would you redo if you could?'
];

/** One prompt we are about to save on a week. */
export type DraftRecapQuestion = {
  text: string;
  source: RecapQuestionSource;
  authorId?: string;
  submittedId?: string;
};

export type SubmittedPick = {
  id: string;
  text: string;
  authorId: string;
  votes: number;
  used?: boolean;
};

// THIS SECTION DOES: find this week's Monday in UTC (Friend Pod resets then).
export function mondayUtc(d: Date): string {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

// THIS SECTION DOES: turn that Monday into the label people see.
export function weekOfLabel(mondayYmd: string): string {
  const d = new Date(`${mondayYmd}T00:00:00.000Z`);
  const day = d.getUTCDate();
  const mon = MONTH_SHORT[d.getUTCMonth()] ?? 'Jan';
  return `Week of ${day} ${mon}`;
}

// THIS SECTION DOES: a number we can rotate the fill-in bank with.
export function isoWeekIndex(mondayYmd: string): number {
  const t = Date.parse(`${mondayYmd}T00:00:00.000Z`);
  if (!Number.isFinite(t)) return 0;
  return Math.floor(t / (7 * 24 * 60 * 60 * 1000));
}

/** Free Lite hears this week only. Co-op can open an older locked week. */
export function canListenPastWeek(isCoop: boolean, isCurrent: boolean): boolean {
  return isCurrent || isCoop;
}

// THIS SECTION DOES: decide if the live week is from an older Monday.
export function needsRollover(
  activeWeekStart: string | null | undefined,
  thisMonday: string
): boolean {
  if (!activeWeekStart) return true;
  return activeWeekStart < thisMonday;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// THIS SECTION DOES: take the unused suggestions with the most votes.
export function pickTopVoted(
  submitted: SubmittedPick[],
  take: number,
  already: string[] = []
): DraftRecapQuestion[] {
  const usedNorm = new Set(already.map(normalize).filter(Boolean));
  const ranked = [...submitted]
    .filter((q) => !q.used && q.text.trim())
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.text.localeCompare(b.text);
    });

  const out: DraftRecapQuestion[] = [];
  for (const q of ranked) {
    if (out.length >= take) break;
    const text = q.text.trim();
    const key = normalize(text);
    if (!key || usedNorm.has(key)) continue;
    usedNorm.add(key);
    out.push({
      text,
      source: 'submitted',
      authorId: q.authorId,
      submittedId: q.id
    });
  }
  return out;
}

// THIS SECTION DOES: pull leftover slots from the canned weekly bank.
export function fillFromBank(
  already: string[],
  need: number,
  weekIndex: number
): DraftRecapQuestion[] {
  if (need <= 0) return [];
  const usedNorm = new Set(already.map(normalize).filter(Boolean));
  const start = ((weekIndex % RECAP_FILL_BANK.length) + RECAP_FILL_BANK.length) %
    RECAP_FILL_BANK.length;
  const out: DraftRecapQuestion[] = [];
  for (let i = 0; i < RECAP_FILL_BANK.length && out.length < need; i += 1) {
    const text = RECAP_FILL_BANK[(start + i) % RECAP_FILL_BANK.length];
    if (!text) continue;
    const key = normalize(text);
    if (usedNorm.has(key)) continue;
    usedNorm.add(key);
    out.push({ text, source: 'builtin' });
  }
  return out;
}

// THIS SECTION DOES: turn model fill-ins into slots, skipping copies.
export function takeAiFills(
  candidates: string[],
  already: string[],
  need: number
): DraftRecapQuestion[] {
  if (need <= 0) return [];
  const usedNorm = new Set(already.map(normalize).filter(Boolean));
  const out: DraftRecapQuestion[] = [];
  for (const raw of candidates) {
    if (out.length >= need) break;
    const text = (raw ?? '').trim();
    const key = normalize(text);
    if (!key || text.length > 120 || usedNorm.has(key)) continue;
    usedNorm.add(key);
    out.push({ text, source: 'ai' });
  }
  return out;
}

/**
 * Build the five auto-week prompts.
 * Order: rose, thorn, bud, then voted extras, then AI / bank fill-ins.
 */
export function composeAutoWeek(input: {
  submitted: SubmittedPick[];
  aiFills?: string[];
  weekIndex: number;
}): DraftRecapQuestion[] {
  const spine: DraftRecapQuestion[] = ROSE_THORN_BUD.map((text) => ({
    text,
    source: 'builtin' as const
  }));
  const voted = pickTopVoted(
    input.submitted,
    VOTED_SLOT_COUNT,
    spine.map((q) => q.text)
  );
  const taken = [...spine, ...voted];
  const need = RECAP_QUESTION_COUNT - taken.length;
  const fromAi = takeAiFills(
    input.aiFills ?? [],
    taken.map((q) => q.text),
    need
  );
  const fromBank = fillFromBank(
    [...taken, ...fromAi].map((q) => q.text),
    need - fromAi.length,
    input.weekIndex
  );
  return [...taken, ...fromAi, ...fromBank].slice(0, RECAP_QUESTION_COUNT);
}
