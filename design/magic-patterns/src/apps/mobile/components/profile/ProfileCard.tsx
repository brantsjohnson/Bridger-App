import React from 'react';
import { CameraIcon, EyeIcon, MusicIcon, PencilIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import {
  CoreWidget,
  CustomWidget,
  Person,
  Tier,
  TIER_LABEL } from
'../../../../packages/shared';
import {
  ACCENTS,
  Avatar,
  ButtonSecondary,
  EmptyState,
  ModuleFlow,
  ModuleQuestion,
  cn } from
'../../../../packages/ui';
import { CollapsibleSection, ShowAllList } from './CollapsibleSection';
import { CustomWidgetCard } from './CustomWidgetCard';
import { HobbiesWidget } from './HobbiesWidget';
import { TravelModule } from './TravelModule';
import {
  ABOUT_ME_FIELDS,
  FAVS,
  INTERESTS,
  PROFILE_CURRENTLY,
  THIS_OR_THAT } from
'../../state/mock-data';


const TIER_RANK: Record<Tier, number> = { none: 0, acquaintance: 1, friend: 2, close: 3 };

const TOT_ACCENTS = ['purple', 'coral', 'teal', 'amber', 'pink', 'blue'] as const;

/**
 * Modules a person can add to their profile. Each one is optional, and every
 * one is answered through the same one-question-per-screen flow as onboarding.
 */
const MODULES: Array<{
  id: string;
  label: string;
  emoji: string;
  line: string;
  questions: ModuleQuestion[];
}> = [
{
  id: 'tot',
  label: 'This or that',
  emoji: '⚖️',
  line: '12 quick picks',
  questions: [
  { id: 'tot1', ask: 'Coffee or tea?', type: 'thisOrThat', a: 'Coffee', b: 'Tea', emoji: '☕' },
  { id: 'tot2', ask: 'Beach or mountain?', type: 'thisOrThat', a: 'Beach', b: 'Mountain', emoji: '⛰' },
  { id: 'tot3', ask: 'Early bird or night owl?', type: 'thisOrThat', a: 'Early', b: 'Late', emoji: '🌙' },
  { id: 'tot4', ask: 'Call or text?', type: 'thisOrThat', a: 'Call', b: 'Text', emoji: '💬' }]

},
{
  id: 'places',
  label: 'Places traveled',
  emoji: '🗺',
  line: 'Pin where you have been',
  questions: [
  { id: 'p1', ask: 'Where have you been lately?', type: 'text', placeholder: 'Lisbon', emoji: '✈️' },
  { id: 'p2', ask: 'What do you remember most?', type: 'text', placeholder: 'Custard tarts, daily' },
  { id: 'p3', ask: 'Where next?', type: 'text', placeholder: 'Anywhere with trains' }]

},
{
  id: 'favs',
  label: 'List of favs',
  emoji: '⭐️',
  line: 'Food, films, everyday',
  questions: [
  { id: 'f1', ask: 'Pick your food groups', type: 'multi', options: ['Ramen', 'Tacos', 'Curry', 'Pastry', 'Dumplings'], emoji: '🍜' },
  { id: 'f2', ask: 'A film you rewatch?', type: 'text', placeholder: 'Paddington 2', emoji: '🎬' },
  { id: 'f3', ask: 'Everyday favorite?', type: 'text', placeholder: 'The 7am walk' }]

},
{
  id: 'deeper',
  label: 'Discover Me',
  emoji: '🔮',
  line: 'Deeper questions',
  questions: [
  { id: 'd1', ask: 'How do you recharge?', type: 'single', options: ['Alone, quietly', 'With one person', 'In a crowd'], emoji: '🔋' },
  { id: 'd2', ask: 'What makes a good friend?', type: 'text', placeholder: 'Shows up' }]

}];


/**
 * One card, two views. `editable` adds per-field visibility controls;
 * `asTier` filters exactly the way a friend in that circle would see it.
 * `empty` renders the cold-start version of every module.
 */
export function ProfileCard({
  person,
  line,
  editable = false,
  own = false,
  asTier = 'close',
  empty = false,
  bio,
  widgets = []











}: {person: Person;line: string;editable?: boolean; /** your own profile: Currently is always updatable, edit mode or not */own?: boolean;asTier?: Tier;empty?: boolean;bio?: string; /** co-op widgets, rendered into the gaps between the fixed core widgets */widgets?: CustomWidget[];}) {
  const city = line;
  /** Every custom widget sits after a named core widget. The core order is fixed. */
  const slot = (after: CoreWidget) =>
  widgets.
  filter((w) => w.afterCoreWidget === after).
  sort((a, b) => a.order - b.order).
  map((w) => <CustomWidgetCard key={w.id} widget={w} />);

  const visible = empty ? [] : ABOUT_ME_FIELDS.filter((f) => TIER_RANK[f.tier] <= TIER_RANK[asTier]);
  const hobbies = empty ? [] : INTERESTS;
  const picks = empty ? [] : THIS_OR_THAT;
  const favs = empty ? [] : FAVS;

  const [checkedIn, setCheckedIn] = React.useState(!empty);
  /** tapping a poll opens the full results — who voted for what */

  /** every module opens the same one-question-per-screen flow */
  const [module, setModule] = React.useState<string | null>(null);
  const activeModule = MODULES.find((m) => m.id === module);

  /** Currently is a weekly check-in — it goes stale on purpose. */
  const stale = !empty && !checkedIn;

  return (
    <div className="space-y-4">
      <ProfileHeader
        person={person}
        city={city}
        bio={bio}
        own={own}
        editing={editable}
        empty={empty} />
      

      {slot('header')}

      {checkedIn ?
      <section className="rounded-card bg-ink p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
              Currently · this week
            </p>
            {own &&
          <button
            type="button"
            onClick={() => setCheckedIn(false)}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
            
                <RefreshCwIcon className="h-3 w-3" strokeWidth={2.8} />
                Update
              </button>
          }
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue text-[22px]">
            
              {PROFILE_CURRENTLY.listening.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">
                {PROFILE_CURRENTLY.listening.title}
              </span>
              <span className="block truncate text-[12px] font-semibold text-white/70">
                {PROFILE_CURRENTLY.listening.artist}
              </span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-white/15 pt-3">
            <span
            aria-hidden="true"
            className="flex h-12 w-10 items-center justify-center rounded-sm bg-amber text-[20px]">
            
              {PROFILE_CURRENTLY.reading.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">
                {PROFILE_CURRENTLY.reading.title}
              </span>
              <span className="block truncate text-[12px] font-semibold text-white/70">
                {PROFILE_CURRENTLY.reading.author}
              </span>
            </span>
          </div>

          {own && <MusicConnect />}
        </section> :

      <section className="rounded-card bg-ink p-5 text-center text-white">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">Currently</p>
          <p className="mt-2 text-[15px] font-bold">
            {stale ? 'Time for your weekly check-in' : 'What are you into right now?'}
          </p>
          <p className="mt-1 text-[12px] font-semibold text-white/60">
            One song, one book. Takes a second.
          </p>
          {own &&
        <>
              <button
            type="button"
            onClick={() => setCheckedIn(true)}
            className="mt-3 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink">
            
                Check in
              </button>
              <MusicConnect />
            </>
        }
        </section>
      }

      {slot('currently')}

      <CollapsibleSection title="About me" count={visible.length}>
        {visible.length > 0 ?
        <dl className="divide-y divide-ink-line">
            {visible.map((f) =>
          <div key={f.id} className="flex items-center gap-3 py-2.5">
                <dt className="w-[104px] shrink-0 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                  {f.key}
                </dt>
                <dd className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                  {f.value}
                </dd>
                {editable &&
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-ink-line px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                    <EyeIcon className="h-3 w-3" strokeWidth={2.6} />
                    {TIER_LABEL[f.tier]}
                  </span>
            }
              </div>
          )}
          </dl> :

        <ModuleEmpty
          emoji="🪪"
          line={
          editable ?
          'Add the basics. Hometown, work, birthday.' :
          'Nothing shared at this level.'
          }
          cta={editable ? 'Add details' : undefined} />

        }
      </CollapsibleSection>

      <CollapsibleSection title="Hobbies" count={hobbies.length}>
        {hobbies.length > 0 ?
        <HobbiesWidget hobbies={hobbies} /> :

        <ModuleEmpty
          emoji="🎛"
          line={editable ? 'Pick a few things you like.' : 'No hobbies yet.'}
          cta={editable ? 'Add hobbies' : undefined} />

        }
      </CollapsibleSection>

      {slot('hobbies')}

      <CollapsibleSection
        title="List of favs"
        count={favs.reduce((n, f) => n + f.total, 0)}
        defaultOpen={!empty ? false : true}>
        
        {favs.length > 0 ?
        <div className="space-y-4">
            {favs.map((group) =>
          <div key={group.group}>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                  <span aria-hidden="true">{group.emoji}</span> {group.group} · {group.total}
                </p>
                <ShowAllList items={group.items} total={group.total} />
              </div>
          )}
          </div> :

        <ModuleEmpty
          emoji="⭐️"
          line={editable ? 'Start a list. Food, films, everyday.' : 'No favs yet.'}
          cta={editable ? 'Add favs' : undefined} />

        }
      </CollapsibleSection>

      {/* polls live on Home now — one place to ask, one place to read results */}

      <CollapsibleSection title="Places traveled" count={empty ? 0 : 5}>
        {empty ?
        <ModuleEmpty
          emoji="🗺"
          line={editable ? 'Pin the places you have been.' : 'No places yet.'}
          cta={editable ? 'Add places' : undefined} /> :


        <TravelModule />
        }
      </CollapsibleSection>

      {slot('placesMap')}

      <CollapsibleSection title="This or that" count={picks.length}>
        {picks.length > 0 ? (
        /* one row per question, two columns — you read the choice, not a tile */
        <ul className="divide-y divide-ink-line overflow-hidden rounded-card border border-ink-line bg-white">
            {picks.map((t, i) => {
            const token = ACCENTS[TOT_ACCENTS[i % TOT_ACCENTS.length]];
            const both = t.pick === 'both';
            return (
              <li key={t.id}>
                  <div className="grid grid-cols-2">
                    {(['a', 'b'] as const).map((side) => {
                    const label = side === 'a' ? t.a : t.b;
                    const chosen = both || t.pick === side;
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={editable ? () => setModule('tot') : undefined}
                        disabled={!editable}
                        aria-pressed={chosen}
                        className={cn(
                          'flex items-center gap-2 px-3.5 py-3 text-left transition-colors',
                          side === 'a' && 'border-r border-ink-line',
                          chosen ?
                          cn(token.bg, token.text) :
                          'bg-white text-ink-mute hover:bg-surface',
                          editable && 'cursor-pointer'
                        )}>
                        
                          {side === 'a' &&
                        <span aria-hidden="true" className="shrink-0 text-[15px]">
                              {t.emoji}
                            </span>
                        }
                          <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-[14px]',
                            chosen ? 'font-bold' : 'font-semibold'
                          )}>
                          
                            {label}
                          </span>
                        </button>);

                  })}
                  </div>
                  {both &&
                <p className="bg-surface px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                      Honestly, both
                    </p>
                }
                </li>);

          })}
          </ul>) :

        <ModuleEmpty
          emoji="⚖️"
          line={editable ? '12 quick picks, one tap each.' : 'Not taken yet.'}
          cta={editable ? 'Take it' : undefined} />

        }
      </CollapsibleSection>

      {editable &&
      <section className="rounded-card border border-ink-line bg-white p-4">
          <p className="font-pixel text-[15px] text-ink">Add to your profile</p>
          <div className="mt-3 space-y-2">
            {MODULES.map((m) =>
          <button
            key={m.id}
            type="button"
            onClick={() => setModule(m.id)}
            className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]">
            
                <span aria-hidden="true" className="text-[20px]">
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-ink">{m.label}</span>
                  <span className="block truncate text-[12px] font-semibold text-ink-mute">
                    {m.line}
                  </span>
                </span>
                <PlusIcon className="h-4 w-4 shrink-0 text-purple" strokeWidth={3} />
              </button>
          )}
          </div>
        </section>
      }

      <ModuleFlow
        open={Boolean(activeModule)}
        title={activeModule?.label ?? ''}
        questions={activeModule?.questions ?? []}
        onClose={() => setModule(null)}
        onDone={() => setModule(null)} />
      


    </div>);

}

