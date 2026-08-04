// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks up people by id for avatars and names. Demo mode reads the fixture
// catalog. Live mode will use the connections cache / API; until that lands,
// unknown ids get a safe placeholder so cards never crash.
// ============================================
import type { Person } from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { ME, PEOPLE } from './fixtures/catalog';

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
    return PEOPLE.find((p) => p.id === id) ?? ME;
  }
  // TODO: live people cache from the connections module
  return placeholder(id);
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
