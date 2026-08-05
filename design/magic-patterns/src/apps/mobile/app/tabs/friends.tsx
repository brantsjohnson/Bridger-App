import React from 'react';
import { CakeIcon, ChevronRightIcon, PartyPopperIcon, PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tier, TIER_LABEL, personVibeLine } from '../../../../packages/shared';
import {
  Avatar,
  Breathe,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  SectionCount,
  cn } from
'../../../../packages/ui';
import { AddFriendSheet } from '../../components/AddFriendSheet';
import { ColdStart } from '../../components/ColdStart';
import { FriendPodWidget } from '../../components/home/FriendPodWidget';
import { InsideJokesWidget } from '../../components/home/widgets';
import { AddInsideJokeSheet } from '../../components/profile/InsideJokesWall';
import { SubmitQuestion } from '../../components/pod/SubmitQuestion';
import { PEOPLE } from '../../state/mock-data';
import { BIRTHDAYS } from '../../state/connections';

/** Feature flag — when false the search bar is not rendered at all. */
const searchEnabled = false;

const TIERS: Tier[] = ['close', 'friend', 'acquaintance'];

/** Solid hover washes — never a transparent grey. */
const ROW_HOVER = [
'hover:border-purple/40 hover:bg-[#EFE7FF]',
'hover:border-pink/40 hover:bg-[#FFE4EE]',
'hover:border-amber/50 hover:bg-[#FFF1D6]',
'hover:border-teal/40 hover:bg-[#DCF3EA]'];


