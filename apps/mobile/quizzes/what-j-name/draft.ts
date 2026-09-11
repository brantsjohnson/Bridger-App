// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers an in-progress "What J name are you" take on this phone so leaving
// mid-quiz does not force a full retake. Never stores answer text in analytics.
// Cleared when the quiz is finished or the person discards.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizRun } from './engine';

const DRAFT_KEY = 'bridger.quiz.jname.draft.v1';

export type JnameQuizDraft = {
  phase: string;
  currentQId: string;
  rapidIndex: number;
  part4Index: number;
  picks: string[];
  run: QuizRun;
  startedAt: number;
  savedAt: number;
};

export async function loadJnameDraft(): Promise<JnameQuizDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JnameQuizDraft;
    if (!parsed?.run || !parsed.phase) return null;
    // Drop stale drafts older than 7 days.
    if (Date.now() - (parsed.savedAt || 0) > 7 * 24 * 60 * 60 * 1000) {
      await clearJnameDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveJnameDraft(draft: Omit<JnameQuizDraft, 'savedAt'>): Promise<void> {
  try {
    const payload: JnameQuizDraft = { ...draft, savedAt: Date.now() };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Offline storage full: quiz still works, just cannot resume.
  }
}

export async function clearJnameDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
