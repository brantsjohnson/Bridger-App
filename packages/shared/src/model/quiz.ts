// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes for quizzes that travel between the admin console, the API, and
// the app. Scoring weights stay on the server (PRIVACY); the client only sees
// labels and prompts. Mirrors guide-docs/QUIZ-ENGINE.md.
// ============================================

import type { Cover } from './cover';

/** Catalog row: one quiz people can take (or archive). */
export interface QuizRegistryEntry {
  slug: string;
  title: string;
  /** Short line under the title on the Home card. */
  description?: string;
  status: 'live' | 'draft' | 'archived';
  liveWeek?: string;
  friendsTakenCount: number;
  webTakeable: boolean;
  comparable: boolean;
  quizId?: string;
  /** Same cover art model as events: photo fills the frame. */
  cover?: Cover;
}

/** One dimension a quiz measures (e.g. "spontaneity"). */
export interface QuizDimension {
  key: string;
  label: string;
}

/** How far the AI moderator may adapt this quiz. */
export interface AdaptationPolicy {
  mayReword: boolean;
  mayInsertClarifiers: boolean;
  /** Hard cap so the quiz cannot loop forever. */
  maxInsertedQuestions: number;
  mayReorder: boolean;
}

/**
 * PRIVACY: weights are server-side only. Never send this option shape to the
 * client as-is; strip weights first.
 */
export interface QuizOption {
  id: string;
  label: string;
  weights: Record<string, number>;
}

/** A question as stored / authored (includes weights). */
export interface QuizQuestion {
  id: string;
  prompt: string;
  type: 'single' | 'multi';
  options: QuizOption[];
  allowExplain: boolean;
}

/** Client-safe option: label only, no rubric weights. */
export interface QuizOptionPublic {
  id: string;
  label: string;
}

/** Client-safe question: no weights. */
export interface QuizQuestionPublic {
  id: string;
  prompt: string;
  type: 'single' | 'multi';
  options: QuizOptionPublic[];
  allowExplain: boolean;
}

/** The quiz design / blueprint. */
export interface QuizDefinition {
  id: string;
  version: number;
  goal?: string;
  dimensions: QuizDimension[];
  moderatorInstructions?: string;
  adaptationPolicy: AdaptationPolicy;
}

/** Live quiz payload the app uses to take a quiz (no weights). */
export interface LiveQuiz {
  slug: string;
  title: string;
  description?: string;
  comparable: boolean;
  quizId: string;
  version: number;
  cover?: Cover;
  questions: QuizQuestionPublic[];
  /** Optional who-got-who groups after the user has a result. */
  results?: Array<{
    id: string;
    label: string;
    accent?: string;
    friendIds: string[];
  }>;
  resultId?: string | null;
}

/** Deterministic scores + moderator confidence. */
export interface QuizResult {
  quizId: string;
  userId: string;
  dimensionScores: Record<string, number>;
  confidence: Record<string, number>;
  completedAt: string;
  /** Top result label for fun quizzes (e.g. "Coastal cruiser"). */
  resultLabel?: string;
  resultId?: string;
}

/** Server-side moderator working state. Never exposed to the client raw. */
export interface ModeratorState {
  quizId: string;
  userId: string;
  confidence: Record<string, number>;
  flags: Array<'selected_all' | 'contradiction' | 'low_info'>;
  insertedQuestionIds: string[];
  /** Answers + explanations, de-identified for the AI. */
  transcriptForAI: string;
}
