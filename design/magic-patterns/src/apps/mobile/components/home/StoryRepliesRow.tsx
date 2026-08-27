import { ChevronRightIcon, PlayIcon } from 'lucide-react';
import { Avatar, cn } from '../../../../packages/ui';
import { STORY_REPLIES, personById } from '../../state/mock-data';

/**
 * What people said back, right under the stories. A video reply is a face you
 * tap to watch; a text reply is the words themselves. Tapping one chip opens
 * that reply (only that chip should leave the row). The header opens all.
 */
export function StoryRepliesRow({
  onOpen,
  onOpenChip
}: {
  /** Header — open the full replies thread. */
  onOpen?: () => void;
  /** One chip — only that author should leave the row. */
  onOpenChip?: (personId: string) => void;
}) {
  /** top-level only — replies-to-replies belong in the thread, not the summary */
  const replies = STORY_REPLIES.filter((r) => !r.parentReactionId);
  if (replies.length === 0) return null;

  const videos = replies.filter((r) => r.kind === 'circleVideo');

  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={onOpen}
        className="mb-2 flex w-full items-center gap-2 text-left"
      >
        <span className="text-[13px] font-bold text-ink">
          {replies.length} replies to your story
        </span>
        {videos.length > 0 ? (
          <span className="rounded-full bg-[#F1ECFF] px-2 py-0.5 text-[11px] font-bold text-purple">
            {videos.length} video
          </span>
        ) : null}
        <ChevronRightIcon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-ink-mute"
          strokeWidth={2.6}
        />
      </button>

      <ul className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
        {replies.map((r) => {
          const p = personById(r.authorId);
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => (onOpenChip ? onOpenChip(r.authorId) : onOpen?.())}
                className={cn(
                  'flex h-full w-[152px] shrink-0 items-center gap-2.5 rounded-card border border-ink-line bg-white p-2.5 text-left transition-colors hover:bg-[#F1ECFF]',
                  r.kind === 'circleVideo' && 'border-purple/40 bg-[#F7F3FF]'
                )}
              >
                <span className="relative shrink-0">
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
                  {r.kind === 'circleVideo' ? (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-purple text-white"
                    >
                      <PlayIcon className="h-2 w-2 fill-current" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-ink">
                    {p.name.split(' ')[0]}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-ink-mute">
                    {r.kind === 'circleVideo'
                      ? 'Sent a video'
                      : r.kind === 'sticker'
                        ? `Reacted ${r.stickerId ?? ''}`
                        : r.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
