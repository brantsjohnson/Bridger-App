// ============================================
// WHAT THIS FILE DOES (plain English):
// Your own Profile tab — Spotify-artist layout. Square header with Edit and a
// Settings gear on the photo; View as + search sit under it. Stories / Inside
// jokes / Bucket list stay as sibling tabs. Settings opens from the gear (not
// a tab). The floating pill nav STAYS here (your face on the pill is how you
// got here), but there is no top "Profile" title bar. Analytics: surface=profile.
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import type { Tier } from '@bridger/shared';
import { openSurface, PROFILE } from '@bridger/shared';
import {
  Screen,
  ScreenBody,
  SegmentedTabs,
  withAnalyticsPress
} from '@bridger/ui';
import { useProfile } from '../../hooks/useProfile';
import { useBucketList } from '../../hooks/useBucketList';
import { useStoryArchive } from '../../hooks/useStoryArchive';
import { listArchivedQuizzes } from '../../data/quiz';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { ProfileHeaderBlock } from '../../components/profile/ProfileHeaderBlock';
import { ProfileIntro } from '../../components/profile/ProfileIntro';
import {
  ProfileSearchSheet,
  type ProfileSearchHit
} from '../../components/profile/ProfileSearchSheet';
import { StoryCalendar } from '../../components/profile/StoryCalendar';
import { BucketList } from '../../components/profile/BucketList';
import { ProfileSettings } from '../../components/profile/ProfileSettings';
import { InsideJokesWall } from '../../components/friends/InsideJokesWall';
import {
  PROFILE_HEADER_TO_TABS,
  PROFILE_TABS_TO_CONTENT
} from '../../components/profile/profileSpacing';

