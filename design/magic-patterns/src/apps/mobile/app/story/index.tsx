import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckIcon,
  ChevronDownIcon,
  MessageCircleIcon,
  SmileIcon,
  VideoIcon,
  XIcon } from
'lucide-react';
import { CatchUpItem } from '../../../../packages/shared';
import {
  ACCENTS,
  Avatar,
  ButtonSecondary,
  CoverArt,
  PixelHeading,
  cn } from
'../../../../packages/ui';
import {
  CATCH_UP,
  CURRENTLY,
  POLL_RESULTS,
  STORY_POSTS,
  STORY_REPLIES,
  WEEK_DAYS,
  personById } from
'../../state/mock-data';

const POST_MS = 6000;

/** Player-style viewer: timed bars, floating reactions, swipe-up Catch-Up. */
export function StoryViewer({
  authorId = 'maya',
  onClose,
  startCatchUpOpen = false,
  startCommentsOpen = false





}: {authorId?: string;onClose?: () => void;startCatchUpOpen?: boolean;startCommentsOpen?: boolean;}) {
  const author = personById(authorId);
  const posts = STORY_POSTS;
  const [index, setIndex] = React.useState(0);
  const [catchUpOpen, setCatchUpOpen] = React.useState(startCatchUpOpen);
  const [commentsOpen, setCommentsOpen] = React.useState(startCommentsOpen);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const paused = catchUpOpen || commentsOpen || menuOpen;
  const post = posts[index];
  const token = ACCENTS[post.accent];

  React.useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => {
      setIndex((i) => i + 1 < posts.length ? i + 1 : i);
    }, POST_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, posts.length]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', token.bg)}>
      <button
        type="button"
        aria-label="Next post"
        onClick={() => setIndex((i) => (i + 1) % posts.length)}
        className="absolute inset-0 flex items-center justify-center">
        
        <span aria-hidden="true" className="text-[128px] opacity-90">
          {post.emoji}
        </span>
        {post.overlayText &&
        <span className="absolute left-1/2 top-[32%] -translate-x-1/2 -rotate-2 bg-white px-3 py-1 font-pixel text-[20px] text-ink">
            {post.overlayText}
          </span>
        }
      </button>

      <FloatingReactions onOpen={() => setCommentsOpen(true)} paused={paused} />

      {/* timed progress + header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-4">
        <div className="flex gap-1.5">
          {posts.map((p, i) =>
          <span key={p.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/40">
              {i < index ?
            <span className="block h-full rounded-full bg-white" /> :
            i === index ?
            <motion.span
              key={`${p.id}-${paused ? 'hold' : 'run'}`}
              className="block h-full origin-left rounded-full bg-white"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: paused ? 0.25 : 1 }}
              transition={{ duration: paused ? 0.2 : POST_MS / 1000, ease: 'linear' }} /> :

            null}
            </span>
          )}
        </div>

        <div className="pointer-events-auto relative mt-3 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`${author.name} options`}
            aria-expanded={menuOpen}
            className="relative flex items-center gap-2.5">
            
            <span className="relative">
              <Avatar name={author.name} emoji={author.emoji} accent={author.accent} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-ink">
                <ChevronDownIcon className="h-3 w-3" strokeWidth={3} />
              </span>
            </span>
            <span className="text-left">
              <span className="block text-[14px] font-bold text-white drop-shadow">
                {author.name}
              </span>
              <span className="block text-[11px] font-semibold text-white/80">
                {post.createdAt}
                {post.themeSlug ? ' · Take 0.5' : ''}
              </span>
            </span>
          </button>

          <span className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink">
            
            <XIcon className="h-5 w-5" strokeWidth={2.6} />
          </button>

          <AnimatePresence>
            {menuOpen &&
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 top-12 z-30 w-44 overflow-hidden rounded-card border border-ink-line bg-white">
              
                {['View profile', 'Mute stories', 'Report'].map((item) =>
              <button
                key={item}
                type="button"
                onClick={() => setMenuOpen(false)}
                className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-ink hover:bg-[#F1ECFF]">
                
                    {item}
                  </button>
              )}
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>

      {/* right reaction rail */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
        <button
          type="button"
          aria-label="Record a video reply"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-ink text-white">
          
          <VideoIcon className="h-6 w-6" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          aria-label="Send a sticker"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink">
          
          <SmileIcon className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          aria-label="Comments"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink">
          
          <MessageCircleIcon className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {post.caption &&
      <p className="absolute bottom-[190px] left-0 max-w-[240px] px-4 text-[15px] font-bold leading-snug text-white drop-shadow">
          {post.caption}
        </p>
      }

      <CatchUpPanel
        open={catchUpOpen}
        onOpenChange={setCatchUpOpen}
        authorName={author.name.split(' ')[0]} />
      
      <CommentSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </div>);

}

