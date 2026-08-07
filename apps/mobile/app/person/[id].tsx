// ============================================
// WHAT THIS FILE DOES (plain English):
// A friend's profile — same Spotify composition as your own page. Header
// (square photo, tier control, overflow) above tabs; About them uses the
// shared shell. In common / Inside jokes / Bucket / Notes stay as tabs.
// Analytics: surface=profile (friend view).
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SendIcon } from 'lucide-react-native';
import type { FavoriteModule, ObsessionSquare, Top5Item, WhereMetView } from '@bridger/shared';
import { openSurface, PROFILE, type BucketItem } from '@bridger/shared';
// Friend Favorites tiles are built from their fav groups (never the viewer's).
import {
  Screen,
  ScreenBody,
  SectionTitle,
  SegmentedTabs,
  withAnalyticsPress
} from '@bridger/ui';
import { CommonalityList } from '../../components/discover/CommonalityList';
import { InsideJokesWall } from '../../components/friends/InsideJokesWall';
import { BucketList } from '../../components/profile/BucketList';
import { HowYouMetCard } from '../../components/profile/HowYouMetCard';
import { InCommonAnswers } from '../../components/profile/InCommonAnswers';
import { MutualFriendsStrip } from '../../components/profile/MutualFriendsStrip';
import { NotesReminders } from '../../components/profile/NotesReminders';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { ProfileHeaderBlock } from '../../components/profile/ProfileHeaderBlock';
import {
  ProfileSearchSheet,
  type ProfileSearchHit
} from '../../components/profile/ProfileSearchSheet';
import { SharedPlacePhotos } from '../../components/profile/SharedPlacePhotos';
import {
  PROFILE_HEADER_TO_TABS,
  PROFILE_TABS_TO_CONTENT
} from '../../components/profile/profileSpacing';
import type { Commonality } from '../../data/discover';
import { startThreadWith } from '../../data/messages';
import { mutualFriendsWith, personById } from '../../data/people';
import type {
  AboutField,
  FavGroup,
  Interest,
  MyProfileHeader,
  ThisOrThatRow,
  TravelPlace
} from '../../data/profile';
import {
  getPersonProfile,
  listObsession,
  listPersonBucket,
  listTop5
} from '../../data/profile';
import { getReveal } from '../../data/reveal';

/** Build album tiles from a friend's filled groups only (read-only). */
function favoriteModulesFromFriend(
  favs: FavGroup[],
  tot: ThisOrThatRow[]
): FavoriteModule[] {
  const countFor = (group: string) => {
    const g = favs.find((row) => row.group === group);
    return g?.total ?? g?.items.length ?? 0;
  };
  const catalog: Array<{ id: string; label: string; emoji: string; count: number }> = [
    { id: 'food_drinks', label: 'Food & drinks', emoji: '🍜', count: countFor('Food') },
    {
      id: 'entertainment',
      label: 'Entertainment',
      emoji: '🎬',
      count: countFor('Entertainment')
    },
    { id: 'everyday', label: 'Everyday', emoji: '🧺', count: countFor('Everyday') },
    { id: 'sports', label: 'Sports', emoji: '🚲', count: countFor('Sports') },
    { id: 'this_or_that', label: 'This or that', emoji: '⚖️', count: tot.length }
  ];
  return catalog
    .filter((m) => m.count > 0)
    .map((m) => ({
      id: m.id,
      label: m.label,
      emoji: m.emoji,
      answeredCount: m.count,
      empty: false
    }));
}

