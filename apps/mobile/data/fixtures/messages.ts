// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake inbox threads and your contact card for demo mode only. Screens never
// import this — they go through data/messages.ts.
//
// SECURITY note: these fixtures are plaintext so you can preview the UI on
// localhost. Production messages are end-to-end encrypted; the server only
// ever stores ciphertext. Never copy this plaintext pattern into the live API.
// ============================================
import type { Accent, ContactCard, Message } from '@bridger/shared';

/** One inbox row + its open bubbles for the demo player. */
export type DemoThread = {
  id: string;
  personId: string;
  name: string;
  emoji: string;
  accent: Accent;
  preview: string;
  time: string;
  unread?: boolean;
  theirLeft: number;
  myLeft: number;
  bubbles: Array<{
    id: string;
    from: 'me' | 'them';
    text: string;
    phone?: string;
    kind?: Message['kind'];
    countsAgainstCap?: boolean;
  }>;
};

export const THREADS: DemoThread[] = [
  {
    id: 't1',
    personId: 'maya',
    name: 'Jade Watkins',
    emoji: '🌻',
    accent: 'teal',
    preview: 'replied to your story · that sky is unreal',
    time: '12m',
    unread: true,
    theirLeft: 3,
    myLeft: 2,
    bubbles: [
      {
        id: 'b0',
        from: 'them',
        text: 'that sky is unreal',
        kind: 'storyReply',
        countsAgainstCap: false
      },
      { id: 'b1', from: 'them', text: 'yo you around this weekend?' },
      { id: 'b2', from: 'me', text: "yeah! let's climb" },
      { id: 'b3', from: 'them', text: 'perfect, text me', phone: '555-0142' }
    ]
  },
  {
    id: 't2',
    personId: 'ines',
    name: 'Janna Allred',
    emoji: '🌿',
    accent: 'purple',
    preview: "here's my number · 555-0199",
    time: '1h',
    theirLeft: 5,
    myLeft: 4,
    bubbles: [
      { id: 'b1', from: 'them', text: "here's my number", phone: '555-0199' },
      { id: 'b2', from: 'me', text: 'saved. texting you now' }
    ]
  },
  {
    id: 't3',
    personId: 'theo',
    name: 'Ben Chamberlin',
    emoji: '🌮',
    accent: 'amber',
    preview: "let's just do Friday",
    time: '3h',
    /** they burned their 5 — show the "can't reply" notice */
    theirLeft: 0,
    myLeft: 5,
    bubbles: [
      { id: 'b1', from: 'me', text: 'thursday or friday?' },
      { id: 'b2', from: 'them', text: "let's just do Friday" }
    ]
  },
  {
    id: 't4',
    personId: 'devon',
    name: 'Kelton Burns',
    emoji: '🎧',
    accent: 'blue',
    preview: 'Shared their contact card',
    time: 'Yesterday',
    theirLeft: 4,
    myLeft: 0,
    bubbles: [
      { id: 'b1', from: 'them', text: 'crate dig sunday?' },
      { id: 'b2', from: 'me', text: 'i am so in' },
      { id: 'b3', from: 'me', text: 'noon at the usual?' },
      { id: 'b4', from: 'me', text: 'or later if you are sleeping in' },
      { id: 'b5', from: 'me', text: 'either works' },
      { id: 'b6', from: 'me', text: 'just say when', countsAgainstCap: true },
      {
        id: 'b7',
        from: 'them',
        text: 'Shared their contact card',
        kind: 'contactCard',
        countsAgainstCap: false
      }
    ]
  }
];

export const CONTACT_CARD: ContactCard = {
  userId: 'me',
  displayName: 'Brant Johnson',
  emoji: '🌸',
  fields: [
    { id: 'c1', kind: 'phone', label: 'Phone', value: '555-0142', enabled: true },
    { id: 'c2', kind: 'instagram', label: 'Instagram', value: '@brant', enabled: true },
    { id: 'c3', kind: 'email', label: 'Email', value: 'brant@example.com', enabled: false }
  ]
};
