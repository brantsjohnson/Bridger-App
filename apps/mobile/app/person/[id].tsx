// ============================================
// WHAT THIS FILE DOES (plain English):
// A friend's profile page — opened from Coming up, the Friends roster, or
// Discover. Same shared card idea as your own Profile, but for them: who they
// are, Message, and tabs for About / In common / Inside jokes.
// Analytics: still surface=profile (friend view); tabs use PROFILE.friend_tabs.*
// and Message uses PROFILE.actions.message.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageSquareIcon } from 'lucide-react-native';
import { openSurface, PROFILE, type BucketItem } from '@bridger/shared';
import {
  Screen,
  ScreenBody,
  ScreenHeader,
  SegmentedTabs,
  withAnalyticsPress
} from '@bridger/ui';
import { CommonalityList } from '../../components/discover/CommonalityList';
import { InsideJokesWall } from '../../components/friends/InsideJokesWall';
import { BucketList } from '../../components/profile/BucketList';
import { HowYouMetCard } from '../../components/profile/HowYouMetCard';
import { ProfileCard, ProfileHeader } from '../../components/profile/ProfileCard';
import { SharedPlacePhotos } from '../../components/profile/SharedPlacePhotos';
import type { Commonality } from '../../data/discover';
import { startThreadWith } from '../../data/messages';
import { personById } from '../../data/people';
import type {
  AboutField,
  FavGroup,
  Interest,
  MyProfileHeader,
  ThisOrThatRow,
  TravelPlace
} from '../../data/profile';
import { getPersonProfile, listPersonBucket } from '../../data/profile';
import { getReveal } from '../../data/reveal';

const TABS = ['About them', 'In common', 'Inside jokes', 'Bucket list'];

/** Map friend-view tab labels to taxonomy ids. */
function friendTabAnalyticsId(tab: string): string | undefined {
  switch (tab) {
    case 'About them':
      return PROFILE.friend_tabs.about_them;
    case 'In common':
      return PROFILE.friend_tabs.in_common;
    case 'Inside jokes':
      return PROFILE.friend_tabs.inside_jokes;
    case 'Bucket list':
      return PROFILE.friend_tabs.bucket_list;
    default:
      return undefined;
  }
}

export default function PersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : 'maya';
  const person = personById(personId);
  const first = person.name.split(' ')[0];

  const [tab, setTab] = useState('About them');
  /** Same overlap content as the Connection Reveal — re-openable anytime */
  const [commonalities, setCommonalities] = useState<Commonality[]>([]);

  // Card sections for this friend — loaded from fixtures in demo mode.
  const [header, setHeader] = useState<MyProfileHeader>({
    city: person.label || 'Somewhere',
    bio: '',
    song: { title: '', artist: '' }
  });
  const [about, setAbout] = useState<AboutField[]>([]);
  const [hobbies, setHobbies] = useState<Interest[]>([]);
  const [hobbyFollowUps, setHobbyFollowUps] = useState<
    Record<string, { question: string; answer: string }>
  >({});
  const [favs, setFavs] = useState<FavGroup[]>([]);
  const [thisOrThat, setThisOrThat] = useState<ThisOrThatRow[]>([]);
  const [places, setPlaces] = useState<TravelPlace[]>([]);
  // Their bucket list — loaded separately so the tab isn't empty.
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [bucketLoading, setBucketLoading] = useState(true);

  // Friend profiles still count as the profile surface (friend view).
  useEffect(() => {
    openSurface('profile');
  }, []);

  useEffect(() => {
    void getReveal(personId).then((r) => setCommonalities(r.all));
  }, [personId]);

  useEffect(() => {
    setBucketLoading(true);
    void listPersonBucket(personId)
      .then(setBucket)
      .finally(() => setBucketLoading(false));
  }, [personId]);

  // Load their card data so "About them" is not empty.
  useEffect(() => {
    void getPersonProfile(personId).then((p) => {
      if (!p) {
        setHeader({
          city: person.label || 'Somewhere',
          bio: '',
          song: { title: '', artist: '' }
        });
        setAbout([]);
        setHobbies([]);
        setHobbyFollowUps({});
        setFavs([]);
        setThisOrThat([]);
        setPlaces([]);
        return;
      }
      setHeader(p.header);
      setAbout(p.about);
      setHobbies(p.hobbies);
      setHobbyFollowUps(p.hobbyFollowUps ?? {});
      setFavs(p.favs);
      setThisOrThat(p.thisOrThat);
      setPlaces(p.places);
    });
  }, [personId, person.label]);

  const openMessage = async () => {
    const threadId = await startThreadWith(personId);
    router.push(`/messages/${threadId}`);
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title={first}
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="profile"
        trailing={
          // One clear way to message them: a labelled orange pill in the corner
          // (replaces the old black icon + separate full-width Message button).
          <Pressable
            onPress={withAnalyticsPress(PROFILE.actions.message, () => void openMessage())}
            accessibilityRole="button"
            accessibilityLabel={`Message ${first}`}
            className="h-10 flex-row items-center gap-1.5 rounded-full bg-coral px-3.5 active:opacity-90"
          >
            <Text className="font-sans-b text-[13px] text-white">Message {first}</Text>
            <MessageSquareIcon size={16} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
        }
      />

      <ScreenBody>
        {/*
          Who this is, once: photo, name, where they are, mutuals, what they're
          listening to and reading, then their bio. The tabs sit underneath.
        */}
        <ProfileHeader
          person={person}
          header={header}
          own={false}
          editing={false}
          empty={false}
        />

        <View className="mt-5">
          <SegmentedTabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            variant="underline"
            analyticsIdForTab={friendTabAnalyticsId}
          />
        </View>

        {tab === 'About them' ? (
          <View className="mt-5">
            <ProfileCard
              person={person}
              header={header}
              showHeader={false}
              currently={null}
              about={about}
              hobbies={hobbies}
              favs={favs}
              thisOrThat={thisOrThat}
              places={places}
              hobbyFollowUps={hobbyFollowUps}
              asTier={person.tier}
            />
          </View>
        ) : null}

        {tab === 'In common' ? (
          <View className="mt-5 gap-7">
            {commonalities.length > 0 ? (
              <CommonalityList items={commonalities} theirName={first} />
            ) : (
              <View className="rounded-2xl border border-dashed border-ink-line bg-surface px-4 py-8">
                <Text className="text-center font-sans-sb text-[14px] leading-snug text-ink-mute">
                  What you share with {first} shows up here after you connect —
                  the same commonalities from the reveal.
                </Text>
              </View>
            )}
            <HowYouMetCard personId={personId} />
            <SharedPlacePhotos personId={personId} theirName={first} />
          </View>
        ) : null}

        {/* Their bucket list, read-only. Private lines are filtered server-side. */}
        {tab === 'Bucket list' ? (
          <View className="mt-5">
            <BucketList
              items={bucket}
              loading={bucketLoading}
              onAdd={() => undefined}
              onToggle={() => undefined}
            />
          </View>
        ) : null}

        {tab === 'Inside jokes' ? (
          <View className="mt-5">
            <InsideJokesWall
              ownerFirstName={first}
              analyticsIds={{
                note: PROFILE.inside_jokes.note,
                add: PROFILE.inside_jokes.add,
                filter: PROFILE.inside_jokes.filter,
                noteBody: PROFILE.inside_jokes.note_body
              }}
            />
          </View>
        ) : null}
      </ScreenBody>
    </Screen>
  );
}
