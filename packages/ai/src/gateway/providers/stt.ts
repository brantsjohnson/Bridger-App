// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns spoken audio into text (speech-to-text). Used for Update transcripts
// and voice captions. The words go into summaries; the audio itself never
// goes to a chat model.
//
// --- SECURITY ---
// Never import this from client code. Transcripts are content: not logged to
// analytics, not used for training.
// ============================================
import OpenAI from 'openai';
import { toFile } from 'openai';

export interface SttCallInput {
  apiKey: string;
  modelId: string;
  /** Raw audio bytes. */
  audio: Buffer;
  filename: string;
  mimeType?: string;
  timeoutMs: number;
}

export interface SttCallResult {
  text: string;
}

export async function callSpeechToText(
  input: SttCallInput
): Promise<SttCallResult> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    timeout: input.timeoutMs
  });

  const file = await toFile(input.audio, input.filename, {
    type: input.mimeType ?? 'audio/mpeg'
  });

  const result = await client.audio.transcriptions.create({
    file,
    model: input.modelId
  });

  return { text: (result.text ?? '').trim() };
}
