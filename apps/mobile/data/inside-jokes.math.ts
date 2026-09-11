// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny helpers for the Inside Jokes wall: newest notes first, and whether
// a note belongs on someone's All / About / By filter.
// ============================================
import type { InsideJoke } from '@bridger/shared';

export type InsideJokeFilter = 'all' | 'about' | 'by';

/** True when this note is about the person, written by them, or both. */
export function matchesInsideJokeFilter(
  joke: InsideJoke,
  filter: InsideJokeFilter,
  personId: string
): boolean {
  const about =
    joke.quotedId === personId || (joke.taggedIds ?? []).includes(personId);
  const by = joke.postedById === personId;
  if (filter === 'about') return about;
  if (filter === 'by') return by;
  return about || by;
}

/** Newest createdAt first. Missing dates sink to the bottom. */
export function newestInsideJokesFirst(list: InsideJoke[]): InsideJoke[] {
  return [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
