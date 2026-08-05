// ============================================
// WHAT THIS FILE DOES (plain English):
// Static "how the co-op works" copy for the Model page — phases and a
// comparison vs other member-owned orgs. External hrefs open Green Bay /
// REI / credit-union explainers in the browser (same URLs as the old web portal).
// ============================================

export type CompareCell = 'yes' | 'planned' | 'limited' | 'no';

export type CompareColumn = {
  label: string;
  /** Opens in the device browser when set */
  href?: string;
};

export const COMPARE_COLUMNS: CompareColumn[] = [
  {
    label: 'Green Bay Packers',
    href: 'https://www.packers.com/community/shareholders'
  },
  {
    label: 'REI',
    href: 'https://www.rei.com/about-rei/governance'
  },
  {
    label: 'Credit Union',
    href: 'https://corporatefinanceinstitute.com/resources/wealth-management/credit-union/'
  },
  { label: 'Phase 0' },
  { label: 'Phase 1' },
  { label: 'Phase 2' },
  { label: 'Phase 3' }
];

export const COMPARE_ROWS: { row: string; values: CompareCell[] }[] = [
  {
    row: 'Suggest features & ideas',
    values: ['no', 'limited', 'no', 'yes', 'yes', 'yes', 'yes']
  },
  {
    row: 'Vote on each version before public use',
    values: ['no', 'no', 'no', 'yes', 'yes', 'yes', 'yes']
  },
  {
    row: 'Cost transparency',
    values: ['limited', 'limited', 'limited', 'limited', 'yes', 'yes', 'yes']
  },
  {
    row: 'Everyday voting (themes, activities, prompts)',
    values: ['no', 'no', 'no', 'no', 'yes', 'yes', 'yes']
  },
  {
    row: 'Member perks & discounts',
    values: ['no', 'yes', 'yes', 'no', 'no', 'yes', 'yes']
  },
  {
    row: 'Elect the board',
    values: ['yes', 'yes', 'yes', 'no', 'no', 'no', 'yes']
  },
  {
    row: 'Profit sharing (when possible)',
    values: ['no', 'no', 'no', 'no', 'no', 'no', 'yes']
  },
  {
    row: 'Amend the charter',
    values: ['no', 'limited', 'limited', 'no', 'no', 'no', 'limited']
  }
];

export const PHASES = [
  {
    name: 'Phase 0: Beta Launch',
    cost: 'Free',
    current: true,
    description:
      'Members here are the founding cohort. They get early access and a real hand in shaping the rules the co-op will launch under.',
    includes: [
      'Hands-on early access',
      'Suggest features & ideas',
      'Vote on each version before public use',
      'Shape the draft charter',
      'Ratify the charter & pricing'
    ]
  },
  {
    name: 'Phase 1: Full Co-op',
    cost: 'Dues begin',
    current: false,
    description:
      'Joining means paying dues at the ratified price. Members get full rights, starting with frequent, low-stakes votes.',
    includes: [
      'Vote on quiz themes, activities & daily prompts',
      'Vote on each version before public use',
      'Keep suggesting ideas'
    ]
  },
  {
    name: 'Phase 2: Grow Co-op',
    cost: 'Perks grow',
    current: false,
    description:
      'As the co-op grows, members unlock more organizing power and clearer books.',
    includes: [
      'Member perks & discounts',
      'Deeper cost transparency',
      'Stronger everyday voting'
    ]
  },
  {
    name: 'Phase 3: Elect Board',
    cost: 'Member board',
    current: false,
    description:
      'Members elect a board. Bigger decisions (charter, surplus) sit with people you chose.',
    includes: [
      'Elect the board',
      'Profit sharing when finances allow',
      'Limited charter amendments'
    ]
  }
] as const;

export const WHY_COOP =
  'Bridger is meant to be a tool for people, not an ad machine. A co-op makes that real: members set the rules, see the books, and steer what gets built. Connecting stays free forever.';
