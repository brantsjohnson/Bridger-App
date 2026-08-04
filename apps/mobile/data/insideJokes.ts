// ============================================
// WHAT THIS FILE DOES (plain English):
// Inside Jokes (quotes module): sticky-note quotes friends write about each
// other. Demo mode keeps an in-memory wall so posting a new note sticks for
// the session. Live mode will hit the quotes API.
// ============================================
import type { InsideJoke } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  INSIDE_JOKES as FIXTURE_ABOUT,
  INSIDE_JOKES_BY_ME as FIXTURE_BY_ME
} from './fixtures/catalog';

export type InsideJokeFilter = 'all' | 'about' | 'by';

let demoAbout: InsideJoke[] = FIXTURE_ABOUT.map((j) => ({ ...j }));
let demoByMe: InsideJoke[] = FIXTURE_BY_ME.map((j) => ({ ...j }));

function clone(list: InsideJoke[]): InsideJoke[] {
  return list.map((j) => ({
    ...j,
    taggedIds: j.taggedIds ? [...j.taggedIds] : undefined
  }));
}

/** Load notes for the Friends / Profile wall, filtered. */
export async function listInsideJokes(
  filter: InsideJokeFilter = 'all'
): Promise<InsideJoke[]> {
  if (isDemoMode()) {
    if (filter === 'about') return clone(demoAbout);
    if (filter === 'by') return clone(demoByMe);
    return [...clone(demoAbout), ...clone(demoByMe)];
  }

  // TODO: GET /quotes
  return [];
}

/** Counts for the All / About / By filter chips. */
export async function countInsideJokes(): Promise<Record<InsideJokeFilter, number>> {
  if (isDemoMode()) {
    return {
      all: demoAbout.length + demoByMe.length,
      about: demoAbout.length,
      by: demoByMe.length
    };
  }
  // TODO: GET /quotes/counts
  return { all: 0, about: 0, by: 0 };
}

export type AddInsideJokeInput = {
  text: string;
  taggedIds?: string[];
  eventName?: string;
  accent?: InsideJoke['accent'];
};

/** Post a new sticky note. Demo prepends to "by me"; live POSTs /quotes. */
export async function addInsideJoke(input: AddInsideJokeInput): Promise<InsideJoke> {
  const accents: InsideJoke['accent'][] = ['amber', 'pink', 'teal', 'green', 'blue'];
  const joke: InsideJoke = {
    id: `j-${Date.now()}`,
    text: input.text.trim(),
    fromName: 'You',
    quotedId: 'me',
    postedById: 'me',
    postedAt: 'just now',
    accent: input.accent ?? accents[Math.floor(Math.random() * accents.length)],
    taggedIds: input.taggedIds,
    eventName: input.eventName
  };

  if (isDemoMode()) {
    demoByMe = [joke, ...demoByMe];
    return { ...joke };
  }

  // TODO: POST /quotes
  return joke;
}
