import React from 'react';
import {
  CustomWidget,
  DEFAULT_PROFILE_THEME,
  Person,
  ProfileTheme,
  Tier,
  isCustomized } from
'../../../../packages/shared';
import {
  Breathe,
  ButtonSecondary,
  Card,
  ListRow,
  ProfileSkin,
  Screen,
  ScreenBody,
  ScreenHeader,
  SegmentedTabs,
  ThemeSwitch,
  Toggle,
  cn } from
'../../../../packages/ui';
import { useTheme } from '../../state/theme';
import { BlockedPeopleSheet } from '../../components/profile/BlockedPeopleSheet';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { InsideJokesWall } from '../../components/profile/InsideJokesWall';
import { StoryCalendar } from '../../components/profile/StoryCalendar';
import { BucketList } from '../../components/profile/BucketList';
import { ME, PEOPLE } from '../../state/mock-data';

const TABS = ['Profile', 'Stories', 'Inside jokes', 'Bucket list', 'Settings'];

/** A member's own widgets, already dropped into the gaps. */
const DEFAULT_WIDGETS: CustomWidget[] = [
{
  id: 'cw1',
  afterCoreWidget: 'header',
  order: 0,
  type: 'quote',
  title: 'my mom, every time',
  body: '"Go outside, it is right there."',
  visibleToTier: 'friend'
},
{
  id: 'cw2',
  afterCoreWidget: 'hobbies',
  order: 0,
  type: 'photos',
  visibleToTier: 'friend'
}];


const VIEW_AS: Array<{label: string;tier: Tier;}> = [
{ label: 'Close', tier: 'close' },
{ label: 'Friends', tier: 'friend' },
{ label: 'Everyone', tier: 'acquaintance' }];


