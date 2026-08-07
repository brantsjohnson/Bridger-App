// ============================================
// WHAT THIS FILE DOES (plain English):
// The only file that calls OpenAI embeddings. Turns scrubbed Zone B text into
// a vector fingerprint for matching. Never sends names or photos.
//
// --- SECURITY ---
// Never import this from client code.
// ============================================
import OpenAI from 'openai';

export interface EmbedCallInput {
  apiKey: string;
  modelId: string;
  texts: string[];
  timeoutMs: number;
}

export interface EmbedCallResult {
  vectors: number[][];
  inputTokens: number;
}

export async function callOpenAiEmbed(
  input: EmbedCallInput
): Promise<EmbedCallResult> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    timeout: input.timeoutMs
  });

  const response = await client.embeddings.create({
    model: input.modelId,
    input: input.texts
  });

  const vectors = response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);

  return {
    vectors,
    inputTokens: response.usage?.total_tokens ?? 0
  };
}
