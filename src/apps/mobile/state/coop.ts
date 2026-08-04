/**
 * Member portal content. The portal is the members-only half of the co-op:
 * what gets built, where the money goes, and a direct line to the people
 * building it. One member, one vote.
 */

export interface Proposal {
  id: string;
  title: string;
  line: string;
  /** votes per option, in order */
  votes: number;
  myVote: boolean;
  closes: string;
}

export const PROPOSALS: Proposal[] = [
{
  id: 'pr1',
  title: 'Shared albums for events',
  line: 'Everyone who came drops their photos in one place.',
  votes: 1284,
  myVote: false,
  closes: 'Closes in 6 days'
},
{
  id: 'pr2',
  title: 'Bring back handwritten notes',
  line: 'Mail a real postcard to a friend, printed and stamped by us.',
  votes: 902,
  myVote: true,
  closes: 'Closes in 6 days'
},
{
  id: 'pr3',
  title: 'Group trips',
  line: 'Plan a weekend away with dates, costs and who is in.',
  votes: 741,
  myVote: false,
  closes: 'Closes in 6 days'
}];


/** Open books, every quarter. Percentages, not vague promises. */
export const SPEND: Array<{label: string;pct: number;accent: 'purple' | 'teal' | 'amber' | 'coral' | 'blue';}> = [
{ label: 'People building it', pct: 62, accent: 'purple' },
{ label: 'Servers and storage', pct: 21, accent: 'teal' },
{ label: 'Payment fees', pct: 8, accent: 'amber' },
{ label: 'Legal and admin', pct: 6, accent: 'blue' },
{ label: 'Reserve', pct: 3, accent: 'coral' }];


export const SHIPPED = [
{ id: 's1', title: 'Friend Pod recaps', line: 'Voted in Q1 · shipped in May' },
{ id: 's2', title: 'Custom profile pages', line: 'Voted in Q1 · shipped in June' },
{ id: 's3', title: 'Places traveled map', line: 'Voted in Q2 · shipped in July' }];


/**
 * Notes from the co-op that surface in the Announcements carousel on Home.
 * Often empty — an announcement should mean something, so nothing is
 * manufactured to fill the slot.
 */
export const COOP_ANNOUNCEMENTS = [
{
  id: 'ca1',
  title: 'Voting closes Sunday',
  body: 'Three things on the ballot for next quarter. One member, one vote.',
  action: 'Open the portal'
},
{
  id: 'ca2',
  title: 'This quarter’s books are up',
  body: 'Where every dollar of dues went, line by line.',
  action: 'See the numbers'
}];


export const MEMBERSHIP = {
  since: 'March 2026',
  renews: 'March 2027',
  dues: '$24 a year',
  members: 12480
};