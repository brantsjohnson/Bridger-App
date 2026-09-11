// ============================================
// WHAT THIS FILE DOES (plain English):
// A friend's profile — same Spotify composition as your own page. Header
// (square photo, tier control, overflow) above tabs; About them uses the
// shared shell. In common / Inside jokes / Bucket / Notes stay as tabs.
// Analytics: surface=profile (friend view).
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
// #region agent log
import { debugScreenMount } from '../../lib/debug-instrumentation';
// #endregion
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SendIcon } from 'lucide-react-native';
import type {
  FavoriteModule,
  ObsessionSquare,
  PhotoBlock,
  Top5Item,
  WhereMetView
} from '@bridger/shared';
import { openSurface, PROFILE, trackProduct, type BucketItem, type Tier } from '@bridger/shared';
// Friend Favorites tiles are built from their fav groups (never the viewer's).
import {
  Screen,
  ScreenBody,
  SectionTitle,
  SegmentedTabs,
  withAnalyticsPress
} from '@bridger/ui';
import { CommonalityList } from '../../components/discover/CommonalityList';
import { InCommonThinOverlap } from '../../components/discover/ThinOverlapHint';
import { InsideJokesWall } from '../../components/friends/InsideJokesWall';
import { BucketList } from '../../components/profile/BucketList';
import { HowYouMetCard } from '../../components/profile/HowYouMetCard';
import { InCommonAnswers } from '../../components/profile/InCommonAnswers';
import { MutualFriendsStrip } from '../../components/profile/MutualFriendsStrip';
import { NotesReminders } from '../../components/profile/NotesReminders';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { SendDelightSheet } from '../../components/delight/SendDelightSheet';
import { ProfileHeaderBlock } from '../../components/profile/ProfileHeaderBlock';
import {
  ProfileSearchSheet,
  type ProfileSearchHit
} from '../../components/profile/ProfileSearchSheet';
import type { UpcomingEventRow } from '../../components/profile/UpcomingEventsSection';
import { SharedPlacePhotos } from '../../components/profile/SharedPlacePhotos';
import {
  PROFILE_HEADER_TO_TABS,
  PROFILE_TABS_TO_CONTENT
} from '../../components/profile/profileSpacing';
import type { Commonality } from '../../data/discover';
import { resolveEmojiBombId } from '../../data/delight';
import { listUpcomingForProfile } from '../../data/events';
import { moveTier } from '../../data/friends';
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
import { getPersonProfile, listPersonBucket } from '../../data/profile';
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
  // #region agent log
  useEffect(() => debugScreenMount('person'), []);
  // #endregion
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : 'maya';
  // Local copy so a retier updates the tier pill without leaving the screen.
  const [person, setPerson] = useState(() => personById(personId));
  const first = person.name.split(' ')[0];

  useEffect(() => {
    setPerson(personById(personId));
  }, [personId]);

  const [tab, setTab] = useState('About them');
  const [searchOpen, setSearchOpen] = useState(false);
  const [commonalities, setCommonalities] = useState<Commonality[]>([]);

  const [header, setHeader] = useState<MyProfileHeader>({
    // Empty city: never invent "Somewhere" (that looked like a broken load).
    city: person.label || '',
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
  const [greatestHits, setGreatestHits] = useState<PhotoBlock[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingEventRow[]>([]);
  const [whereMet, setWhereMet] = useState<WhereMetView | null>(null);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [bucketLoading, setBucketLoading] = useState(true);
  const [emojiBombOpen, setEmojiBombOpen] = useState(false);
  const [emojiBombId, setEmojiBombId] = useState<string | null>(null);

  useEffect(() => {
    openSurface('profile');
  }, []);

  // THIS SECTION DOES: only show Emoji bomb when that gift delighter is live.
  useEffect(() => {
    void resolveEmojiBombId().then(setEmojiBombId);
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
    void getPersonProfile(personId).then((p) => {
      if (!p) {
        setHeader({
          city: person.label || '',
          bio: '',
          song: { title: '', artist: '' }
        });
        setAbout([]);
        setHobbies([]);
        setHobbyFollowUps({});
        setFavs([]);
        setThisOrThat([]);
        setPlaces([]);
        setTop5([]);
        setObsession([]);
        setFavorites([]);
        setGreatestHits([]);
        return;
      }
      // PRIVACY: Top 5 / Obsession / Favorites come from THIS subject only.
      setHeader(p.header);
      setAbout(p.about);
      setHobbies(p.hobbies);
      setHobbyFollowUps(p.hobbyFollowUps ?? {});
      setFavs(p.favs);
      setThisOrThat(p.thisOrThat);
      setPlaces(p.places);
      setTop5(p.top5 ?? []);
      setObsession(p.obsession ?? []);
      setFavorites(favoriteModulesFromFriend(p.favs, p.thisOrThat));
      setGreatestHits(p.greatestHits ?? []);
      if (p.header.city) {
        setWhereMet({ label: p.header.city, via: undefined });
      }
    });
  }, [personId, person.label]);

  useEffect(() => {
    void listUpcomingForProfile(personId).then(setUpcoming);
  }, [personId]);

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
    try {
      const threadId = await startThreadWith(personId);
      router.push(`/messages/${threadId}`);
    } catch (e) {
      Alert.alert(
        'Messaging coming soon',
        e instanceof Error
          ? e.message
          : 'Messaging is not available in this build yet.'
      );
    }
  };

  // THIS SECTION DOES: save a new circle, update the pill, fire the product event.
  const handleRetier = async (tier: Tier) => {
    const from = person.tier ?? 'friend';
    if (tier === from) return;
    try {
      const result = await moveTier(personId, tier);
      setPerson((p) => ({ ...p, tier: result.landedIn }));
      if (result.landedIn !== from) {
        trackProduct('friend_retiered', {
          from_tier: from,
          to_tier: result.landedIn
        });
      }
      if (result.upsell) {
        Alert.alert(
          'Circle is full',
          'Your free Close / Friends spots are full. They landed in Acquaintances. Co-op raises the caps.'
        );
      }
    } catch {
      Alert.alert('Could not update', 'Try again in a moment.');
    }
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
          onRetier={(t) => void handleRetier(t)}
          heroTrailing={
            <View className="flex-row items-center gap-2">
              {emojiBombId ? (
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.actions.emoji_bomb, () =>
                    setEmojiBombOpen(true)
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={`Send emoji bomb to ${first}`}
                  className="h-10 min-w-[44px] items-center justify-center rounded-full border border-ink-line bg-canvas px-3 active:opacity-90"
                >
                  <Text className="font-sans-b text-[13px] text-ink">Emoji bomb</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={withAnalyticsPress(PROFILE.actions.message, () => void openMessage())}
                accessibilityRole="button"
                accessibilityLabel={`Message ${first}`}
                className="h-10 flex-row items-center gap-1.5 rounded-full bg-coral px-3.5 active:opacity-90"
              >
                <Text className="font-sans-b text-[13px] text-white">Message</Text>
                <SendIcon size={16} color="#FFFFFF" strokeWidth={2.6} />
              </Pressable>
            </View>
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
              greatestHits={greatestHits}
              upcoming={upcoming}
              hobbyFollowUps={hobbyFollowUps}
              mutuals={mutuals}
              whereMet={whereMet}
              asTier={person.tier}
              onOpenMutuals={() => setTab('In common')}
              onOpenEvent={(eid) => router.push(`/event/${eid}`)}
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
              <InCommonThinOverlap
                firstName={first}
                bodyAnalyticsId={PROFILE.in_common.empty_body}
                ctaAnalyticsId={PROFILE.in_common.personality_quizzes}
                onOpenQuizzes={() => router.push('/discover/connect-over')}
              />
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
              personId={personId}
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

      {emojiBombId ? (
        <SendDelightSheet
          open={emojiBombOpen}
          onClose={() => setEmojiBombOpen(false)}
          toUserId={personId}
          toFirstName={first}
          delightId={emojiBombId}
        />
      ) : null}
    </Screen>
  );
}
