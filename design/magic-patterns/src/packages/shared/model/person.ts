import { Tier } from './tier';

export type Accent =
  | 'purple'
  | 'coral'
  | 'teal'
  | 'amber'
  | 'pink'
  | 'blue'
  | 'green';

export interface Person {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  accent: Accent;
  tier: Tier;
  /** short, real label — not a bio paragraph (fallback when no song/book) */
  label: string;
  /** how many friends you share (In common / intros — not the Friends roster line) */
  mutuals: number;
  /** a ring on the avatar means they posted; no presence dots anywhere */
  story?: 'unseen' | 'seen';
  /** Song of the week — preferred subtitle on Friends roster rows */
  song?: { title: string; artist: string };
  /** What they're reading — roster fallback when there's no song */
  book?: { title: string; author: string };
}

/**
 * One quiet line under a friend's name on the Friends roster: song of the week
 * first, then the book they're reading. Never mutual counts.
 */
export function personVibeLine(
  person: Pick<Person, 'song' | 'book' | 'label'>
): string {
  if (person.song?.title?.trim()) {
    const artist = person.song.artist?.trim();
    return artist ? `${person.song.title.trim()} · ${artist}` : person.song.title.trim();
  }
  if (person.book?.title?.trim()) {
    const author = person.book.author?.trim();
    return author ? `${person.book.title.trim()} · ${author}` : person.book.title.trim();
  }
  return person.label?.trim() ?? '';
}
