// ============================================
// WHAT THIS FILE DOES (plain English):
// Offline demo content for the Co-op benefits screen and member portal so the
// UI works without the server. Fake proposal titles are fine; navigation still
// goes to real /coop routes.
// ============================================

export type DemoProposal = {
  id: string;
  title: string;
  line: string;
  votes: number;
  myVote: boolean;
  closes: string;
};

export const DEMO_PROPOSALS: DemoProposal[] = [
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
  }
];

export const DEMO_SPEND: Array<{
  label: string;
  pct: number;
  accent: 'purple' | 'teal' | 'amber' | 'coral' | 'blue';
}> = [
  { label: 'People building it', pct: 62, accent: 'purple' },
  { label: 'Servers and storage', pct: 21, accent: 'teal' },
  { label: 'Payment fees', pct: 8, accent: 'amber' },
  { label: 'Legal and admin', pct: 6, accent: 'blue' },
  { label: 'Reserve', pct: 3, accent: 'coral' }
];

export const DEMO_SHIPPED = [
  { id: 's1', title: 'Friend Pod recaps', line: 'Voted in Q1 · shipped in May' },
  { id: 's2', title: 'Custom profile pages', line: 'Voted in Q1 · shipped in June' },
  { id: 's3', title: 'Places traveled map', line: 'Voted in Q2 · shipped in July' }
];

export const DEMO_MEMBERSHIP = {
  since: 'March 2026',
  renews: 'March 2027',
  dues: '$24/year',
  members: 12480
};