export function FriendsScreen({
  empty: emptyProp = false,
  onOpenPerson,
  onOpenStory,
  onOpenPod,
  onOpenPodRecord







}: { /** day one: nobody in your circles yet */empty?: boolean;onOpenPerson?: (id: string) => void;onOpenStory?: (id: string) => void;onOpenPod?: () => void;onOpenPodRecord?: () => void;}) {
  const [query, setQuery] = React.useState('');
  const [addOpen, setAddOpen] = React.useState(false);
  const [questionOpen, setQuestionOpen] = React.useState(false);
  /** the "+" beside the Inside jokes heading */
  const [jokeOpen, setJokeOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overTier, setOverTier] = React.useState<Tier | null>(null);
  const [tiers, setTiers] = React.useState<Record<string, Tier>>(
    Object.fromEntries(PEOPLE.map((p) => [p.id, p.tier]))
  );

  const roster = emptyProp ?
  [] :
  PEOPLE.filter((p) =>
  searchEnabled ? p.name.toLowerCase().includes(query.toLowerCase()) : true
  );
  const empty = roster.length === 0;

  const drop = (tier: Tier) => {
    if (dragId) setTiers((prev) => ({ ...prev, [dragId]: tier }));
    setDragId(null);
    setOverTier(null);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Friends"
        trailing={
        <span className="flex items-center gap-2">
            <ButtonSecondary size="sm" tone={editing ? 'solid' : 'outline'} onClick={() => setEditing((v) => !v)}>
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add friend"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
            
              <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2.6} />
            </button>
          </span>
        } />
      
      <ScreenBody>
        {searchEnabled &&
        <Breathe>
            <SearchField value={query} onChange={setQuery} placeholder="Search friends" />
          </Breathe>
        }

        {/* your friends' week, then what they've written on your wall */}
        {!empty &&
        <>
            <Breathe>
              <section className="!mt-0">
                <PixelHeading size="md" className="mb-2">
                  Friend Pod
                </PixelHeading>
                <FriendPodWidget
                size="full"
                onPlay={() => onOpenPod?.()}
                onRecord={() => onOpenPodRecord?.()}
                onSubmitQuestion={() => setQuestionOpen(true)} />
              
              </section>
            </Breathe>

            <Breathe>
              <section className="mt-7">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <PixelHeading size="md">Inside jokes</PixelHeading>
                  {/* adding one is a small "+", never a central create menu */}
                  <button
                  type="button"
                  onClick={() => setJokeOpen(true)}
                  aria-label="Add an Inside Joke"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple text-[18px] font-bold leading-none text-onaccent transition-transform active:scale-95">
                  
                    +
                  </button>
                </div>
                <InsideJokesWidget size="full" />
              </section>
            </Breathe>
          </>
        }

        {editing &&
        <p className="mb-1 mt-7 text-[12px] font-semibold text-ink-mute">
            Drag a friend into a group.
          </p>
        }

        {empty ?
        <Breathe>
            <div className="mt-4">
              <ColdStart onAdd={() => setAddOpen(true)} />
            </div>
          </Breathe> :

        TIERS.map((tier) => {
          const group = roster.filter((p) => tiers[p.id] === tier);
          if (group.length === 0 && !editing) return null;
          const isOver = editing && overTier === tier;

          return (
            <Breathe key={tier}>
                <section
                onDragOver={(e) => {
                  if (!editing) return;
                  e.preventDefault();
                  setOverTier(tier);
                }}
                onDragLeave={() => setOverTier((t) => t === tier ? null : t)}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(tier);
                }}
                className={cn(
                  'rounded-card transition-colors',
                  editing && 'border border-dashed border-ink/20 p-3',
                  isOver && 'border-solid border-purple bg-purple/10'
                )}>
                
                  <div className="section-title mb-2">
                    <SectionCount label={TIER_LABEL[tier]} count={group.length} />
                  </div>

                  <div className="space-y-2.5">
                    {group.length === 0 && editing &&
                  <p className="py-3 text-center text-[12px] font-semibold text-ink-mute">
                        Drop someone here
                      </p>
                  }

                    {group.map((p, i) =>
                  <div
                    key={p.id}
                    draggable={editing}
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                    role={editing ? undefined : 'button'}
                    tabIndex={editing ? -1 : 0}
                    onClick={() => !editing && onOpenPerson?.(p.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-card border px-3.5 py-3 transition-colors',
                      BIRTHDAYS[p.id]?.today ?
                      'border-pink/40 bg-[#FFC0D7]' :
                      'border-ink-line bg-white',
                      editing ?
                      'cursor-grab active:cursor-grabbing' :
                      cn('cursor-pointer', ROW_HOVER[i % ROW_HOVER.length]),
                      dragId === p.id && 'opacity-40'
                    )}>
                    
                        <Avatar
                      name={p.name}
                      emoji={p.emoji}
                      accent={p.accent}
                      story={p.story}
                      onStory={p.story && !editing ? () => onOpenStory?.(p.id) : undefined} />
                    
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[15px] font-bold tracking-tight text-ink">
                            {p.name}
                          </span>
                          <span className="block truncate text-[12px] font-medium text-ink-mute">
                            {BIRTHDAYS[p.id]?.today
                              ? 'Birthday today'
                              : personVibeLine(p)}
                          </span>
                        </span>
                        {BIRTHDAYS[p.id]?.today && !editing &&
                    <span className="flex shrink-0 items-center gap-1 text-pink">
                            <PartyPopperIcon className="h-4 w-4" strokeWidth={2.4} />
                            <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                        
                              <CakeIcon className="h-5 w-5" strokeWidth={2.4} />
                            </motion.span>
                          </span>
                    }
                        {editing ?
                    <span aria-hidden="true" className="px-1 text-[16px] leading-none text-ink-mute">
                            ⠿
                          </span> :

                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.5} />
                    }
                      </div>
                  )}
                  </div>
                </section>
              </Breathe>);

        })
        }
      </ScreenBody>

      <AddFriendSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <SubmitQuestion open={questionOpen} onClose={() => setQuestionOpen(false)} />
      <AddInsideJokeSheet
        open={jokeOpen}
        onClose={() => setJokeOpen(false)}
        onAdd={() => undefined} />
      
    </Screen>);

}