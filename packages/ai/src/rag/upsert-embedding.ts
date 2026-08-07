// ============================================
// WHAT THIS FILE DOES (plain English):
// Helper that turns scrubbed corpus text into the shape we store in
// person_embeddings. The actual DB write happens in the Nest worker.
// ============================================
import { normalizePersonCorpus, type AttributeForEmbed } from './normalize';
import { scrubTextForEmbed } from './scrub-text';

export interface EmbeddingUpsertPlan {
  subjectRef: string;
  corpusText: string;
  modelId: string;
}

export function planPersonEmbedding(input: {
  subjectRef: string;
  attributes: AttributeForEmbed[];
  modelId: string;
  extraTexts?: string[];
}): EmbeddingUpsertPlan | null {
  const parts = [
    normalizePersonCorpus(input.attributes),
    ...(input.extraTexts ?? [])
  ]
    .map((t) => scrubTextForEmbed(t.trim()))
    .filter(Boolean);

  if (parts.length === 0) return null;

  return {
    subjectRef: input.subjectRef,
    corpusText: parts.join('\n'),
    modelId: input.modelId
  };
}

/** pgvector accepts a string like '[0.1,0.2,...]'. */
export function vectorToPgString(vector: number[]): string {
  return `[${vector.join(',')}]`;
}