/**
 * Photo, name, city, bio and profile song. On your own profile these become
 * editable in place once you tap Edit in the header — the same button that
 * turns on "View as" and the customize entry. Otherwise you see your profile
 * exactly the way your friends do.
 */
function ProfileHeader({
  person,
  city,
  bio,
  own,
  editing,
  empty








}: {person: Person;city: string;bio?: string;own: boolean; /** Edit is on, so the photo, city, song and bio can be changed */editing: boolean;empty: boolean;}) {
  const [currentCity, setCurrentCity] = React.useState(city);
  const [currentBio, setCurrentBio] = React.useState(bio ?? '');
  const [editingCity, setEditingCity] = React.useState(false);
  const [editingBio, setEditingBio] = React.useState(false);
  const canEdit = own && editing;

  return (
    <header className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xl" />
          {canEdit &&
          <button
            type="button"
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-ink text-white">
            
              <CameraIcon className="h-4 w-4" strokeWidth={2.4} />
            </button>
          }
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px] font-bold tracking-tight text-ink">{person.name}</h2>

          {editingCity ?
          <input
            autoFocus
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
            onBlur={() => setEditingCity(false)}
            aria-label="Your city"
            className="mt-0.5 w-full rounded-md border border-ink-line bg-surface px-2 py-1 text-[13px] font-semibold text-ink outline-none" /> :


          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setEditingCity(true)}
            className="flex max-w-full items-center gap-1.5 text-left">
            
              <span className="truncate text-[13px] font-semibold text-ink-soft">
                {currentCity}
              </span>
              {canEdit &&
            <PencilIcon className="h-3 w-3 shrink-0 text-ink-mute" strokeWidth={2.6} />
            }
            </button>
          }

          {!empty &&
          <button
            type="button"
            disabled={!canEdit}
            className="mt-1.5 flex max-w-full items-center gap-1.5 text-left">
            
              <MusicIcon className="h-3.5 w-3.5 shrink-0 text-ink-mute" strokeWidth={2.6} />
              <span className="truncate text-[12px] font-semibold text-ink-mute">
                {PROFILE_CURRENTLY.song.title} · {PROFILE_CURRENTLY.song.artist}
              </span>
              {canEdit &&
            <PencilIcon className="h-3 w-3 shrink-0 text-ink-mute" strokeWidth={2.6} />
            }
            </button>
          }
        </div>
      </div>

      {editingBio ?
      <textarea
        autoFocus
        rows={2}
        value={currentBio}
        onChange={(e) => setCurrentBio(e.target.value)}
        onBlur={() => setEditingBio(false)}
        aria-label="Your bio"
        placeholder="A line about you"
        className="w-full resize-none rounded-card border border-ink-line bg-surface px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none" /> :

      currentBio ?
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => setEditingBio(true)}
        className="w-full rounded-card border border-ink-line bg-surface px-3.5 py-2.5 text-left text-[14px] font-semibold leading-snug text-ink">
        
          {currentBio}
        </button> :
      canEdit ?
      <button
        type="button"
        onClick={() => setEditingBio(true)}
        className="flex w-full items-center gap-1.5 rounded-card border border-dashed border-ink-line px-3.5 py-2.5 text-[13px] font-semibold text-ink-mute">
        
          <PlusIcon className="h-4 w-4" strokeWidth={2.8} />
          Add a bio
        </button> :
      null}
    </header>);

}

