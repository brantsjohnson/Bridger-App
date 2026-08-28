import React from 'react';
import {
  ACCENTS,
  ACCENT_KEYS,
  Avatar,
  AvatarStack,
  Badge,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  Chip,
  ColorCard,
  CountdownChip,
  EmptyState,
  FloatingTabBar,
  InterestGrid,
  ListRow,
  PixelHeading,
  SearchField,
  SegmentedTabs,
  Sheet,
  StepProgress,
  StorageBar,
  StoryProgressBars,
  TextField,
  TierChip,
  Toggle,
  WindowsButton,
  WindowsDialog,
  cn } from
'../packages/ui';
import { StoryTile } from '../apps/mobile/components/StoryTile';
import { InsideJokeNote, PolaroidCard } from '../apps/mobile/components/InsideJokeNote';
import { NotificationRow } from '../apps/mobile/components/NotificationRow';
import { EventCard } from '../apps/mobile/components/EventCard';
import { TouchGrassButton } from '../apps/mobile/components/TouchGrassButton';
import { FriendNetworkGraph } from '../apps/mobile/components/FriendNetworkGraph';
import {
  EVENTS,
  INTERESTS,
  NOTIFICATIONS,
  PEOPLE,
  INSIDE_JOKES,
  STORIES,
  personById } from
'../apps/mobile/state/mock-data';

function Block({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <section className="rounded-card border border-ink-line bg-canvas-raised p-6">
      <PixelHeading size="md" className="mb-5">
        {title}
      </PixelHeading>
      {children}
    </section>);

}

function Row({ label, children }: {label: string;children: React.ReactNode;}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">{label}</p>
      {children}
    </div>);

}

