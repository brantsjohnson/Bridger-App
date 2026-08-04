import React from 'react';
import { CheckIcon, LockIcon, SettingsIcon, UsersIcon } from 'lucide-react';
import {
  ACCENTS,
  Avatar,
  Badge,
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  EmptyState,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  Sheet,
  Toggle,
  cn } from
'../../../../packages/ui';
import { ConnectionMap } from '../../components/ConnectionMap';
import { CommonalityList } from '../../components/CommonalityList';
import { MatchModules } from '../../components/discover/MatchModules';
import { COMMONALITIES, REQUESTS, SUGGESTIONS, personById } from '../../state/mock-data';

type DiscoverView = 'gate' | 'main' | 'detail';

const ABOUT_ME = ['Foods', 'Hobbies', 'Hometown', 'Places traveled', 'Morning or night'];


export function DiscoverScreen({
  initialView = 'main',
  empty = false




}: {initialView?: DiscoverView; /** day one: no friends yet, so there are no friends of friends */empty?: boolean;}) {
  const [view, setView] = React.useState<DiscoverView>(initialView);
  const requests = empty ? [] : REQUESTS;
  const suggestions = empty ? [] : SUGGESTIONS;
  const [selected, setSelected] = React.useState<{personId: string;viaId: string;kind: 'request' | 'suggestion';} | null>(
    initialView === 'detail' ? { personId: 'nour', viaId: 'devon', kind: 'request' } : null
  );
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [discoverable, setDiscoverable] = React.useState(true);
  const [sources, setSources] = React.useState({ aboutMe: true, onboardingQuiz: true, discoverMe: false });

  if (view === 'gate') {
    return <DiscoverGate onStart={() => setView('main')} />;
  }

  if (view === 'detail' && selected) {
    return (
      <ConnectionDetail
        personId={selected.personId}
        viaId={selected.viaId}
        kind={selected.kind}
        onBack={() => setView('main')} />);


  }

  const open = (personId: string, viaId: string, kind: 'request' | 'suggestion') => {
    setSelected({ personId, viaId, kind });
    setView('detail');
  };

  return (
    <Screen tone="synth">
      <ScreenHeader
        title="Discover"
        trailing={
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Discover settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-white text-ink hover:bg-[#F1ECFF]">
          
            <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        } />
      
      <ScreenBody>
        {/* first thing on the page: what you want to be matched on */}
        <Breathe>
          <div className="!mt-0">
            <MatchModules compact={!empty} />
          </div>
        </Breathe>

        {requests.length > 0 &&
        <Breathe>
            <section>
              <div className="section-title mb-2 flex items-center gap-2">
                <PixelHeading size="md">Wants to connect</PixelHeading>
                <Badge tone="new">{requests.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {requests.map((r) => {
                const p = personById(r.personId);
                const via = personById(r.viaFriendId ?? 'devon');
                return (
                  <ListRow
                    key={r.id}
                    leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} />}
                    label={p.name}
                    sublabel={`via ${via.name.split(' ')[0]}`}
                    trailing="chevron"
                    onClick={() => open(p.id, via.id, 'request')} />);


              })}
              </div>
            </section>
          </Breathe>
        }

        <Breathe>
          <section>
            <PixelHeading size="md">People to meet</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Bridger's picks · friends of your friends
            </p>
            <div className="space-y-2.5">
              {suggestions.length === 0 &&
              <EmptyState
                emoji="🌱"
                line="Answer a module or two above, then add a few friends. Bridger only introduces you through people you already know." />

              }
              {suggestions.map((s, i) => {
                const p = personById(s.personId);
                const via = personById(s.viaFriendId);
                const token = ACCENTS[s.accent];
                const first = p.name.split(' ')[0];
                const onOpen = () => open(p.id, via.id, 'suggestion');

                // the top pick gets a tinted spotlight; the rest stay light rows
                if (i === 0) {
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={onOpen}
                      className={cn('cursor-pointer rounded-card p-5', token.tintSolid)}>
                      
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} emoji={p.emoji} accent={s.accent} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold uppercase tracking-wide text-onaccent/70">
                            Top match
                          </p>
                          <p className="font-pixel text-[17px] leading-tight text-onaccent">
                            {s.sharedThread}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-[17px] font-bold tracking-tight text-onaccent">
                        {p.name}
                      </p>
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-onaccent/75">
                        <UsersIcon className="h-4 w-4" strokeWidth={2.4} />
                        You both know {via.name.split(' ')[0]}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.signals.map((sig) =>
                        <span
                          key={sig}
                          className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink">
                          
                            {sig}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <ButtonSecondary
                          full
                          size="lg"
                          tone="positive"
                          onClick={(e) => e.stopPropagation()}>
                          
                          Add {first}
                        </ButtonSecondary>
                      </div>
                    </div>);

                }

                return (
                  <Card key={s.id} className="flex items-center gap-3 p-4" onClick={onOpen}>
                    <Avatar name={p.name} emoji={p.emoji} accent={s.accent} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-bold tracking-tight text-ink">
                        {s.sharedThread}
                      </p>
                      <p className="truncate text-[13px] font-semibold text-ink-soft">{p.name}</p>
                      <p className="truncate text-[12px] font-semibold text-ink-mute">
                        You both know {via.name.split(' ')[0]}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.signals.slice(0, 3).map((sig) =>
                        <span
                          key={sig}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-bold text-onaccent',
                            token.tintSolid
                          )}>
                          
                            {sig}
                          </span>
                        )}
                      </div>
                    </div>
                    <ButtonSecondary
                      size="sm"
                      tone="positive"
                      onClick={(e) => e.stopPropagation()}>
                      
                      Add
                    </ButtonSecondary>
                  </Card>);

              })}
            </div>
          </section>
        </Breathe>

      </ScreenBody>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Discover settings">
        <div className="no-scrollbar max-h-[440px] space-y-2.5 overflow-y-auto pr-0.5">
              <ListRow
            label="Discoverable"
            sublabel={discoverable ? 'Matching is on' : 'Nobody can find you'}
            action={<Toggle checked={discoverable} onChange={setDiscoverable} label="Discoverable" />} />
          

              <Card>
                <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                  About me · everyone can see
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {ABOUT_ME.map((a) =>
              <li key={a} className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      <CheckIcon className="h-4 w-4 text-teal" strokeWidth={3} />
                      {a}
                    </li>
              )}
                </ul>
              </Card>

              <ListRow
            label="Onboarding quiz"
            sublabel="Result shared, scoring private"
            action={
            <Toggle
              checked={sources.onboardingQuiz}
              onChange={(v) => setSources((s) => ({ ...s, onboardingQuiz: v }))}
              label="Onboarding quiz" />

            } />
          
              <ListRow
            label="Discover Me questionnaire"
            sublabel="Deeper match signals"
            action={
            <Toggle
              checked={sources.discoverMe}
              onChange={(v) => setSources((s) => ({ ...s, discoverMe: v }))}
              label="Discover Me questionnaire" />

            } />
          

              <Card className="flex items-start gap-2.5">
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.5} />
                <p className="text-[13px] font-semibold leading-snug text-ink-soft">
                  Personality signals help matching. They never appear on your profile.
                </p>
              </Card>

          <ButtonSecondary
            full
            onClick={() => {
              setSettingsOpen(false);
              setView('gate');
            }}>
            
            Turn matching off
          </ButtonSecondary>
        </div>
      </Sheet>
    </Screen>);

}