/** Every reaction rises the full height like a balloon, then pops out at the top. */
function FloatingReactions({ onOpen, paused }: {onOpen: () => void;paused: boolean;}) {
  const items = STORY_REPLIES.slice(0, 5);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((r, i) => {
        const person = personById(r.authorId);
        return (
          <motion.button
            key={r.id}
            type="button"
            onClick={onOpen}
            initial={{ y: 0, opacity: 0 }}
            animate={paused ? { opacity: 0 } : { y: '-105vh', opacity: [0, 1, 1, 0.9, 0] }}
            transition={{ duration: 11, delay: i * 2.2, repeat: Infinity, ease: 'linear' }}
            style={{ left: `${8 + i * 17}%` }}
            className="pointer-events-auto absolute bottom-0 flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1.5">
            
            <span aria-hidden="true" className="text-[13px]">
              {person.emoji}
            </span>
            {r.kind === 'text' &&
            <span className="max-w-[132px] truncate text-[12px] font-semibold text-ink">
                {r.text}
              </span>
            }
            {r.kind === 'sticker' && <span className="text-[16px]">{r.stickerId}</span>}
            {r.kind === 'circleVideo' &&
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
                <VideoIcon className="h-3 w-3" strokeWidth={3} />
              </span>
            }
          </motion.button>);

      })}
    </div>);

}

/** How much of the panel peeks above the fold when it's closed. */
const PEEK_PX = 172;

/**
 * One panel, two positions. What peeks above the fold is literally the top of
 * the sheet, so swiping up slides the same surface into view. Nothing redraws.
 */
