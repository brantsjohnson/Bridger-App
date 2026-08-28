import { Accent } from '../../../packages/shared';

export const DAILY_CAP = 5;

export type Bubble = {
  id: string;
  from: 'me' | 'them';
  text: string;
  /** Shared contact card fields for the in-bubble dropdown. */
  contactFields?: Array<{ label: string; value: string; kind: string }>;
  phone?: string;
};

export type Thread = {
  id: string;
  personId: string;
  name: string;
  emoji: string;
  accent: Accent;
  preview: string;
  time: string;
  unread?: boolean;
  /** how many of their 5 they have left today */
  theirLeft: number;
  myLeft: number;
  bubbles: Bubble[];
};

export const THREADS: Thread[] = [
  {
    id: 't1',
    personId: 'maya',
    name: 'Sam',
    emoji: '🌻',
    accent: 'teal',
    preview: 'yo you around this weekend?',
    time: '2m',
    unread: true,
    theirLeft: 3,
    myLeft: 2,
    bubbles: [
      { id: 'b1', from: 'them', text: 'yo you around this weekend?' },
      { id: 'b2', from: 'me', text: "yeah! let's climb" },
      {
        id: 'b3',
        from: 'them',
        text: '555-0142 · @jade',
        phone: '555-0142',
        contactFields: [
          { label: 'Phone', value: '555-0142', kind: 'phone' },
          { label: 'Instagram', value: '@jade', kind: 'instagram' }
        ]
      }
    ]
  },
  {
    id: 't2',
    personId: 'ines',
    name: 'Priya',
    emoji: '🪩',
    accent: 'purple',
    preview: 'Shared their contact card',
    time: '1h',
    theirLeft: 5,
    myLeft: 4,
    bubbles: [
      {
        id: 'b1',
        from: 'them',
        text: '555-0199',
        phone: '555-0199',
        contactFields: [{ label: 'Phone', value: '555-0199', kind: 'phone' }]
      },
      { id: 'b2', from: 'me', text: 'saved. texting you now' }
    ]
  },
  {
    id: 't3',
    personId: 'theo',
    name: 'Theo',
    emoji: '📷',
    accent: 'amber',
    preview: "let's just do Friday",
    time: '3h',
    theirLeft: 0,
    myLeft: 5,
    bubbles: [
      { id: 'b1', from: 'me', text: 'thursday or friday?' },
      { id: 'b2', from: 'them', text: "let's just do Friday" }
    ]
  }
];

export const CONTACT_CARD = {
  name: 'Jamie Rivera',
  emoji: '🌿',
  fields: [
    { id: 'c1', kind: 'phone' as const, label: 'Phone', value: '555-0142', on: true },
    { id: 'c2', kind: 'instagram' as const, label: 'Instagram', value: '@jamie.r', on: true },
    { id: 'c3', kind: 'email' as const, label: 'Email', value: 'jamie@rivera.co', on: false },
    { id: 'c4', kind: 'website' as const, label: 'Website', value: '', on: false },
    { id: 'c5', kind: 'substack' as const, label: 'Substack', value: '', on: false }
  ]
};
