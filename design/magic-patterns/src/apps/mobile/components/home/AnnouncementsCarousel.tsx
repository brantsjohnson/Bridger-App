import React from 'react';
import { ChevronRightIcon, MegaphoneIcon, XIcon } from 'lucide-react';
import { ButtonSecondary, PixelHeading, cn } from '../../../../packages/ui';
import { COOP_ANNOUNCEMENTS } from '../../state/coop';

export type Announcement = {
  id: string;
  /** what it is, so the carousel can render the right card */
  kind: 'grass' | 'quickCheck' | 'coop';
  content: React.ReactNode;
};

/**
 * Announcements — the one spot at the top of Home for anything that wants
 * attention today: a friend who touched grass, a quick check, a note from the
 * co-op. It's a swipeable carousel because these arrive in ones and twos and
 * shouldn't stack into a wall. When nothing is live the whole section is gone,
 * heading and all — an empty announcements tab is worse than none.
 */
export function AnnouncementsCarousel({ items }: {items: Announcement[];}) {
  const [index, setIndex] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);

  /** a dismissal can shrink the list out from under the current page */
  React.useEffect(() => {
    if (index > items.length - 1) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  if (items.length === 0) return null;

  const goTo = (i: number) => {
    setIndex(i);
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  /** the dots follow a real swipe, not just taps */
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== index) setIndex(next);
  };

  return (
    <section aria-label="Announcements" className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <MegaphoneIcon aria-hidden="true" className="h-4 w-4 text-ink-mute" strokeWidth={2.5} />
          <PixelHeading size="md">Announcements</PixelHeading>
        </span>

        {items.length > 1 &&
        <span className="flex items-center gap-1.5">
            {items.map((item, i) =>
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Announcement ${i + 1} of ${items.length}`}
            aria-current={i === index}
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'w-5 bg-ink' : 'w-2 bg-ink-line'
            )} />

          )}
          </span>
        }
      </div>

      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto px-5">
        
        {items.map((item) =>
        <li
          key={item.id}
          className="grid w-full shrink-0 snap-center grid-rows-1 items-stretch pr-3 last:pr-0 [&>*]:min-h-[124px]">
          
            {item.content}
          </li>
        )}
      </ul>
    </section>);

}

/** A note from the co-op — a call, a vote closing, books published. */
export function CoopAnnouncementCard({
  announcement,
  onOpen,
  onDismiss




}: {announcement: (typeof COOP_ANNOUNCEMENTS)[number];onOpen?: () => void;onDismiss?: () => void;}) {
  return (
    <article className="relative flex flex-col rounded-[26px_10px_26px_10px] bg-[#D7F0E8] px-4 py-3.5">
      {onDismiss &&
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-mute hover:bg-white">
        
          <XIcon className="h-4 w-4" strokeWidth={2.6} />
        </button>
      }

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
        From the co-op
      </p>
      <p className="mt-1 pr-8 text-[16px] font-bold leading-snug tracking-tight text-ink">
        {announcement.title}
      </p>
      <p className="mt-1 pr-4 text-[13px] font-semibold leading-snug text-ink-soft">
        {announcement.body}
      </p>

      <div className="mt-auto pt-3">
        <ButtonSecondary
          size="sm"
          onClick={onOpen}
          icon={<ChevronRightIcon className="h-4 w-4" strokeWidth={2.5} />}>
          
          {announcement.action}
        </ButtonSecondary>
      </div>
    </article>);

}