/** Pull Currently straight from a music service instead of typing it each week. */
function MusicConnect() {
  const [service, setService] = React.useState<'spotify' | 'apple' | null>(null);

  if (service) {
    return (
      <p className="mt-3 border-t border-white/15 pt-3 text-[11px] font-semibold text-white/60">
        {service === 'spotify' ? 'Spotify' : 'Apple Music'} connected · updates on its own
      </p>);

  }

  return (
    <div className="mt-3 flex gap-2 border-t border-white/15 pt-3">
      <button
        type="button"
        onClick={() => setService('spotify')}
        className="flex-1 rounded-full bg-white/15 px-3 py-2 text-[12px] font-bold text-white">
        
        Connect Spotify
      </button>
      <button
        type="button"
        onClick={() => setService('apple')}
        className="flex-1 rounded-full bg-white/15 px-3 py-2 text-[12px] font-bold text-white">
        
        Apple Music
      </button>
    </div>);

}

function ModuleEmpty({ emoji, line, cta }: {emoji: string;line: string;cta?: string;}) {
  return (
    <EmptyState
      emoji={emoji}
      line={line}
      className="py-7"
      action={
      cta ?
      <ButtonSecondary size="sm" tone="solid">
            {cta}
          </ButtonSecondary> :
      undefined
      } />);


}