export function ProfileScreen({
  empty = false,
  customTheme = DEFAULT_PROFILE_THEME,
  customWidgets = DEFAULT_WIDGETS,
  member = false,
  onOpenCoop,
  onCustomize,
  onOpenStory











}: {empty?: boolean; /** co-op member — the co-op row goes to the portal instead of the pitch */member?: boolean; /** saved from the customize screen */customTheme?: ProfileTheme;customWidgets?: CustomWidget[];onOpenCoop?: () => void;onCustomize?: () => void; /** a day in the story archive opens that story */onOpenStory?: (day: number) => void;}) {
  const [tab, setTab] = React.useState('Profile');
  const { theme, setTheme } = useTheme();
  const [asTier, setAsTier] = React.useState<Tier>('close');
  const [editing, setEditing] = React.useState(false);
  /** your page look. Presentation only, and the plain version is always there. */
  const pageTheme = customTheme;
  const widgets = empty ? [] : customWidgets;
  const customized = isCustomized(pageTheme, widgets);
  /** a standing preference for other people's pages — never your own */
  const [preferOriginal, setPreferOriginal] = React.useState(false);
  /** blocking is reversible, and undoing it lives here */
  const [blockedOpen, setBlockedOpen] = React.useState(false);
  const [blocked, setBlocked] = React.useState<Person[]>(
    empty ? [] : PEOPLE.filter((p) => p.id === 'theo')
  );
  /** your page always shows your look; "Reset to plain" lives in the editor */
  const skinned = customized;

  return (
    /* your look owns the whole page, background included */
    <ProfileSkin theme={pageTheme} active={skinned} fill className="h-full">
    <Screen tone={skinned ? 'plain' : 'canvas'}>
      <ScreenHeader
          title="Profile"
          trailing={
          tab === 'Profile' ?
          <ButtonSecondary
            size="sm"
            tone={editing ? 'solid' : 'outline'}
            onClick={() => {
              setEditing((v) => !v);
              setAsTier('close');
            }}>
            
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary> :
          undefined
          } />
        
      <ScreenBody>
        <Breathe>
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} variant="underline" />
        </Breathe>

        {tab === 'Profile' &&
          <>
            {editing &&
            <Breathe>
              <div className="mt-5 rounded-card border border-ink-line bg-white p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  View as
                </p>
                <div className="flex gap-2">
                  {VIEW_AS.map((v) =>
                  <button
                    key={v.tier}
                    type="button"
                    onClick={() => setAsTier(v.tier)}
                    aria-pressed={asTier === v.tier}
                    className={cn(
                      'flex-1 rounded-full px-3 py-2 text-[12px] font-bold transition-colors',
                      asTier === v.tier ?
                      'bg-green text-ink' :
                      'border border-ink-line bg-white text-ink-soft hover:bg-[#F1ECFF]'
                    )}>
                    
                      {v.label}
                    </button>
                  )}
                </div>
              </div>
            </Breathe>
            }

            <Breathe>
              <div className="mt-5">
                <ProfileCard
                  person={ME}
                  line={empty ? 'Add your city' : 'Portland, OR'}
                  bio={
                  empty ? undefined : 'Making zines nobody asked for. Always down for a walk.'
                  }
                  editable={editing || empty}
                  own
                  asTier={asTier}
                  empty={empty}
                  widgets={skinned ? widgets : []} />
                
              </div>
            </Breathe>

            {editing &&
            <Breathe>
                <div className="mt-5 space-y-2.5">
                  <ListRow
                  label="Customize your page"
                  sublabel={
                  customized ?
                  'Background, colors, type, your widgets' :
                  'Members only · make it yours'
                  }
                  trailing="chevron"
                  onClick={onCustomize} />
                
                  <ListRow
                  label="Add a section"
                  sublabel="Deeper questions · Custom notes"
                  trailing="chevron"
                  onClick={() => undefined} />
                
                  <p className="px-1 text-[11px] font-medium text-ink-mute">
                    Anything you delete is removed from Bridger for good.
                  </p>
                </div>
              </Breathe>
            }
          </>
          }

        {tab === 'Stories' &&
          <Breathe>
            <div className="mt-5">
              <StoryCalendar empty={empty} onOpenStory={onOpenStory} />
            </div>
          </Breathe>
          }

        {tab === 'Inside jokes' &&
          <Breathe>
            <div className="mt-5">
              <InsideJokesWall empty={empty} />
            </div>
          </Breathe>
          }

        {tab === 'Bucket list' &&
          <Breathe>
            <div className="mt-5">
              <BucketList editable empty={empty} />
            </div>
          </Breathe>
          }

        {tab === 'Settings' &&
          <Breathe>
            <div className="mt-5 space-y-2.5">
              <ListRow
                label="Appearance"
                action={<ThemeSwitch value={theme} onChange={setTheme} />} />
              
              <ListRow
                label="Who sees what"
                sublabel="Close · Friends · Everyone"
                trailing="chevron"
                onClick={() => undefined} />
              
              <ListRow
                label="Storage & plan"
                sublabel={empty ? 'Free month · 0% used' : 'Free month · 100% used'}
                trailing="chevron"
                onClick={() => undefined} />
              
              <ListRow
                label="Discover"
                sublabel="Discoverable · 2 match sources"
                trailing="chevron"
                onClick={() => undefined} />
              
              <ListRow
                label="Customize your page"
                sublabel={
                customized ?
                'Background, colors, type, your widgets' :
                'Members only · make it yours'
                }
                trailing="chevron"
                onClick={onCustomize} />
              
              <ListRow
                label="Always show plain pages"
                sublabel="Skip other people's customization when you visit"
                action={
                <Toggle
                  checked={preferOriginal}
                  onChange={setPreferOriginal}
                  label="Always show plain pages" />

                } />
              
              <ListRow
                label="Co-op"
                sublabel={member ? 'Member portal · votes, books, feedback' : 'Membership · what you get'}
                trailing="chevron"
                onClick={onOpenCoop} />
              
              <ListRow
                label="Notifications"
                action={<Toggle checked onChange={() => undefined} label="Notifications" />} />
              
              <ListRow
                label="Blocked people"
                sublabel={
                blocked.length > 0 ?
                `${blocked.length} blocked · nobody is ever told` :
                'Nobody blocked'
                }
                trailing="chevron"
                onClick={() => setBlockedOpen(true)} />
              
              <ListRow label="Account" trailing="chevron" onClick={() => undefined} />
              <Card>
                <ButtonSecondary full tone="ghost" onClick={() => undefined}>
                  Log out
                </ButtonSecondary>
              </Card>
            </div>
          </Breathe>
          }
      </ScreenBody>

      <BlockedPeopleSheet
          open={blockedOpen}
          people={blocked}
          onClose={() => setBlockedOpen(false)}
          onUnblock={(id) => setBlocked((b) => b.filter((p) => p.id !== id))} />
        
    </Screen>
    </ProfileSkin>);

}