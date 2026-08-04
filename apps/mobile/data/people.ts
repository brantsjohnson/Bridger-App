// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks up people by id for avatars and names. Demo mode reads the fixture
// catalog. Live mode will use the connections cache / API; until that lands,
// unknown ids get a safe placeholder so cards never crash.
// ============================================
import type { Person } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { ME, PEOPLE } from './fixtures/catalog';

// --- INVITE POOL (demo): a friend's acquaintances you can invite to an event.
// These stand in for "friends-of-friends" so the Invite step has names to
// search. PRIVACY: they carry no owner field, so nothing here can tell you
// WHOSE acquaintance a person is — that de-identification is the whole point.
const FRIEND_OF_FRIEND: Person[] = [
  { id: 'fof-ana', name: 'Ana Ruiz', handle: '', emoji: '🎸', accent: 'coral', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-ben', name: 'Ben Cho', handle: '', emoji: '🥁', accent: 'teal', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-liv', name: 'Liv Meyer', handle: '', emoji: '🎨', accent: 'amber', tier: 'acquaintance', label: '', mutuals: 1 },
  { id: 'fof-sam', name: 'Sam Okafor', handle: '', emoji: '⚽️', accent: 'green', tier: 'acquaintance', label: '', mutuals: 1 }
];

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

/**
 * The people you can invite to an event: your own acquaintances, plus (when a
 * co-host is set) the co-host's acquaintances too. Sorted A-Z by first name so
 * the order never hints at whose acquaintance someone is. PRIVACY: the list is
 * de-identified — you see the person, never who they belong to.
 */
export function listInvitePool(coHostId?: string): Person[] {
  if (isDemoMode()) {
    const mine = PEOPLE.filter((p) => p.tier === 'acquaintance');
    const theirs = coHostId ? FRIEND_OF_FRIEND : [];
    const merged = [...mine, ...theirs];
    return merged.sort((a, b) =>
      a.name.split(' ')[0].localeCompare(b.name.split(' ')[0])
    );
  }
  // TODO: GET de-identified invite pool from connections/matching. The server
  //       merges both hosts' acquaintances and strips ownership before sending.
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