function CatchUpPanel({
  open,
  onOpenChange,
  authorName




}: {open: boolean;onOpenChange: (v: boolean) => void;authorName: string;}) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  /**
   * Things that still want an answer come first. Anything you already settled
   * sinks to the very bottom as a one-line row — it's a receipt, not a card,
   * and it never re-shows the results you already saw.
   */
  const settled = CATCH_UP.filter((i) => i.answeredByViewer);
  const live = CATCH_UP.filter((i) => !i.answeredByViewer);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex flex-col justify-end">
      <AnimatePresence>
        {open &&
        <motion.button
          type="button"
          aria-label="Close Catch-Up"
          onClick={() => onOpenChange(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto absolute inset-0 bg-ink/40" />

        }
      </AnimatePresence>

      <motion.section
        aria-label="Catch-Up"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y < -40) onOpenChange(true);
          if (info.offset.y > 60) onOpenChange(false);
        }}
        animate={{ y: open ? 0 : `calc(100% - ${PEEK_PX}px)` }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="bg-app-grid pointer-events-auto relative h-[88%] cursor-grab touch-none overflow-hidden rounded-t-3xl active:cursor-grabbing">
        
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label={open ? 'Close Catch-Up' : 'Open Catch-Up'}
          className="flex w-full items-center justify-between px-5 pb-2 pt-3">
          
          <span className="font-pixel text-[19px] text-ink">Catch-Up</span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft">
            
            <ChevronDownIcon
              className={cn('h-5 w-5 transition-transform', !open && 'rotate-180')}
              strokeWidth={2.6} />
            
          </span>
        </button>

        <div
          className={cn(
            'no-scrollbar h-[calc(100%-44px)] space-y-3 px-5 pb-10',
            open ? 'overflow-y-auto' : 'overflow-hidden'
          )}>
          
          {/* what still needs you, first */}
          {live.map((item) =>
          <ActionableCard
            key={item.id}
            item={item}
            answer={answers[item.id]}
            onAnswer={(choice) => setAnswers((a) => ({ ...a, [item.id]: choice }))} />

          )}

          <CurrentlyCard />

          {/* the reason people come back: a photo a day, big */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <PixelHeading size="lg">{authorName}'s week</PixelHeading>
              <span className="text-[12px] font-bold text-ink-mute">
                {WEEK_DAYS.length} days
              </span>
            </div>

            <div className="space-y-5">
              {WEEK_DAYS.map((d) =>
              <article key={d.day} className="overflow-hidden rounded-card bg-white">
                  <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
                    <h4 className="text-[22px] font-bold leading-none tracking-tight text-ink">
                      {d.day}
                    </h4>
                    <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px]',
                      ACCENTS[d.accent].tintSolid
                    )}>
                    
                      {d.emoji}
                    </span>
                  </div>

                  <div className="aspect-square w-full overflow-hidden bg-surface">
                    <img
                    src={d.photo}
                    alt={`${d.day}: ${d.note}`}
                    className="h-full w-full object-cover" />
                  
                  </div>

                  <p className="px-4 pb-4 pt-3 text-[14px] font-semibold leading-snug text-ink">
                    {d.caption}
                  </p>
                </article>
              )}
            </div>
          </section>

          {/* answered and still open on their story — the quietest thing here */}
          {settled.length > 0 &&
          <section className="pt-2">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                You already answered
              </p>
              <div className="space-y-2">
                {settled.map((item) =>
              <SettledRow key={item.id} item={item} />
              )}
              </div>
            </section>
          }
        </div>
      </motion.section>
    </div>);

}

function ActionableCard({
  item,
  answer,
  onAnswer




}: {item: CatchUpItem;answer?: string;onAnswer: (choice: string) => void;}) {
  const token = ACCENTS[item.accent];
  const answered = Boolean(answer) || item.answeredByViewer;
  const results = POLL_RESULTS[item.id];
  const going = answer === 'going';

  return (
    <article className={cn('overflow-hidden rounded-card', token.tintSolid)}>
      {/* an event looks like an event everywhere — cover art included */}
      {item.kind === 'event' &&
      <div className="h-24 w-full overflow-hidden">
          <CoverArt cover={item.cover} accent={item.accent} />
        </div>
      }

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-mute">
              {item.kind}
              {/* the countdown is a clause, not a card of its own */}
              {item.countdown && !going && <span> · {item.countdown}</span>}
            </p>
            <h3 className="mt-0.5 text-[16px] font-bold leading-snug tracking-tight text-ink">
              {item.title}
            </h3>
            {item.detail &&
            <p className="text-[12px] font-semibold text-ink-soft">{item.detail}</p>
            }
          </div>
          {item.kind !== 'event' &&
          <span aria-hidden="true" className="shrink-0 text-[20px]">
              {item.emoji}
            </span>
          }
        </div>

      {item.kind === 'poll' && (
        answered ?
        <div className="mt-4 space-y-2">
            {item.options?.map((o, i) => {
            const pct = results?.[i] ?? 50;
            const mine = answer === o;
            return (
              <div key={o} className="relative overflow-hidden rounded-full bg-white">
                  <div
                  className={cn('absolute inset-y-0 left-0', mine ? 'bg-success' : 'bg-ink/15')}
                  style={{ width: `${pct}%` }} />
                
                  <div className="relative flex items-center justify-between px-4 py-2">
                    <span className={cn('text-[13px] font-bold', mine ? 'text-white' : 'text-ink')}>
                      {o}
                      {mine ? ' ✓' : ''}
                    </span>
                    <span className={cn('text-[12px] font-bold', mine ? 'text-white' : 'text-ink-soft')}>
                      {pct}%
                    </span>
                  </div>
                </div>);

          })}
          </div> :

        <div className="mt-3 flex gap-2">
            {item.options?.map((o) =>
          <ButtonSecondary key={o} size="sm" full onClick={() => onAnswer(o)}>
                {o}
              </ButtonSecondary>
          )}
          </div>)
        }

      {item.kind === 'event' && (
        going ? (
        /* saying yes turns the card into a live countdown to the thing */
        <EventCountdown minutes={item.startsInMinutes ?? 60} />) :

        <div className="mt-3 flex gap-2">
            <ButtonSecondary
            size="sm"
            full
            tone={answer === 'cant' ? 'solid' : 'outline'}
            onClick={() => onAnswer('cant')}>
            
              Can't
            </ButtonSecondary>
            <ButtonSecondary size="sm" full tone="positive" onClick={() => onAnswer('going')}>
              Going
            </ButtonSecondary>
          </div>)
        }

      {item.kind === 'question' && !answered &&
        <div className="mt-3">
          <ButtonSecondary size="sm" full tone="positive" onClick={() => onAnswer('answered')}>
            Answer
          </ButtonSecondary>
        </div>
        }
      </div>
    </article>);

}

