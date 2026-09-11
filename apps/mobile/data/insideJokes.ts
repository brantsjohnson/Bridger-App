// ============================================
// WHAT THIS FILE DOES (plain English):
// Inside Jokes (quotes module): sticky-note quotes friends write about each
// other. Demo keeps an in-memory wall so a new note shows up right away.
// Live mode talks to GET/POST /quotes.
// ============================================
import type { InsideJoke } from '@bridger/shared';
import { apiFetch } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { uploadMedia } from '../lib/media-upload';
import { personById } from './people';
import {
  INSIDE_JOKES as FIXTURE_ABOUT,
  INSIDE_JOKES_BY_ME as FIXTURE_BY_ME
} from './fixtures/catalog';
import {
  matchesInsideJokeFilter,
  newestInsideJokesFirst,
  type InsideJokeFilter
} from './inside-jokes.math';

export type { InsideJokeFilter };

export type AddInsideJokeInput = {
  text: string;
  /** Who said the line (their face goes on the note). */
  quotedId?: string;
  taggedIds?: string[];
  eventName?: string;
  eventId?: string;
  accent?: InsideJoke['accent'];
  /** Local photo to upload (co-op). Demo keeps the local uri. */
  photoUri?: string;
};

const DAY = 24 * 60 * 60 * 1000;

function stamp(list: InsideJoke[], newest: number): InsideJoke[] {
  return list.map((j, i) => ({
    ...j,
    createdAt: j.createdAt ?? newest - i * DAY,
    taggedIds: j.taggedIds ? [...j.taggedIds] : undefined
  }));
}

// One wall for the session. New posts go on top.
// Two demo notes carry a photo so the square flip is visible without posting.
const DEMO_JOKE_PHOTOS: Record<string, string> = {
  qm1: 'https://picsum.photos/seed/bridger-joke-ramen/800/800',
  q1: 'https://picsum.photos/seed/bridger-joke-rave/800/800'
};

let demoJokes: InsideJoke[] = stamp(
  [...FIXTURE_BY_ME, ...FIXTURE_ABOUT].map((j) => {
    const photoUri = DEMO_JOKE_PHOTOS[j.id];
    return photoUri ? { ...j, photoUri } : j;
  }),
  Date.now() - DAY
);

type Listener = () => void;
const listeners = new Set<Listener>();

/** Tell every open wall (Friends + Profile) to reload. */
export function subscribeInsideJokes(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emitChanged() {
  listeners.forEach((fn) => fn());
}

function clone(j: InsideJoke): InsideJoke {
  return { ...j, taggedIds: j.taggedIds ? [...j.taggedIds] : undefined };
}

function newestFirst(list: InsideJoke[]): InsideJoke[] {
  return newestInsideJokesFirst(list);
}

function matchesFilter(j: InsideJoke, filter: InsideJokeFilter, personId: string): boolean {
  return matchesInsideJokeFilter(j, filter, personId);
}

/** Load notes for Friends / Profile, newest first. */
export async function listInsideJokes(
  filter: InsideJokeFilter = 'all',
  personId = 'me'
): Promise<InsideJoke[]> {
  if (isDemoMode()) {
    return newestFirst(
      demoJokes.filter((j) => matchesFilter(j, filter, personId)).map(clone)
    );
  }

  const q = new URLSearchParams({ filter });
  if (personId && personId !== 'me') q.set('personId', personId);
  return apiFetch<InsideJoke[]>(`/quotes?${q.toString()}`);
}

/** Counts for the All / About / By filter chips. */
export async function countInsideJokes(
  personId = 'me'
): Promise<Record<InsideJokeFilter, number>> {
  const [all, about, by] = await Promise.all([
    listInsideJokes('all', personId),
    listInsideJokes('about', personId),
    listInsideJokes('by', personId)
  ]);
  return { all: all.length, about: about.length, by: by.length };
}

/** Post a new sticky note. Newest on Friends and on both walls. */
export async function addInsideJoke(input: AddInsideJokeInput): Promise<InsideJoke> {
  const quoted = input.quotedId ? personById(input.quotedId) : null;
  const taggedIds = Array.from(
    new Set(
      [input.quotedId, ...(input.taggedIds ?? [])].filter((id): id is string => Boolean(id))
    )
  );

  if (isDemoMode()) {
    const joke: InsideJoke = {
      id: `j-${Date.now()}`,
      text: input.text.trim(),
      fromName: quoted?.name ?? 'You',
      quotedId: input.quotedId,
      postedById: 'me',
      postedAt: 'just now',
      createdAt: Date.now(),
      accent: input.accent ?? 'amber',
      taggedIds,
      eventName: input.eventName,
      eventId: input.eventId,
      photoUri: input.photoUri
    };
    demoJokes = [joke, ...demoJokes];
    emitChanged();
    return clone(joke);
  }

  let photoMediaId: string | undefined;
  if (input.photoUri) {
    photoMediaId = await uploadMedia(
      input.photoUri,
      'photo',
      `quotes/${Date.now()}`
    );
  }

  const joke = await apiFetch<InsideJoke>('/quotes', {
    method: 'POST',
    body: JSON.stringify({
      text: input.text.trim(),
      quotedPersonId: input.quotedId,
      taggedIds,
      eventId: input.eventId,
      eventName: input.eventName,
      accent: input.accent,
      photoMediaId
    })
  });
  emitChanged();
  return joke;
}
