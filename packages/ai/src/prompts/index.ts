// ============================================
// WHAT THIS FILE DOES (plain English):
// One place to look up which prompt version a job uses right now.
// ============================================
import type { JobName } from '../jobs/types';
import * as daySummary from './day-summary/v1';
import * as weekSummary from './week-summary/v1';
import * as quizModerator from './quiz-moderator/v1';
import * as moduleNotes from './module-notes/v1';
import * as personSummary from './person-summary/v1';
import * as freshness from './freshness/v1';
import * as agentQuery from './agent-query/v1';
import * as agentReasoning from './agent-reasoning/v1';

export interface PromptBundle {
  version: string;
  system: string;
}

const PROMPTS: Partial<Record<JobName, PromptBundle>> = {
  day_summary: { version: daySummary.VERSION, system: daySummary.SYSTEM },
  week_summary: { version: weekSummary.VERSION, system: weekSummary.SYSTEM },
  quiz_moderator: {
    version: quizModerator.VERSION,
    system: quizModerator.SYSTEM
  },
  module_notes: { version: moduleNotes.VERSION, system: moduleNotes.SYSTEM },
  person_summary: {
    version: personSummary.VERSION,
    system: personSummary.SYSTEM
  },
  freshness: { version: freshness.VERSION, system: freshness.SYSTEM },
  agent_query: { version: agentQuery.VERSION, system: agentQuery.SYSTEM },
  agent_reasoning: {
    version: agentReasoning.VERSION,
    system: agentReasoning.SYSTEM
  }
};

export function getPrompt(job: JobName): PromptBundle | null {
  return PROMPTS[job] ?? null;
}

export {
  daySummary,
  weekSummary,
  quizModerator,
  moduleNotes,
  personSummary,
  freshness,
  agentQuery,
  agentReasoning
};
