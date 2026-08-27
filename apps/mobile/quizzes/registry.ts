// ============================================
// WHAT THIS FILE DOES (plain English):
// The list of quiz plugins the app knows how to load. Home and the quiz route
// look up a slug here, then lazy-import that quiz's screen. `road-trip` is an
// alias for the fixture id so Home can deep-link with either name.
// ============================================
import type { ComponentType } from 'react';

export type QuizPluginStatus = 'live' | 'draft' | 'archived';

export type QuizRegistryItem = {
  slug: string;
  /** What the header should say (the quiz's real name, not "Quiz"). */
  title: string;
  status: QuizPluginStatus;
  /** Lazy load the quiz screen component. */
  load: () => Promise<{ default: ComponentType<{ slug: string }> }>;
};

/** Registered quiz plugins (folder under apps/mobile/quizzes/). */
export const QUIZ_REGISTRY: QuizRegistryItem[] = [
  // The featured "What J name are you..." quiz.
  {
    slug: 'what-j-name',
    title: 'Which "J" name are you?',
    status: 'live',
    load: () => import('./what-j-name/Quiz')
  },
  {
    slug: 'which-road-trip',
    title: 'Which road trip are you?',
    status: 'live',
    load: () => import('./which-road-trip/Quiz')
  },
  // Alias for the fixture Home quiz id (`road-trip`).
  {
    slug: 'road-trip',
    title: 'Which road trip are you?',
    status: 'live',
    load: () => import('./which-road-trip/Quiz')
  }
];

/** Find a plugin by slug (or alias). */
export function findQuizPlugin(slug: string): QuizRegistryItem | undefined {
  return QUIZ_REGISTRY.find((q) => q.slug === slug);
}

/** Header title for a slug. Falls back to "Quiz" only if we do not know it yet. */
export function quizTitleForSlug(slug: string): string {
  return findQuizPlugin(slug)?.title ?? 'Quiz';
}
