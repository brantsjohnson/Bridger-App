// ============================================
// WHAT THIS FILE DOES (plain English):
// The Profile tab — your own page. Five content tabs across the top:
// Profile (the shared card friends see), Stories (the monthly calendar
// archive), Inside jokes (the sticky-note wall), Bucket list, and Settings.
// The Edit button in the header (Profile tab only) turns on in-place editing
// plus a "View as" row so you can check exactly what each circle sees.
// Data flows through the useProfile / useBucketList / useStoryArchive hooks,
// which serve demo fixtures today and the live API later.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tier } from '@bridger/shared';
import {
  ButtonSecondary,
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

/** The circles you can preview your card as while editing. */
const VIEW_AS: Array<{ label: string; tier: Tier }> = [
  { label: 'Close', tier: 'close' },
  { label: 'Friends', tier: 'friend' },
  { label: 'Everyone', tier: 'acquaintance' }
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const bucket = useBucketList();
  const archive = useStoryArchive();

  const [tab, setTab] = useState('Profile');
  const [editing, setEditing] = useState(false);
  /** which circle you're previewing the card as (edit mode only) */
  const [asTier, setAsTier] = useState<Tier>('close');

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Profile"
        trailing={
          tab === 'Profile' ? (
            <ButtonSecondary
              size="sm"
              tone={editing ? 'solid' : 'outline'}
              onPress={() => {
                setEditing((v) => !v);
                setAsTier('close');
              }}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
          ) : undefined
        }
      />
      <ScreenBody>
        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} variant="underline" />

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
                onCheckIn={(on) => void profile.onCheckIn(on)}
                onEditHeader={(patch) => void profile.onEditHeader(patch)}
              />
            </View>
          </>
        ) : null}

        {tab === 'Stories' ? (
          <View className="mt-5">
            <StoryCalendar days={archive.days} storage={archive.storage} />
          </View>
        ) : null}

        {tab === 'Inside jokes' ? (
          <View className="mt-5">
            <InsideJokesWall />
          </View>
        ) : null}

        {tab === 'Bucket list' ? (
          <View className="mt-5">
            <BucketList
              items={bucket.items}
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
