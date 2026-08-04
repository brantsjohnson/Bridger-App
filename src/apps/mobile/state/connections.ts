import { FriendNote, HowYouMet, UpcomingItem } from '../../../packages/shared';

/**
 * Every connection stores how it began. Event and via-friend records are
 * captured automatically; place records are opt-in and coarse.
 */
export const HOW_YOU_MET: Record<string, HowYouMet[]> = {
  maya: [
  { kind: 'event', label: 'Game Night', date: 'Mar 3', viaName: 'Priya' },
  { kind: 'place', label: 'RiNo, Denver', date: 'Mar 3', approximate: true }],

  devon: [{ kind: 'via', label: 'Sam', date: 'Jan 12' }],
  theo: [{ kind: 'event', label: 'Ramen crawl', date: 'Feb 20' }],
  kit: [{ kind: 'place', label: 'Cherry Creek', date: 'Nov 2', approximate: true }],
  ines: [{ kind: 'via', label: 'Maya', date: 'Dec 8' }],
  nour: []
};

/** The coarse area the device offers at connect time. Never precise. */
export const NEARBY_AREA = 'RiNo, Denver';

/** Birthdays come from each friend's own shared attribute — never entered by you. */
export const BIRTHDAYS: Record<string, {date: string;today?: boolean;inDays: number;}> = {
  maya: { date: 'Friday', inDays: 3 },
  devon: { date: 'Today', today: true, inDays: 0 }
};

export const FRIEND_NOTES: FriendNote[] = [
{ id: 'n1', personId: 'maya', kind: 'text', body: 'Loves horror movies' },
{
  id: 'n2',
  personId: 'maya',
  kind: 'date',
  body: 'Graduation',
  date: 'May 5',
  remind: true
},
{ id: 'n3', personId: 'maya', kind: 'text', body: 'Allergic to peanuts' }];


export const COMING_UP: UpcomingItem[] = [
{ id: 'u1', kind: 'birthday', label: "Devon's birthday", when: 'Today', personId: 'devon' },
{ id: 'u2', kind: 'birthday', label: "Maya's birthday", when: 'Friday', personId: 'maya' },
{ id: 'u3', kind: 'note', label: "Maya's graduation", when: 'in 1 week', personId: 'maya' }];


export const notesFor = (personId: string) => FRIEND_NOTES.filter((n) => n.personId === personId);