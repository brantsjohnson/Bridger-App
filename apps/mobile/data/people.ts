// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks up people by id for avatars and names. Demo mode reads the fixture
// catalog. Live mode reads the in-memory people cache (filled by loadPeople
// from the connections API). Until the cache loads, unknown ids get a safe
// placeholder so cards never crash.
//
// Also builds the Create-event invite lists: every connection you have, plus
// a separate "Might be a good fit" list of friends-of-friends with a mutual
// first name (never a tier label — that stays private). Friends-of-friends
// stay demo until matching ships.
// ============================================
import type { Person } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import {
  getCachedMe,
  getCachedPeople,
  getCachedPerson
} from '../lib/people-cache';
import { demoTierFor } from './friends';
import { ME, PEOPLE } from './fixtures/catalog';

// --- FRIENDS-OF-FRIENDS (demo): people your friends know who could vibe at
// an event. PRIVACY: they are not in your connections; suggestions show a
// mutual first name only — never whose list they came from via a tier word.
const FRIEND_OF_FRIEND: Person[] = [
  { id: 'fof-ana', name: 'Ana Ruiz', handle: '', emoji: '🎸', accent: 'coral', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-ben', name: 'Ben Cho', handle: '', emoji: '🥁', accent: 'teal', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-liv', name: 'Liv Meyer', handle: '', emoji: '🎨', accent: 'amber', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-sam', name: 'Sam Okafor', handle: '', emoji: '⚽️', accent: 'green', tier: 'acquaintance', label: '', mutuals: 1 }
];

/** Demo mutual first-names for FoF suggestions (no tier words). */
const FOF_MUTUAL: Record<string, string> = {
  'fof-ana': 'Jade',
  'fof-ben': 'Kelton',
  'fof-liv': 'Jade',
  'fof-sam': 'Kelton'
};

export type SuggestedInvite = Person & { mutualName: string };

function placeholder(id: string): Person {
  return {
    id,
    name: 'Friend',
    handle: '',
    emoji: '🙂',
    accent: 'purple',
    tier: 'friend',
    label: '',
    mutuals: 0
  };
}

function byFirstName(a: Person, b: Person): number {
  return a.name.split(' ')[0].localeCompare(b.name.split(' ')[0]);
}

/** Find a person by id for avatars / labels on cards. */
export function personById(id: string): Person {
  if (isDemoMode()) {
    const base =
      PEOPLE.find((p) => p.id === id) ??
      FRIEND_OF_FRIEND.find((p) => p.id === id) ??
      (id === 'me' ? ME : placeholder(id));
    // Overlay session retier so the profile pill matches Friends Edit.
    const overlay = demoTierFor(id);
    return overlay ? { ...base, tier: overlay } : base;
  }
  return getCachedPerson(id) ?? placeholder(id);
}

/** True when this id is a real known person (not the safe placeholder). */
export function personExists(id: string): boolean {
  if (id === 'me') return true;
  if (isDemoMode()) {
    return (
      PEOPLE.some((p) => p.id === id) ||
      FRIEND_OF_FRIEND.some((p) => p.id === id)
    );
  }
  return getCachedPerson(id) != null;
}

/**
 * Everyone you can invite from your own book: all connections (close, friend,
 * acquaintance), sorted A–Z by first name.
 */
export function listInvitePool(_coHostIds?: string[]): Person[] {
  if (isDemoMode()) {
    return [...PEOPLE].sort(byFirstName);
  }
  return getCachedPeople().sort(byFirstName);
}

/**
 * Friends-of-friends who might vibe at this event. Shows a mutual first name
 * only — never close / friends / acquaintance. Live: deferred until matching
 * ships (returns empty so the Create-event sheet just shows your own book).
 */
export function listSuggestedInvites(_coHostIds?: string[]): SuggestedInvite[] {
  if (isDemoMode()) {
    return FRIEND_OF_FRIEND.map((p) => ({
      ...p,
      mutualName: FOF_MUTUAL[p.id] ?? 'a friend'
    })).sort(byFirstName);
  }
  // Matching / FoF graph not live yet.
  return [];
}

export function listPeople(): Person[] {
  if (isDemoMode()) {
    return [...PEOPLE];
  }
  return getCachedPeople();
}

export function getMe(): Person {
  if (isDemoMode()) {
    return ME;
  }
  return getCachedMe() ?? placeholder('me');
}

/**
 * People you and this friend both know. Demo picks other connections up to
 * their mutuals count; live mode will come from the connections graph.
 * PRIVACY: only people you're allowed to see (your own book).
 */
export function mutualFriendsWith(personId: string): Person[] {
  const them = personById(personId);
  const count = Math.max(0, them.mutuals);
  if (isDemoMode()) {
    return PEOPLE.filter((p) => p.id !== personId).slice(0, count);
  }
  // TODO: GET /connections/:id/mutuals
  return getCachedPeople()
    .filter((p) => p.id !== personId)
    .slice(0, count);
}
