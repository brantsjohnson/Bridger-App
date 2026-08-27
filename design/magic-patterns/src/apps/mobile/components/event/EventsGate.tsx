// ============================================
// WHAT THIS FILE DOES (plain English):
// Magic Patterns twin of the Events marketing gate: headline, three scrolling
// idea rows that bleed off the edges, Explore Events CTA. Chips are decoration
// only.
// ============================================
import { ButtonPrimary, PixelHeading, cn } from '../../../../packages/ui';
import { EventIdeaChip, type EventIdea } from './EventIdeaChip';

const IDEAS: EventIdea[] = [
  { id: 'activism', title: 'Political activism meeting', emoji: '📣', accent: 'coral', kind: 'idea' },
  { id: 'ideas', title: 'Share ideas night', emoji: '💡', accent: 'purple', kind: 'idea' },
  { id: 'tg-1', title: 'Touch grass', emoji: '🌱', accent: 'green', kind: 'touch_grass' },
  { id: 'book', title: 'Book club', emoji: '📚', accent: 'blue', kind: 'idea' },
  { id: 'game', title: 'Game night', emoji: '🎲', accent: 'teal', kind: 'idea' },
  { id: 'sunday', title: 'Sunday dinner', emoji: '🍲', accent: 'coral', kind: 'idea' },
  { id: 'tg-2', title: 'Who is free?', emoji: '🌱', accent: 'green', kind: 'touch_grass' },
  { id: 'cocktail', title: "I don't have anything to wear this to", emoji: '🍸', accent: 'purple', kind: 'idea' },
  { id: 'movie', title: 'Movie night', emoji: '🎬', accent: 'blue', kind: 'idea' },
  { id: 'poetry', title: 'Poetry reading', emoji: '✒️', accent: 'purple', kind: 'idea' },
  { id: 'sketch', title: 'Sketch night', emoji: '✏️', accent: 'purple', kind: 'idea' },
  { id: 'tg-3', title: 'Free tonight', emoji: '🌱', accent: 'green', kind: 'touch_grass' },
  { id: 'walk', title: 'Neighborhood walk', emoji: '🚶', accent: 'green', kind: 'idea' },
  { id: 'potluck', title: 'Potluck', emoji: '🥗', accent: 'teal', kind: 'idea' },
  { id: 'vinyl', title: 'Vinyl swap', emoji: '🎧', accent: 'blue', kind: 'idea' },
  { id: 'brunch', title: 'Lazy brunch', emoji: '🥞', accent: 'coral', kind: 'idea' }
];

function MarqueeRow({
  items,
  reverse,
  duration
}: {
  items: EventIdea[];
  reverse?: boolean;
  duration: string;
}) {
  // THIS SECTION DOES: two equal halves (chips + trailing gap) so -50% lands on a seam.
  // Putting gap inside each half (via pr) avoids the classic flex-gap / -50% jump.
  function half(prefix: string) {
    return (
      <div className="flex shrink-0 gap-2.5 pr-2.5">
        {items.map((idea, i) => (
          <EventIdeaChip key={`${prefix}-${idea.id}-${i}`} idea={idea} />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          'flex w-max will-change-transform motion-reduce:animate-none',
          reverse
            ? 'animate-[marquee-rev_var(--dur)_linear_infinite]'
            : 'animate-[marquee_var(--dur)_linear_infinite]'
        )}
        style={{ ['--dur' as string]: duration, animationDuration: duration }}
      >
        {half('a')}
        {half('b')}
      </div>
    </div>
  );
}

export function EventsGate({ onExplore }: { onExplore: () => void }) {
  const rowA = IDEAS.filter((_, i) => i % 3 === 0);
  const rowB = IDEAS.filter((_, i) => i % 3 === 1);
  const rowC = IDEAS.filter((_, i) => i % 3 === 2);

  return (
    <div className="space-y-5 pb-8 pt-2">
      <PixelHeading size="lg" className="leading-tight text-white">
        Create places where memories happen.
      </PixelHeading>
      <p className="text-[14px] font-semibold leading-relaxed text-white/80">
        Plans, dinners, clubs, nights out. Start something people can return to.
      </p>
      {/* Full-bleed wall: cancel screen body pad so chips leave at the edges */}
      <div className="-mx-5 space-y-2.5">
        <MarqueeRow items={rowA} duration="34s" />
        <MarqueeRow items={rowB} reverse duration="40s" />
        <MarqueeRow items={rowC} duration="36s" />
      </div>
      <div className="space-y-2.5">
        <ButtonPrimary full size="lg" onClick={onExplore}>
          Explore Events
        </ButtonPrimary>
        <p className="text-center text-[12px] font-semibold leading-snug text-white/60">
          Even two people counts. Or use Touch Grass when you are free tonight.
        </p>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-rev {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
