// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks up people by id for avatars and names. Demo mode reads the fixture
// catalog. Live mode will use the connections cache / API; until that lands,
// unknown ids get a safe placeholder so cards never crash.
//
// Also builds the Create-event invite lists: every connection you have, plus
// a separate "Might be a good fit" list of friends-of-friends with a mutual
// first name (never a tier label — that stays private).
// ============================================
import type { Person } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
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

/** Find a person by id for avatars / labels on cards. */
export function personById(id: string): Person {
  if (isDemoMode()) {
    return (
      PEOPLE.find((p) => p.id === id) ??
      FRIEND_OF_FRIEND.find((p) => p.id === id) ??
      (id === 'me' ? ME : placeholder(id))
    );
  }
  // TODO: live people cache from the connections module
  return placeholder(id);
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
  // TODO: live people cache
  return false;
}

/**
 * Everyone you can invite from your own book: all connections (close, friend,
 * acquaintance), sorted A–Z by first name.
 */
export function listInvitePool(_coHostIds?: string[]): Person[] {
  if (isDemoMode()) {
    return [...PEOPLE].sort((a, b) =>
      a.name.split(' ')[0].localeCompare(b.name.split(' ')[0])
    );
  }
  // TODO: GET connections for the invite pool
  return [];
}

/**
 * Friends-of-friends who might vibe at this event. Shows a mutual first name
 * only — never close / friends / acquaintance. When co-hosts are set we still
 * return the same demo FoF list (live: merge co-host graphs server-side).
 */
export function listSuggestedInvites(_coHostIds?: string[]): SuggestedInvite[] {
  if (isDemoMode()) {
    return FRIEND_OF_FRIEND.map((p) => ({
      ...p,
      mutualName: FOF_MUTUAL[p.id] ?? 'a friend'
    })).sort((a, b) => a.name.split(' ')[0].localeCompare(b.name.split(' ')[0]));
  }
  // TODO: GET matching invite suggestions scoped to the event graph
  return [];
}

export function listPeople(): Person[] {
  if (isDemoMode()) {
    return [...PEOPLE];
  }
  // TODO: GET /connections (or equivalent)
  return [];
}

export function getMe(): Person {
  if (isDemoMode()) {
    return ME;
  }
  // TODO: current user profile from /me
  return placeholder('me');
}