const TABS = ['About them', 'In common', 'Inside jokes', 'Bucket list', 'Notes'];

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
    case 'Notes':
      return PROFILE.friend_tabs.notes;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [commonalities, setCommonalities] = useState<Commonality[]>([]);

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
  const [top5, setTop5] = useState<Top5Item[]>([]);
  const [obsession, setObsession] = useState<ObsessionSquare[]>([]);
  const [favorites, setFavorites] = useState<FavoriteModule[]>([]);
  const [whereMet, setWhereMet] = useState<WhereMetView | null>(null);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [bucketLoading, setBucketLoading] = useState(true);

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

  useEffect(() => {
    void getPersonProfile(personId).then(async (p) => {
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
      // Demo: reuse own top5/obsession fixtures for friend card richness.
      // Favorites tiles come from THIS friend's answers only.
      const [t5, ob] = await Promise.all([listTop5(), listObsession()]);
      setTop5(t5);
      setObsession(ob);
      setFavorites(favoriteModulesFromFriend(p.favs, p.thisOrThat));
      if (p.header.city) {
        setWhereMet({ label: p.header.city, via: undefined });
      }
    });
  }, [personId, person.label]);

  const mutuals = mutualFriendsWith(personId);

  const searchHits: ProfileSearchHit[] = useMemo(() => {
    const hits: ProfileSearchHit[] = [];
    if (header.city) {
      hits.push({ id: 'city', label: 'City', value: header.city, section: 'Header' });
    }
    for (const f of about) {
      hits.push({ id: f.id, label: f.key, value: f.value, section: 'About me' });
    }
    for (const t of top5) {
      hits.push({
        id: t.id,
        label: `Top 5 #${t.order + 1}`,
        value: t.text,
        section: 'Top 5'
      });
    }
    return hits;
  }, [header, about, top5]);

  const openMessage = async () => {
    const threadId = await startThreadWith(personId);
    router.push(`/messages/${threadId}`);
  };

  return (
    <Screen tone="canvas">
      <ScreenBody padded={false}>
        <ProfileHeaderBlock
          person={person}
          header={header}
          own={false}
          editing={false}
          empty={false}
          onBack={() => router.back()}
          onOpenStory={() => router.push(`/story/${personId}?from=profile`)}
          onSearch={() => setSearchOpen(true)}
          heroTrailing={
            <Pressable
              onPress={withAnalyticsPress(PROFILE.actions.message, () => void openMessage())}
              accessibilityRole="button"
              accessibilityLabel={`Message ${first}`}
              className="h-10 flex-row items-center gap-1.5 rounded-full bg-coral px-3.5 active:opacity-90"
            >
              <Text className="font-sans-b text-[13px] text-white">Message</Text>
              <SendIcon size={16} color="#FFFFFF" strokeWidth={2.6} />
            </Pressable>
          }
        />

        <View style={{ marginTop: PROFILE_HEADER_TO_TABS, paddingHorizontal: 16 }}>
          <SegmentedTabs
            tabs={TABS}
            value={tab}
            onChange={setTab}
            variant="underline"
            analyticsIdForTab={friendTabAnalyticsId}
          />
        </View>

        {tab === 'About them' ? (
          <View style={{ marginTop: PROFILE_TABS_TO_CONTENT }}>
            <ProfileCard
              person={person}
              header={header}
              showHeader={false}
              about={about}
              hobbies={hobbies}
              favs={favs}
              thisOrThat={thisOrThat}
              places={places}
              top5={top5}
              obsession={obsession}
              favorites={favorites}
              hobbyFollowUps={hobbyFollowUps}
              mutuals={mutuals}
              whereMet={whereMet}
              asTier={person.tier}
              onOpenMutuals={() => setTab('In common')}
            />
          </View>
        ) : null}

        {tab === 'In common' ? (
          <View className="mt-5 gap-7 px-4">
            <MutualFriendsStrip
              people={mutuals}
              onOpenPerson={(pid) =>
                router.push({ pathname: '/person/[id]', params: { id: pid } })
              }
            />
            <SectionTitle
              title="In common"
              description="What you and they share — hobbies, places, quiz results, and matching answers. Shared hobbies show both answers side by side."
              infoAnalyticsId={PROFILE.in_common.info}
              parentScreen="profile"
              section="in_common"
              className="mb-1"
            />
            {commonalities.length > 0 ? (
              <CommonalityList items={commonalities} theirName={first} />
            ) : (
              <View className="rounded-2xl border border-dashed border-ink-line bg-surface px-4 py-8">
                <Text className="text-center font-sans-sb text-[14px] leading-snug text-ink-mute">
                  What you share with {first} shows up here after you connect -
                  the same commonalities from the reveal.
                </Text>
              </View>
            )}
            <InCommonAnswers
              theirName={first}
              rows={Object.entries(hobbyFollowUps)
                .slice(0, 6)
                .map(([hid, fu]) => ({
                  id: hid,
                  label: hobbies.find((h) => h.id === hid)?.label ?? hid,
                  emoji: hobbies.find((h) => h.id === hid)?.emoji,
                  yours: fu.answer,
                  theirs: fu.answer
                }))}
            />
            <HowYouMetCard personId={personId} />
            <SharedPlacePhotos personId={personId} theirName={first} />
          </View>
        ) : null}

        {tab === 'Bucket list' ? (
          <View className="mt-5 px-4">
            <BucketList
              items={bucket}
              loading={bucketLoading}
              onAdd={() => undefined}
              onToggle={() => undefined}
            />
          </View>
        ) : null}

        {tab === 'Inside jokes' ? (
          <View className="mt-5 px-4">
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

        {tab === 'Notes' ? (
          <View className="mt-5 px-4">
            <NotesReminders personId={personId} firstName={first} />
          </View>
        ) : null}
      </ScreenBody>

      <ProfileSearchSheet
        open={searchOpen}
        hits={searchHits}
        onClose={() => setSearchOpen(false)}
        onJump={() => setTab('About them')}
      />
    </Screen>
  );
}
