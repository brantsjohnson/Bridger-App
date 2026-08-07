// ============================================
// WHAT THIS FILE DOES (plain English):
// The internal "put this AI work on the shelf" service. Stories, quiz, and
// profiles call enqueue(); a worker picks jobs up later so the user never waits
// on a model. There is no public HTTP endpoint that accepts raw prompts.
// ============================================
import { Injectable } from '@nestjs/common';
import {
  contentHash,
  type JobName,
  daySummary,
  weekSummary,
  quizModerator,
  moduleNotes,
  personSummary,
  freshness,
  planPersonEmbedding
} from '@bridger/ai';
import type { Json } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AiJobsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Queue one job. If the same (job, subject, content-hash) already finished,
   * we skip inserting a duplicate pending row when possible.
   */
  async enqueue(
    job: JobName,
    subjectRef: string,
    payload: Record<string, unknown>
  ): Promise<{ id: string | null; skipped: boolean }> {
    const hash = contentHash(payload);

    // Skip if already done with this exact content.
    const { data: done } = await this.supabase.admin
      .from('ai_jobs')
      .select('id')
      .eq('job', job)
      .eq('subject_ref', subjectRef)
      .eq('content_hash', hash)
      .eq('status', 'done')
      .maybeSingle();
    if (done) return { id: done.id, skipped: true };

    const { data, error } = await this.supabase.admin
      .from('ai_jobs')
      .insert({
        job,
        subject_ref: subjectRef,
        content_hash: hash,
        payload_json: payload as Json,
        status: 'pending'
      })
      .select('id')
      .single();
    if (error) {
      // Unique race on done index is fine; treat as skip.
      if (error.code === '23505') return { id: null, skipped: true };
      throw error;
    }
    return { id: data.id, skipped: false };
  }

  // --- Convenience builders used by domain modules ---

  async enqueueDaySummary(input: {
    authorId: string;
    date: string;
    caption: string;
    transcript: string;
  }) {
    const userPrompt = daySummary.buildUser({
      caption: input.caption,
      transcript: input.transcript
    });
    return this.enqueue('day_summary', input.authorId, {
      subject_ref: input.authorId,
      date: input.date,
      caption: input.caption,
      transcript: input.transcript,
      user_prompt: userPrompt,
      grounding_source: `${input.caption}\n${input.transcript}`
    });
  }

  async enqueueWeekSummary(input: {
    authorId: string;
    weekStart: string;
    days: Record<string, string>;
  }) {
    return this.enqueue('week_summary', input.authorId, {
      subject_ref: input.authorId,
      week_start: input.weekStart,
      user_prompt: weekSummary.buildUser({ days: input.days }),
      grounding_source: Object.values(input.days).join('\n')
    });
  }

  async enqueueEmbeddings(input: {
    userId: string;
    attributes: Array<{ key: string; value: unknown }>;
    extraTexts?: string[];
  }) {
    const plan = planPersonEmbedding({
      subjectRef: input.userId,
      attributes: input.attributes,
      modelId: 'text-embedding-3-small',
      extraTexts: input.extraTexts
    });
    if (!plan) return { id: null, skipped: true };
    return this.enqueue('embeddings', input.userId, {
      subject_ref: input.userId,
      corpus_text: plan.corpusText
    });
  }

  async enqueuePersonSummary(input: {
    userId: string;
    facts: string[];
  }) {
    return this.enqueue('person_summary', input.userId, {
      subject_ref: input.userId,
      user_prompt: personSummary.buildUser({ facts: input.facts }),
      grounding_source: input.facts.join('\n')
    });
  }

  async enqueueQuizModerator(input: {
    userId: string;
    responseId: string;
    moderatorInstructions?: string | null;
    adaptationPolicy?: unknown;
    dimensions: Array<{ key: string }>;
    answers: unknown;
  }) {
    return this.enqueue('quiz_moderator', input.userId, {
      subject_ref: input.userId,
      response_id: input.responseId,
      user_prompt: quizModerator.buildUser({
        moderatorInstructions: input.moderatorInstructions,
        adaptationPolicy: input.adaptationPolicy,
        dimensions: input.dimensions,
        answers: input.answers
      })
    });
  }

  async enqueueModuleNotes(input: {
    userId: string;
    moduleKey: string;
    answers: unknown;
  }) {
    return this.enqueue('module_notes', input.userId, {
      subject_ref: input.userId,
      module_key: input.moduleKey,
      user_prompt: moduleNotes.buildUser({
        moduleKey: input.moduleKey,
        answers: input.answers
      })
    });
  }

  async enqueueFreshness(input: {
    userId: string;
    staleCandidates: Array<{
      attribute_id: string;
      key: string;
      value_text: string;
    }>;
    recentActivityText?: string;
  }) {
    return this.enqueue('freshness', input.userId, {
      subject_ref: input.userId,
      user_prompt: freshness.buildUser({
        staleCandidates: input.staleCandidates,
        recentActivityText: input.recentActivityText
      })
    });
  }

  async enqueueTranscription(input: {
    userId: string;
    storyId: string;
    audioBase64: string;
    filename: string;
    mimeType?: string;
  }) {
    return this.enqueue('transcription', input.userId, {
      subject_ref: input.userId,
      story_id: input.storyId,
      audio_base64: input.audioBase64,
      filename: input.filename,
      mime_type: input.mimeType ?? null
    });
  }

  async enqueueVoiceCaptions(input: {
    userId: string;
    audioBase64: string;
    filename: string;
    mimeType?: string;
    targetId?: string;
  }) {
    return this.enqueue('voice_captions', input.userId, {
      subject_ref: input.userId,
      target_id: input.targetId ?? null,
      audio_base64: input.audioBase64,
      filename: input.filename,
      mime_type: input.mimeType ?? null
    });
  }
}
