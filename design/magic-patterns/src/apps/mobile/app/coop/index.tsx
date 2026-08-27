import React from 'react';
import {
  BarChart3Icon,
  BoxIcon,
  CalendarIcon,
  CheckIcon,
  PaletteIcon,
  UsersIcon,
  VideoIcon } from
'lucide-react';
import {
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  ColorCard,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader } from
'../../../../packages/ui';
import { FREE_BENEFITS, MEMBER_BENEFITS } from '../../../../packages/shared';

/**
 * Membership. The rule the whole screen enforces: never pay to connect.
 * Copy here never says "AI" and never uses a long dash.
 */
const ALWAYS_FREE = [
'Meet people in Discover, including the reveal',
'Add anyone, unlimited acquaintances',
'Messages, Touch Grass, quizzes, Inside Jokes, Bucket list',
'Answering any poll or question you are sent',
'Post stories (photos, text, voice, stickers)',
'Watch every story and video, view every profile',
'Attend events, host up to 35',
'Previous-week recap of stories'];


const UNLOCKS: {
  key: string;
  title: string;
  line: string;
  icon: React.ReactNode;
  accent: 'purple' | 'teal' | 'coral' | 'amber' | 'blue' | 'pink';
}[] = [
{
  key: 'personalization',
  title: 'Make it yours',
  line: 'Widgets, photos, backgrounds, colors.',
  icon: <PaletteIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'purple'
},
{
  key: 'circles',
  title: 'Bigger circles',
  line: '25 Close, 125 Friends, plus named groups.',
  icon: <UsersIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'teal'
},
{
  key: 'video',
  title: 'Post video',
  line: 'Video updates and video replies.',
  icon: <VideoIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'coral'
},
{
  key: 'ask',
  title: 'Ask the group',
  line: 'Create polls and open questions.',
  icon: <BarChart3Icon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'purple'
},
{
  key: 'recaps',
  title: 'Daily recaps',
  line: 'Updated daily, not a week behind.',
  icon: <CalendarIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'amber'
},
{
  key: 'storage',
  title: 'Keep everything',
  line: 'No 30 day rolling window.',
  icon: <BoxIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'blue'
},
{
  key: 'events',
  title: 'Host up to 100',
  line: 'Plus co-hosts, allergies, and assignments.',
  icon: <CalendarIcon className="h-5 w-5" strokeWidth={2.4} />,
  accent: 'pink'
}];


const PORTAL_LINKS = [
{ label: 'Vote on what gets built', line: 'One member, one vote' },
{ label: 'Where the money goes', line: 'Open books, every quarter' },
{ label: 'Send feedback', line: 'Straight to the people building it' }];


export function CoopScreen({
  member = false,
  onBack,
  onJoin,
  onOpenPortal






}: {member?: boolean;onBack?: () => void; /** joining makes you a member and drops you into the portal */onJoin?: () => void;onOpenPortal?: () => void;}) {
  const caps = member ? MEMBER_BENEFITS : FREE_BENEFITS;

  return (
    <Screen>
      <ScreenHeader title="Co-op" onBack={onBack} hideMessages />
      <ScreenBody>
        <Breathe>
          <ColorCard accent="teal">
            <p className="font-pixel text-[17px] leading-tight text-onaccent">
              You're not the product.
            </p>
            <p className="mt-1.5 text-[14px] font-semibold text-onaccent/80">
              {member ? 'Member since 2026 · renews Mar 2027' : '$72 a year · members keep it running'}
            </p>
          </ColorCard>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md">Always free</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Connecting is never behind a paywall.
            </p>
            <Card>
              <ul className="space-y-2">
                {ALWAYS_FREE.map((line) =>
                <li key={line} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckIcon className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    <span className="text-[14px] font-semibold text-ink">{line}</span>
                  </li>
                )}
              </ul>
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md">Members get</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              More room to make it yours.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {UNLOCKS.map((u) =>
              <ColorCard key={u.key} accent={u.accent} className="p-4">
                  <span className="text-onaccent">{u.icon}</span>
                  <p className="mt-2 text-[15px] font-bold leading-tight text-onaccent">
                    {u.title}
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-snug text-onaccent/75">
                    {u.line}
                  </p>
                </ColorCard>
              )}
            </div>
          </section>
        </Breathe>

        <Breathe>
          <section>
            <PixelHeading size="md">Your circles</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Acquaintances are unlimited for everyone. Free Lite is 5 Close and 30 Friends.
            </p>
            <Card>
              <dl className="space-y-2.5">
                {[
                ['Close friends', caps.circleCaps.close],
                ['Friends', caps.circleCaps.friends],
                ['Acquaintances', 'Unlimited']].
                map(([label, value]) =>
                <div key={String(label)} className="flex items-center justify-between">
                    <dt className="text-[14px] font-semibold text-ink">{label}</dt>
                    <dd className="text-[14px] font-bold text-ink-soft">
                      {value === Infinity ? 'Unlimited' : value}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </section>
        </Breathe>

        <Breathe>
          <Card className="mt-5">
            <p className="text-[13px] font-semibold leading-snug text-ink-soft">
              <span className="font-bold text-ink">Always readable.</span> Any profile can be
              switched to the plain view in one tap, however it's decorated.
            </p>
          </Card>
        </Breathe>

        {/* the portal itself lives outside Bridger, so say so plainly */}
        <Breathe>
          <section className="mt-5">
            <PixelHeading size="md">Member portal</PixelHeading>
            <p className="mb-3 mt-0.5 text-[13px] font-semibold text-ink-mute">
              Votes, open books, and a direct line to the people building it.
            </p>

            <div className="space-y-2.5">
              {PORTAL_LINKS.map((l) =>
              <ListRow
                key={l.label}
                label={l.label}
                sublabel={l.line}
                trailing="chevron"
                onClick={member ? onOpenPortal : undefined} />

              )}

              {member ?
              <ButtonSecondary full size="lg" tone="solid" onClick={onOpenPortal}>
                  Open the portal
                </ButtonSecondary> :

              <>
                  <Card>
                    <p className="text-[13px] font-semibold leading-snug text-ink-soft">
                      <span className="font-bold text-ink">Members only.</span> Joining opens the
                      portal, where members vote on what gets built and see where the money goes.
                    </p>
                  </Card>
                  <ButtonPrimary full size="lg" onClick={onJoin}>
                    Join · $72 a year
                  </ButtonPrimary>
                </>
              }
            </div>
          </section>
        </Breathe>
      </ScreenBody>
    </Screen>);

}