/** The intro gate — black and white, wireframe globe on a perspective grid. */
function DiscoverGate({ onStart }: {onStart: () => void;}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-x-24 bottom-0 h-1/2 animate-drift"
          style={{
            backgroundImage:
            'linear-gradient(to right, rgba(28,27,22,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,27,22,0.35) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
            transform: 'perspective(220px) rotateX(62deg)',
            transformOrigin: 'bottom',
            opacity: 0.5
          }} />
        
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-7 text-center">
        <Globe />
        <PixelHeading as="h1" size="lg" className="mt-8">
          Making friends as an adult is hard.
        </PixelHeading>
        <p className="mt-4 max-w-[280px] text-[15px] font-semibold leading-snug text-ink-soft">
          Bridger introduces you to the friends of friends worth knowing.
        </p>
      </div>

      <div className="relative px-6 pb-10">
        <ButtonPrimary full onClick={onStart}>
          Get started
        </ButtonPrimary>
        <p className="mt-3 text-center text-[12px] font-semibold text-ink-mute">
          You choose what you share.
        </p>
      </div>
    </div>);

}

function Globe() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 text-ink" role="img" aria-label="Wireframe globe">
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {[14, 28, 40].map((r) =>
      <ellipse key={r} cx="60" cy="60" rx={r} ry="46" fill="none" stroke="currentColor" strokeWidth="1" />
      )}
      {[-30, 0, 30].map((dy) =>
      <ellipse key={dy} cx="60" cy={60 + dy} rx="46" ry={dy === 0 ? 46 : 30} fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
      )}
    </svg>);

}

/** One request or suggestion: its own map, a few things in common, then the decision. */
function ConnectionDetail({
  personId,
  viaId,
  kind,
  onBack





}: {personId: string;viaId: string;kind: 'request' | 'suggestion';onBack: () => void;}) {
  const person = personById(personId);
  const via = personById(viaId);
  const [decision, setDecision] = React.useState<'accepted' | 'declined' | null>(null);

  return (
    <Screen tone="synth">
      <ScreenHeader title="Connect" onBack={onBack} />
      <ScreenBody>
        <Breathe>
          <div className="flex flex-col items-center text-center">
            <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xl" />
            <h2 className="mt-3 text-[20px] font-bold tracking-tight text-ink">{person.name}</h2>
            <p className="text-[13px] font-semibold text-ink-mute">
              via {via.name} · {person.label}
            </p>

            <div className="mt-4 flex w-full gap-2.5">
              <ButtonSecondary
                full
                size="lg"
                tone={decision === 'declined' ? 'solid' : 'outline'}
                onClick={() => setDecision('declined')}>
                
                {kind === 'request' ? 'Decline' : 'Not now'}
              </ButtonSecondary>
              <ButtonSecondary
                full
                size="lg"
                tone="positive"
                onClick={() => setDecision('accepted')}
                className={decision === 'accepted' ? 'bg-[#1F7A42] hover:bg-[#1F7A42]' : undefined}>
                
                {decision === 'accepted' ? 'Accepted ✓' : kind === 'request' ? 'Accept' : 'Add'}
              </ButtonSecondary>
            </div>
          </div>
        </Breathe>

        <Breathe>
          <div className="mt-5">
            <ConnectionMap person={person} via={via} variant="A" />
          </div>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md" className="mb-2">
              In common
            </PixelHeading>
            <CommonalityList items={COMMONALITIES.slice(0, 3)} />
          </section>
        </Breathe>

      </ScreenBody>
    </Screen>);

}