export function DesignSystemGallery() {
  const [selected, setSelected] = React.useState<string[]>(['jazz']);
  const [chips, setChips] = React.useState<string[]>(['Nearby']);
  const [tab, setTab] = React.useState('About');
  const [query, setQuery] = React.useState('');
  const [name, setName] = React.useState('');
  const [on, setOn] = React.useState(true);
  const [free, setFree] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-5 py-8">
      <Block title="Tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="overflow-hidden rounded-card border border-ink-line">
            <div className="h-14 bg-white" />
            <p className="px-3 py-2 text-[12px] font-bold text-ink">Container #FFFFFF</p>
          </div>
          <div className="overflow-hidden rounded-card border border-ink-line">
            <div className="h-14 bg-canvas-dark" />
            <p className="px-3 py-2 text-[12px] font-bold text-ink">Dark #0E0E0E</p>
          </div>
          <div className="overflow-hidden rounded-card border border-ink-line">
            <div className="h-14 bg-metal-face" />
            <p className="px-3 py-2 text-[12px] font-bold text-ink">Metal #DEDCD2</p>
          </div>
          {/* every accent shows its one vibrant hue and the single pale fill derived from it */}
          {ACCENT_KEYS.map((k) =>
          <div key={k} className="overflow-hidden rounded-card border border-ink-line">
              <div className="h-14" style={{ backgroundColor: ACCENTS[k].hex }} />
              <div className={cn('h-6', ACCENTS[k].tintSolid)} />
              <p className="px-3 py-2 text-[12px] font-bold text-ink">
                {ACCENTS[k].label} {ACCENTS[k].hex}
              </p>
            </div>
          )}
        </div>
      </Block>

      <Block title="Type">
        <div className="space-y-3">
          <p className="font-pixel text-[30px] text-ink">Discover</p>
          <p className="text-[18px] font-bold tracking-tight text-ink">Section heading</p>
          <p className="text-[14px] font-medium text-ink-soft">
            Body copy is clean sans and never pixel.
          </p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="grid gap-5 sm:grid-cols-2">
          <Row label="Primary — metallic">
            <div className="flex flex-wrap items-center gap-3">
              <ButtonPrimary>Continue</ButtonPrimary>
              <ButtonPrimary loading>Continue</ButtonPrimary>
              <ButtonPrimary disabled>Continue</ButtonPrimary>
              <ButtonPrimary size="sm">Join</ButtonPrimary>
            </div>
          </Row>
          <Row label="Secondary — flat">
            <div className="flex flex-wrap items-center gap-3">
              <ButtonSecondary>Skip</ButtonSecondary>
              <ButtonSecondary tone="solid">Send</ButtonSecondary>
              <ButtonSecondary tone="ghost">Later</ButtonSecondary>
              <ButtonSecondary disabled>Off</ButtonSecondary>
            </div>
          </Row>
        </div>
      </Block>

      <Block title="Interests">
        <div className="max-w-[360px]">
          <InterestGrid
            interests={INTERESTS.slice(0, 6)}
            selected={selected}
            onToggle={(id) =>
            setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
            } />
          
        </div>
      </Block>

      <Block title="Chips & status">
        <div className="space-y-5">
          <Row label="Chips">
            <div className="flex flex-wrap gap-2">
              {['Nearby', 'New', '2nd degree', 'Outdoors'].map((l, i) =>
              <Chip
                key={l}
                label={l}
                accent={ACCENT_KEYS[i]}
                selected={chips.includes(l)}
                onClick={() =>
                setChips((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l])
                } />

              )}
            </div>
          </Row>
          <Row label="Tier chips">
            <div className="flex flex-wrap gap-2">
              <TierChip tier="close" />
              <TierChip tier="friend" />
              <TierChip tier="acquaintance" />
              <TierChip tier="none" />
            </div>
          </Row>
          <Row label="Badges">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="new">New</Badge>
              <Badge tone="matched">Matched</Badge>
              <Badge tone="nearby">Nearby</Badge>
              <Badge tone="active" dot>
                Active
              </Badge>
              <CountdownChip label="in 2 days" />
            </div>
          </Row>
          <Row label="Avatars">
            <div className="flex items-center gap-4">
              <Avatar name="Maya" emoji="🌻" accent="amber" size="lg" story="unseen" />
              <Avatar name="Devon" emoji="🎧" accent="blue" />
              <AvatarStack
                people={PEOPLE.slice(0, 3).map((p) => ({
                  name: p.name,
                  emoji: p.emoji,
                  accent: p.accent
                }))}
                extra={4} />
              
            </div>
          </Row>
        </div>
      </Block>

      <Block title="Surfaces">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-[14px] font-bold text-ink">Card</p>
            <p className="text-[12px] font-medium text-ink-mute">Hairline, flat, rounded.</p>
          </Card>
          <ColorCard accent="purple">
            <p className="text-[14px] font-bold">ColorCard</p>
            <p className="text-[12px] font-medium opacity-80">Accent delivery.</p>
          </ColorCard>
          <ListRow
            leading={<Avatar name="Kit" emoji="🚲" accent="green" size="sm" />}
            label="Kit Alvarez"
            sublabel="Rides at 6"
            trailing="chevron"
            onClick={() => undefined} />
          
          <ListRow
            leading={<Avatar name="Inès" emoji="🌿" accent="teal" size="sm" />}
            label="Inès Aubert"
            action={<Toggle checked={on} onChange={setOn} label="Inès" />} />
          
          <EventCard event={EVENTS[0]} />
          <div className="space-y-3">
            <EventCard event={EVENTS[2]} variant="row" />
            <TouchGrassButton
              live={free}
              inIds={free ? ['maya', 'devon'] : []}
              onOpen={() => setFree((v) => !v)} />
            
            <NotificationRow
              person={personById(NOTIFICATIONS[0].personId)}
              text={NOTIFICATIONS[0].text}
              time={NOTIFICATIONS[0].time}
              unread />
            
          </div>
        </div>
      </Block>

      <Block title="Old-Windows chrome">
        <div className="flex flex-wrap items-start gap-6">
          <WindowsDialog title="Error 404">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[16px] font-bold text-white">
                
                ✕
              </span>
              <p className="font-pixel text-[17px] leading-tight text-ink">System says it's fine...</p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <WindowsButton autoFocusRing>OK</WindowsButton>
              <WindowsButton>Cancel</WindowsButton>
            </div>
          </WindowsDialog>
          <div className="flex flex-col gap-3">
            <ButtonPrimary>Continue</ButtonPrimary>
            <ButtonPrimary size="md">Join</ButtonPrimary>
            <p className="max-w-[200px] text-[12px] font-medium text-ink-mute">
              Metallic means square. Everything else stays rounded and flat.
            </p>
          </div>
        </div>
      </Block>

      <Block title="Stories & inside jokes">
        <div className="flex flex-wrap items-start gap-3">
          {STORIES.slice(0, 2).map((s) =>
          <StoryTile key={s.id} story={s} />
          )}
          <PolaroidCard name="Golden hour" emoji="🌻" />
          <div className="w-[190px]">
            <InsideJokeNote joke={INSIDE_JOKES[0]} />
          </div>
          <div className="w-[190px] pt-2">
            <StoryProgressBars segments={3} active={1} />
          </div>
        </div>
      </Block>

      <Block title="Inputs, tabs & progress">
        <div className="grid gap-5 sm:grid-cols-2">
          <Row label="Search">
            <SearchField value={query} onChange={setQuery} placeholder="Search people" />
          </Row>
          <Row label="Segmented tabs">
            <SegmentedTabs
              tabs={['About', 'Stories', 'Inside jokes']}
              value={tab}
              onChange={setTab} />
            
          </Row>
          <Row label="Text field">
            <TextField label="Name" value={name} onChange={setName} placeholder="Sandra Kim" />
          </Row>
          <Row label="Error">
            <TextField label="Email" value="nope" onChange={() => undefined} error="Check that address." />
          </Row>
          <Row label="Step progress">
            <StepProgress step={4} total={6} />
          </Row>
          <Row label="Storage">
            <StorageBar used={3} total={5} />
          </Row>
        </div>
      </Block>

      <Block title="Map, empty state & nav">
        <div className="grid gap-5 sm:grid-cols-2">
          <FriendNetworkGraph
            nodes={[
            { id: 'me', label: 'You', x: 150, y: 100, accent: 'pink', self: true },
            { id: 'a', label: 'Maya', x: 70, y: 50, accent: 'amber' },
            { id: 'b', label: 'Devon', x: 235, y: 60, accent: 'blue' },
            { id: 'c', label: 'Kit', x: 120, y: 165, accent: 'green' }]
            }
            edges={[
            { from: 'me', to: 'a' },
            { from: 'me', to: 'b' },
            { from: 'me', to: 'c' },
            { from: 'a', to: 'c', dashed: true }]
            }
            selectedId="a" />
          
          <div className="space-y-3">
            <EmptyState
              emoji="🛰️"
              line="Nothing here yet."
              action={<ButtonSecondary size="sm" onClick={() => setSheet(true)}>Open sheet</ButtonSecondary>} />
            
            <div className="relative h-24 overflow-hidden rounded-card bg-canvas">
              <FloatingTabBar value="discover" onChange={() => undefined} badges={{ friends: true }} />
            </div>
          </div>
        </div>
      </Block>

      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="pointer-events-auto relative mx-auto h-full max-w-[440px]">
          <Sheet
            open={sheet}
            onClose={() => setSheet(false)}
            title="Filters"
            footer={
            <ButtonPrimary full size="md" onClick={() => setSheet(false)}>
                Apply
              </ButtonPrimary>
            }>
            
            <div className="flex flex-wrap gap-2">
              {['Nearby', 'Tonight', 'Free'].map((l) =>
              <Chip key={l} label={l} accent="blue" selected={l === 'Tonight'} onClick={() => undefined} />
              )}
            </div>
          </Sheet>
        </div>
      </div>
    </div>);

}