/**
 * Live countdown after you say you're going. Days and hours tick down for real,
 * so the card stops being a decision and becomes anticipation.
 */
function EventCountdown({ minutes }: {minutes: number;}) {
  const [left, setLeft] = React.useState(minutes * 60);

  React.useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  const days = Math.floor(left / 86400);
  const hours = Math.floor(left % 86400 / 3600);
  const mins = Math.floor(left % 3600 / 60);
  const secs = left % 60;
  const parts: Array<[number, string]> = [
  [days, 'days'],
  [hours, 'hrs'],
  [mins, 'min'],
  [secs, 'sec']];


  return (
    <div className="mt-3 rounded-card bg-white p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-success">
        <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        You're going
      </p>
      <div className="mt-2 flex gap-2" aria-live="off">
        {parts.map(([n, unit]) =>
        <span key={unit} className="flex-1 rounded-lg bg-surface px-2 py-1.5 text-center">
            <span className="block font-pixel text-[17px] leading-none text-ink">
              {String(n).padStart(2, '0')}
            </span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-wide text-ink-mute">
              {unit}
            </span>
          </span>
        )}
      </div>
    </div>);

}

/** Something you already answered: one quiet line, no results re-shown. */
function SettledRow({ item }: {item: CatchUpItem;}) {
  return (
    <div className="flex items-center gap-2.5 rounded-card border border-ink-line bg-white px-3.5 py-2.5">
      <span aria-hidden="true" className="shrink-0 text-[15px]">
        {item.emoji}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-soft">
        {item.title}
      </span>
      <CheckIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />
    </div>);

}

/**
 * Currently — split in two so listening and reading sit side by side. It's a
 * detail, not a headline, so it earns half the height it used to take.
 */
function CurrentlyCard() {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/15">
      {[
      {
        label: 'Listening',
        emoji: CURRENTLY.listening.emoji,
        title: CURRENTLY.listening.title,
        sub: CURRENTLY.listening.artist,
        tint: 'bg-blue'
      },
      {
        label: 'Reading',
        emoji: CURRENTLY.reading.emoji,
        title: CURRENTLY.reading.title,
        sub: CURRENTLY.reading.author,
        tint: 'bg-amber'
      }].
      map((c) =>
      <div key={c.label} className="flex items-center gap-2.5 bg-ink px-3 py-2.5 text-white">
          <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[17px]',
            c.tint
          )}>
          
            {c.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-wide text-white/50">
              {c.label}
            </span>
            <span className="block truncate text-[13px] font-bold leading-tight">{c.title}</span>
            <span className="block truncate text-[11px] font-semibold text-white/60">{c.sub}</span>
          </span>
        </div>
      )}
    </section>);

}

