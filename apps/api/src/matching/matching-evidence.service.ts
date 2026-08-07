// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the short "why" titles on a suggestion card — only from
// Everyone+matchable overlaps (things a stranger is allowed to see).
// ============================================
import { Injectable } from '@nestjs/common';
import type { MatchingEvidenceItem } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingIdfService } from './matching-idf.service';

@Injectable()
export class MatchingEvidenceService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly idf: MatchingIdfService
  ) {}

  async buildEvidence(
    viewerId: string,
    candidateId: string,
    sharedQuizIds: string[]
  ): Promise<MatchingEvidenceItem[]> {
    const items: Array<MatchingEvidenceItem & { w: number }> = [];

    const { data } = await this.supabase.admin
      .from('attributes')
      .select('owner_id, key, value, layer')
      .in('owner_id', [viewerId, candidateId])
      .eq('matchable', true)
      .eq('visible_to_tier', 'acquaintance');

    const aMap = new Map<string, { label: string; layer: string; key: string }>();
    const bSet = new Set<string>();
    for (const row of data ?? []) {
      const label = labelOf(row.key, row.value);
      const fp = `${row.key}::${label}`;
      if (row.owner_id === viewerId) {
        aMap.set(fp, { label, layer: row.layer, key: row.key });
      } else {
        bSet.add(fp);
      }
    }

    for (const [fp, meta] of aMap) {
      if (!bSet.has(fp)) continue;
      const w = await this.idf.weightForKey(meta.key);
      items.push({
        kind: kindFromLayer(meta.layer),
        title: titleFor(meta.label),
        w
      });
    }

    items.sort((x, y) => y.w - x.w);
    const out = items.slice(0, 3).map(({ kind, title }) => ({ kind, title }));

    // Quiz arm can satisfy the evidence gate without a visible title; optional chip.
    if (sharedQuizIds.length && out.length < 3) {
      out.push({
        kind: 'quiz',
        title: 'You took the same quiz'
      });
    }
    return out;
  }
}

function labelOf(key: string, value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.label === 'string') return v.label;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.text === 'string') return v.text;
  }
  if (typeof value === 'string') return value;
  return key.replace(/^.*\./, '').replace(/_/g, ' ');
}

function titleFor(label: string): string {
  return `You both ${label}`;
}

function kindFromLayer(
  layer: string
): MatchingEvidenceItem['kind'] {
  if (layer === 'hobby') return 'hobby';
  if (layer === 'place') return 'place';
  if (layer === 'this_or_that') return 'this_or_that';
  return 'attribute';
}