const TABS = ['Profile', 'Stories', 'Inside jokes', 'Bucket list'];

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
    default:
      return undefined;
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfile();
  const bucket = useBucketList();
  const archive = useStoryArchive();

  const [tab, setTab] = useState('Profile');
  // Settings is a gear on the photo, not a tab. When open, hide tab content.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [asTier, setAsTier] = useState<Tier>('close');
  const [searchOpen, setSearchOpen] = useState(false);
  const [untakenQuizzes, setUntakenQuizzes] = useState<
    Array<{ slug: string; title: string; friendsTakenCount: number }>
  >([]);

  useEffect(() => {
    openSurface('profile');
  }, []);

  useEffect(() => {
    let cancelled = false;
    listArchivedQuizzes()
      .then((rows) => {
        if (!cancelled) setUntakenQuizzes(rows);
      })
      .catch(() => {
        if (!cancelled) setUntakenQuizzes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchHits: ProfileSearchHit[] = useMemo(() => {
    const hits: ProfileSearchHit[] = [];
    if (profile.header?.city) {
      hits.push({
        id: 'city',
        label: 'City',
        value: profile.header.city,
        section: 'Header'
      });
    }
    if (profile.header?.bio) {
      hits.push({
        id: 'bio',
        label: 'Bio',
        value: profile.header.bio,
        section: 'About me'
      });
    }
    for (const f of profile.about) {
      hits.push({ id: f.id, label: f.key, value: f.value, section: 'About me' });
    }
    for (const t of profile.top5) {
      hits.push({
        id: t.id,
        label: `Top 5 #${t.order + 1}`,
        value: t.text,
        section: 'Top 5'
      });
    }
    for (const o of profile.obsession) {
      hits.push({
        id: o.id,
        label: String(o.prompt),
        value: o.text ?? '',
        section: 'Current Obsession'
      });
    }
    for (const h of profile.hobbies) {
      hits.push({
        id: h.id,
        label: h.label,
        value: profile.hobbyFollowUps[h.id]?.answer ?? h.label,
        section: 'Hobbies'
      });
    }
    for (const g of profile.favs) {
      for (const item of g.items) {
        hits.push({
          id: `${g.group}-${item}`,
          label: g.group,
          value: item,
          section: 'Favorites'
        });
      }
    }
    for (const p of profile.places) {
      hits.push({ id: p.id, label: p.label, value: p.note, section: 'Places' });
    }
    return hits;
  }, [profile]);

  // THIS SECTION DOES: make sure the location pin is filled. The header city
  // comes from home_city, but if onboarding only stored "Lives in"/"Hometown"
  // as an About Me field, fall back to that so the pin is never blank.
  const headerWithCity = useMemo(() => {
    if (!profile.header) return profile.header;
    if (profile.header.city?.trim()) return profile.header;
    const findAbout = (label: string) =>
      profile.about.find((f) => f.key.trim().toLowerCase() === label)?.value?.trim();
    const fallbackCity = findAbout('lives in') || findAbout('hometown') || '';
    if (!fallbackCity) return profile.header;
    return { ...profile.header, city: fallbackCity };
  }, [profile.header, profile.about]);

  // THIS SECTION DOES: leave Settings when the person picks a content tab.
  const onChangeTab = (next: string) => {
    setSettingsOpen(false);
    setTab(next);
  };

  return (
    <Screen tone="canvas">
      {/* tabBarInset keeps the last content clear of the floating pill (now shown here). */}
      <ScreenBody padded={false}>
        {/* THIS SECTION DOES: Spotify header (back/name/city ON the photo). */}
        <ProfileHeaderBlock
          person={profile.me}
          header={headerWithCity}
          own
          editing={editing}
          empty={false}
          asTier={asTier}
          onBack={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/home');
          }}
          onToggleEdit={() => {
            setEditing((v) => !v);
            setAsTier('close');
            setSettingsOpen(false);
          }}
          onOpenSettings={() => {
            setEditing(false);
            setSettingsOpen(true);
          }}
          onViewAs={setAsTier}
          onOpenStory={() => router.push('/story/me?from=profile')}
          onSearch={() => setSearchOpen(true)}
        />

        <View style={{ marginTop: PROFILE_HEADER_TO_TABS, paddingHorizontal: 16 }}>
          <SegmentedTabs
            tabs={TABS}
            // Empty value while Settings is open so no tab looks selected.
            value={settingsOpen ? '' : tab}
            onChange={onChangeTab}
            variant="underline"
            analyticsIdForTab={profileTabAnalyticsId}
          />
        </View>

        {settingsOpen ? (
          <View className="mt-5 px-4">
            <ProfileSettings
              blocked={profile.blocked}
              storage={archive.storage}
              onUnblock={(id) => void profile.onUnblock(id)}
            />
          </View>
        ) : null}

        {!settingsOpen && tab === 'Profile' ? (
          <View style={{ marginTop: PROFILE_TABS_TO_CONTENT }}>
            <ProfileCard
              person={profile.me}
              header={headerWithCity}
              about={profile.about}
              hobbies={profile.hobbies}
              favs={profile.favs}
              thisOrThat={profile.thisOrThat}
              places={profile.places}
              top5={profile.top5}
              obsession={profile.obsession}
              favorites={profile.favorites}
              greatestHits={profile.greatestHits}
              upcoming={profile.upcoming}
              hobbyFollowUps={profile.hobbyFollowUps}
              editable={editing}
              own
              showHeader={false}
              asTier={asTier}
              onAnswered={() => void profile.refresh()}
              onOpenStory={() => router.push('/story/me?from=profile')}
              onOpenEvent={(id) => router.push(`/event/${id}` as Href)}
            />

            {untakenQuizzes.length > 0 ? (
              <View className="mt-6 px-4">
                <Text className="mb-2 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                  Quizzes to catch up on
                </Text>
                <View className="gap-2">
                  {untakenQuizzes.map((q) => (
                    <Pressable
                      key={q.slug}
                      onPress={withAnalyticsPress(PROFILE.quizzes.untaken_row, () =>
                        router.push(`/quiz/${q.slug}` as Href)
                      )}
                      accessibilityRole="button"
                      accessibilityLabel={`${q.title}. ${q.friendsTakenCount} friends took this`}
                      className="min-h-[52px] flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
                    >
                      <Text
                        className="min-w-0 flex-1 font-sans-b text-[14px] text-ink"
                        numberOfLines={1}
                      >
                        {q.title}
                      </Text>
                      <Text className="ml-3 font-sans-sb text-[12px] text-ink-mute">
                        {q.friendsTakenCount} friends
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {!settingsOpen && tab === 'Stories' ? (
          <View className="mt-5 px-4">
            <StoryCalendar
              days={archive.days}
              storage={archive.storage}
              onOpenStory={() => router.push('/story/me?catchup=1&from=profile')}
            />
          </View>
        ) : null}

        {!settingsOpen && tab === 'Inside jokes' ? (
          <View className="mt-5 px-4">
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

        {!settingsOpen && tab === 'Bucket list' ? (
          <View className="mt-5 px-4">
            <BucketList
              items={bucket.items}
              loading={bucket.loading}
              editable
              onAdd={bucket.onAdd}
              onToggle={bucket.onToggle}
              onUpdate={bucket.onUpdate}
              onDelete={bucket.onDelete}
            />
          </View>
        ) : null}
      </ScreenBody>

      <ProfileIntro
        open={!profile.introSeen && !profile.loading}
        onContinue={() => void profile.onIntroContinue()}
      />
      <ProfileSearchSheet
        open={searchOpen}
        hits={searchHits}
        onClose={() => setSearchOpen(false)}
        onJump={() => {
          setSettingsOpen(false);
          setTab('Profile');
        }}
      />
    </Screen>
  );
}
