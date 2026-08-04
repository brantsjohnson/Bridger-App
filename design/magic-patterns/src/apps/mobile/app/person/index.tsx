import React from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { CustomWidget, PROFILE_PRESETS, ProfileTheme, Tier } from '../../../../packages/shared';
import {
  Breathe,
  ButtonSecondary,
  Card,
  PixelHeading,
  ProfileSkin,
  Screen,
  ScreenBody,
  ScreenHeader,
  SegmentedTabs } from
'../../../../packages/ui';
import { HowYouMetCard } from '../../components/profile/HowYouMetCard';
import { NotesReminders } from '../../components/profile/NotesReminders';
import { PersonActionsSheet } from '../../components/profile/PersonActionsSheet';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { InsideJokesWall } from '../../components/profile/InsideJokesWall';
import { SharedPlacePhotos } from '../../components/profile/SharedPlacePhotos';
import { ViewOriginalToggle } from '../../components/profile/ViewOriginalToggle';
import { CommonalityList } from '../../components/CommonalityList';
import { COMMONALITIES, personById } from '../../state/mock-data';

const TABS = ['About them', 'In common', 'Inside jokes', 'Your notes'];

/** They're a member, and this is the look they saved. */
const THEIR_THEME: ProfileTheme = PROFILE_PRESETS.find((p) => p.id === 'midnight')!;

const THEIR_WIDGETS: CustomWidget[] = [
{
  id: 'tw1',
  afterCoreWidget: 'header',
  order: 0,
  type: 'pinned',
  title: 'Sunset over the Gorge',
  emoji: '📌',
  visibleToTier: 'friend'
}];


/** Same card as your own profile — filtered by the tier you've given them. */
export function PersonScreen({
  personId = 'maya',
  onBack



}: {personId?: string;onBack?: () => void;}) {
  const person = personById(personId);
  const [tab, setTab] = React.useState('About them');
  /** their page is customized; the original is always one tap away */
  const [original, setOriginal] = React.useState(false);
  const [actions, setActions] = React.useState(false);
  const [tier, setTier] = React.useState<Tier>(person.tier);
  const [muted, setMuted] = React.useState(false);
  /** removed or blocked — the page becomes a receipt, not a profile */
  const [gone, setGone] = React.useState<'removed' | 'blocked' | null>(null);
  const first = person.name.split(' ')[0];

  if (gone) {
    return (
      <Screen>
        <ScreenHeader title={first} onBack={onBack} hideMessages />
        <ScreenBody>
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span aria-hidden="true" className="text-[40px]">
              {gone === 'blocked' ? '🚫' : '👋'}
            </span>
            <PixelHeading size="md" className="mt-4">
              {gone === 'blocked' ? `${first} is blocked` : `${first} was removed`}
            </PixelHeading>
            <p className="mt-2 max-w-[260px] text-[14px] font-semibold leading-snug text-ink-mute">
              {gone === 'blocked' ?
              'They cannot find you, message you, or see anything you post. Undo it in Settings → Blocked people.' :
              'They are out of your circles. Nobody was told. You can add them again anytime.'}
            </p>
            <div className="mt-6 w-full max-w-[240px]">
              <ButtonSecondary full tone="ghost" onClick={() => setGone(null)}>
                Undo
              </ButtonSecondary>
            </div>
          </div>
        </ScreenBody>
      </Screen>);

  }

  /* their look owns the whole page, not just the card — background included */
  const skinned = !original;

  return (
    <ProfileSkin theme={THEIR_THEME} active={skinned} fill className="h-full">
    <Screen tone={skinned ? 'plain' : 'canvas'}>
      <ScreenHeader
          title={person.name.split(' ')[0]}
          onBack={onBack}
          /* their page is customized, so the plain version sits by Messages */
          trailing={
          <span className="flex items-center gap-1.5">
            {tab === 'About them' &&
            <ViewOriginalToggle
              original={original}
              onChange={setOriginal}
              accent={THEIR_THEME.accentColor} />

            }
            <button
              type="button"
              onClick={() => setActions(true)}
              aria-label={`More about ${first}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">
              
              <MoreHorizontalIcon className="h-5 w-5" strokeWidth={2.6} />
            </button>
          </span>
          } />
        
      <ScreenBody>
        <Breathe>
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} variant="underline" />
        </Breathe>

        {tab === 'About them' &&
          <Breathe>
            <div className="mt-5">
              <ProfileCard
                person={person}
                line={person.label}
                bio={original ? undefined : 'Chasing good light. Terrible at texting back.'}
                asTier={tier}
                widgets={original ? [] : THEIR_WIDGETS} />
              
              <div className="mt-7">
                <HowYouMetCard personId={personId} />
              </div>
            </div>
          </Breathe>
          }

        {tab === 'In common' &&
          <Breathe>
            <div className="mt-5">
              <CommonalityList items={COMMONALITIES} theirName={first} />
              <div className="mt-7">
                <SharedPlacePhotos theirName={first} />
              </div>
            </div>
          </Breathe>
          }

        {tab === 'Inside jokes' &&
          <Breathe>
            <div className="mt-5">
              <InsideJokesWall ownerFirstName={person.name.split(' ')[0]} />
            </div>
          </Breathe>
          }

        {tab === 'Your notes' &&
          <Breathe>
            <div className="mt-5">
              <NotesReminders personId={personId} firstName={person.name.split(' ')[0]} />
            </div>
          </Breathe>
          }
      </ScreenBody>

      <PersonActionsSheet
          open={actions}
          name={first}
          tier={tier}
          muted={muted}
          onClose={() => setActions(false)}
          onChangeTier={setTier}
          onToggleMute={() => setMuted((m) => !m)}
          onRemove={() => setGone('removed')}
          onBlock={() => setGone('blocked')} />
        
    </Screen>
    </ProfileSkin>);

}