function CommentSheet({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const [draft, setDraft] = React.useState('');
  /** who the composer is aimed at, set by a Reply under someone's comment */
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const roots = STORY_REPLIES.filter((r) => !r.parentReactionId);

  return (
    <AnimatePresence>
      {open &&
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <motion.button
          type="button"
          aria-label="Close comments"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/40" />
        
          <motion.div
          role="dialog"
          aria-label="Comments"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="relative max-h-[80%] rounded-t-3xl bg-white">
          
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <span className="font-pixel text-[19px] text-ink">Replies</span>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft">
              
                <ChevronDownIcon className="h-5 w-5" strokeWidth={2.6} />
              </button>
            </div>

            <div className="no-scrollbar max-h-[46vh] space-y-4 overflow-y-auto px-5 pb-4">
              {roots.map((r) => {
              const person = personById(r.authorId);
              const children = STORY_REPLIES.filter((c) => c.parentReactionId === r.id);
              return (
                <div key={r.id}>
                    <ReplyRow
                    reaction={r}
                    name={person.name}
                    emoji={person.emoji}
                    accent={person.accent}
                    onReply={setReplyTo} />
                  
                    {children.length > 0 &&
                  <div className="mt-3 space-y-3 border-l border-ink-line pl-4">
                        {children.map((c) => {
                      const cp = personById(c.authorId);
                      return (
                        <ReplyRow
                          key={c.id}
                          reaction={c}
                          name={cp.name}
                          emoji={cp.emoji}
                          accent={cp.accent}
                          onReply={setReplyTo} />);


                    })}
                      </div>
                  }
                  </div>);

            })}
            </div>

            {replyTo &&
          <div className="flex items-center gap-2 border-t border-ink-line bg-surface px-5 py-2">
                <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink-soft">
                  Replying to {replyTo}
                </p>
                <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-mute hover:bg-white">
              
                  <XIcon className="h-3.5 w-3.5" strokeWidth={2.8} />
                </button>
              </div>
          }

            <div className="flex items-center gap-2 border-t border-ink-line px-5 py-3 pb-5">
              <button
              type="button"
              aria-label="Record a video reply"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              
                <VideoIcon className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <button
              type="button"
              aria-label="Send a sticker"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-line text-ink">
              
                <SmileIcon className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo}` : 'Reply'}
              aria-label="Reply"
              className="h-10 min-w-0 flex-1 rounded-full border border-ink-line px-4 text-[14px] font-semibold text-ink placeholder:font-medium placeholder:text-ink-mute focus:outline-none" />
            
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}

function ReplyRow({
  reaction,
  name,
  emoji,
  accent,
  onReply







}: {reaction: (typeof STORY_REPLIES)[number];name: string;emoji: string;accent: Parameters<typeof Avatar>[0]['accent']; /** answering one person directly, rather than shouting at the thread */onReply?: (name: string) => void;}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={name} emoji={emoji} accent={accent} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-ink">
          {name.split(' ')[0]}{' '}
          <span className="text-[11px] font-semibold text-ink-mute">{reaction.at}</span>
        </p>
        {reaction.kind === 'text' &&
        <p className="text-[14px] font-medium text-ink-soft">{reaction.text}</p>
        }
        {reaction.kind === 'sticker' && <p className="text-[24px] leading-none">{reaction.stickerId}</p>}
        {reaction.kind === 'circleVideo' &&
        <span className="mt-1 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-purple text-white">
            <VideoIcon className="h-5 w-5" strokeWidth={2.4} />
          </span>
        }

        {/* deliberately quiet — present under every reply, never competing with it */}
        {onReply &&
        <button
          type="button"
          onClick={() => onReply(name.split(' ')[0])}
          className="mt-1 text-[11px] font-bold text-ink-mute transition-colors hover:text-purple">
          
            Reply
          </button>
        }
      </div>
    </div>);

}