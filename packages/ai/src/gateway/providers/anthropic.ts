// ============================================
// WHAT THIS FILE DOES (plain English):
// The only file that imports the Anthropic SDK. Sends a scrubbed prompt and
// returns text + token counts. Keys come from the environment on the server.
//
// --- SECURITY ---
// Never import this from apps/mobile or any client code.
// ============================================
import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicCallInput {
  apiKey: string;
  modelId: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export interface AnthropicCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export async function callAnthropic(
  input: AnthropicCallInput
): Promise<AnthropicCallResult> {
  const client = new Anthropic({
    apiKey: input.apiKey,
    timeout: input.timeoutMs
  });

  const message = await client.messages.create({
    model: input.modelId,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    system: input.system,
    messages: [{ role: 'user', content: input.user }]
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return {
    text,
    inputTokens: message.usage?.input_tokens ?? 0,
    outputTokens: message.usage?.output_tokens ?? 0
  };
}
