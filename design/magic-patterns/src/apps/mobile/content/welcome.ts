/** Editable beat copy for the non-skippable welcome sequence. */
export type WelcomeBeat = {
  id: string;
  text: string;
  kind?: 'text' | 'stat';
  /** cited source — replace the placeholder figure before shipping */
  source?: string;
};

export const WELCOME_BEATS: WelcomeBeat[] = [
{ id: 'b1', text: 'Social media was supposed to connect us.' },
{ id: 'b2', text: 'It was supposed to help us keep in touch.' },
{ id: 'b3', text: 'To help us make new friends.' },
{ id: 'b4', text: 'To help us live our lives, not watch other people live theirs.' },
{
  id: 'b5',
  text: 'The average adult spends 2h 24m a day on social media.',
  kind: 'stat',
  source: 'DataReportal, Digital 2024 — replace with a verified figure'
},
{ id: 'b6', text: "So let's try again." },
{ id: 'b7', text: 'Welcome to Bridger.' }];


export const BEAT_MS = 2600;