// ============================================
// WHAT THIS FILE DOES (plain English):
// The Profile tab — your own page. Five content tabs across the top:
// Profile (the shared card friends see), Stories (the monthly calendar
// archive), Inside jokes (the sticky-note wall), Bucket list, and Settings.
// A small Edit / Done next to your name (Profile tab only) turns on in-place
// editing plus a "View as" row so you can check exactly what each circle sees.
// Data flows through the useProfile / useBucketList / useStoryArchive hooks,
// which serve demo fixtures today and the live API later.
// Analytics: surface=profile; every tab and settings row uses PROFILE.* IDs.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Tier } from '@bridger/shared';
import { openSurface, PROFILE } from '@bridger/shared';
import {
  Screen,
  ScreenBody,
  ScreenHeader,
  SegmentedTabs,
  cn
} from '@bridger/ui';
import { useAuth } from '../../providers/auth-provider';
import { useProfile } from '../../hooks/useProfile';
import { useBucketList } from '../../hooks/useBucketList';
import { useStoryArchive } from '../../hooks/useStoryArchive';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { StoryCalendar } from '../../components/profile/StoryCalendar';
import { BucketList } from '../../components/profile/BucketList';
import { ProfileSettings } from '../../components/profile/ProfileSettings';
import { InsideJokesWall } from '../../components/friends/InsideJokesWall';

const TABS = ['Profile', 'Stories', 'Inside jokes', 'Bucket list', 'Settings'];

/** Map each visible tab label to its taxonomy analytics id. */
function profileTabAnalyticsId(tab: string): string | undefined {
  switch (tab) {
    case 'Profile':
      return PROFILE.tabs.profile;
    case 'Stories':
      return PROFILE.tabs.stories;
    case 'Inside jokes':
      return PROFILE.tabs.inside_jokes;
    case 'Bucket list':
      return PROFILE.tabs.bucket_list;
    case 'Settings':
      return PROFILE.tabs.settings_gear;
    default:
      return undefined;
  }
}

/** The circles you can preview your card as while editing. */
const VIEW_AS: Array<{ label: string; tier: Tier }> = [
  { label: 'Close', tier: 'close' },
  { label: 'Friends', tier: 'friend' },
  { label: 'Everyone', tier: 'acquaintance' }
];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const profile = useProfile();
  const bucket = useBucketList();
  const archive = useStoryArchive();

  const [tab, setTab] = useState('Profile');
  const [editing, setEditing] = useState(false);
  /** which circle you're previewing the card as (edit mode only) */
  const [asTier, setAsTier] = useState<Tier>('close');

  // Mark Profile as the active analytics surface when this tab is shown.
  useEffect(() => {
    openSurface('profile');
  }, []);

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Profile"
        hideProfile
        analyticsSurface="profile"
        // Profile is opened by tapping the header avatar (a push), so give it a
        // way back. Fall back to Home if there's nowhere to go back to.
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/home');
        }}
      />
      <ScreenBody>
        <SegmentedTabs
          tabs={TABS}
          value={tab}
          onChange={setTab}
          variant="underline"
          analyticsIdForTab={profileTabAnalyticsId}
        />

        {tab === 'Profile' ? (
          <>
            {editing ? (
              <View className="mt-5 rounded-card border border-ink-line bg-surface p-3">
                <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                  View as
                </Text>
                <View className="flex-row gap-2">
                  {VIEW_AS.map((v) => (
                    <Pressable
                      key={v.tier}
                      onPress={() => setAsTier(v.tier)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: asTier === v.tier }}
                      accessibilityLabel={`View as ${v.label}`}
                      className={cn(
                        'min-h-[40px] flex-1 items-center justify-center rounded-full px-3 py-2',
                        asTier === v.tier ? 'bg-green' : 'border border-ink-line bg-surface'
                      )}
                    >
                      <Text
                        className={cn(
                          'font-sans-b text-[12px]',
                          asTier === v.tier ? 'text-ink' : 'text-ink-soft'
                        )}
                      >
                        {v.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mt-5">
              <ProfileCard
                person={profile.me}
                header={profile.header}
                currently={profile.currently}
                about={profile.about}
                hobbies={profile.hobbies}
                favs={profile.favs}
                thisOrThat={profile.thisOrThat}
                places={profile.places}
                editable={editing}
                own
                asTier={asTier}
                onToggleEdit={() => {
                  setEditing((v) => !v);
                  setAsTier('close');
                }}
                onCheckIn={(on) => void profile.onCheckIn(on)}
                onEditHeader={(patch) => void profile.onEditHeader(patch)}
                onAnswered={() => void profile.refresh()}
              />
            </View>
          </>
        ) : null}

        {tab === 'Stories' ? (
          <View className="mt-5">
            <StoryCalendar
              days={archive.days}
              storage={archive.storage}
              onOpenStory={() => router.push('/story/me?catchup=1')}
            />
          </View>
        ) : null}

        {tab === 'Inside jokes' ? (
          <View className="mt-5">
            <InsideJokesWall
              analyticsIds={{
                note: PROFILE.inside_jokes.note,
                add: PROFILE.inside_jokes.add,
                filter: PROFILE.inside_jokes.filter,
                noteBody: PROFILE.inside_jokes.note_body
              }}
            />
          </View>
        ) : null}

        {tab === 'Bucket list' ? (
          <View className="mt-5">
            <BucketList
              items={bucket.items}
              loading={bucket.loading}
              editable
              onAdd={bucket.onAdd}
              onToggle={bucket.onToggle}
            />
          </View>
        ) : null}

        {tab === 'Settings' ? (
          <View className="mt-5">
            <ProfileSettings
              blocked={profile.blocked}
              storage={archive.storage}
              onUnblock={(id) => void profile.onUnblock(id)}
              onSignOut={() => signOut()}
            />
          </View>
        ) : null}
      </ScreenBody>
    </Screen>
  );
}
