// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friends tab: your confirmed circle, grouped by Close / Friends /
// Acquaintances. Edit moves people between circles (TierPicker replaces web
// drag-and-drop). The + opens Add friend (QR + link + scan). Friend Pod and
// Inside Jokes sit above the roster. Data comes from hooks so demo fixtures
// and the live API use the same screen.
// Analytics: opens the friends surface on mount; every control uses FRIENDS.*
// ids from the shared taxonomy (no invented names).
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import type { Tier } from '@bridger/shared';
import { FRIENDS, TIER_LABEL, openSurface } from '@bridger/shared';
import {
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  SectionTitle,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { ColdStart } from '../../components/ColdStart';
import { AddFriendSheet } from '../../components/friends/AddFriendSheet';
import { AddInsideJokeSheet } from '../../components/friends/AddInsideJokeSheet';
import { FriendPodWidget } from '../../components/friends/FriendPodWidget';
import { FriendRow, type FriendRowPerson } from '../../components/friends/FriendRow';
import { InsideJokesWidget } from '../../components/friends/InsideJokesWall';
import { SubmitQuestion } from '../../components/friends/SubmitQuestion';
import { TierPicker } from '../../components/friends/TierPicker';
import { useFriends } from '../../hooks/useFriends';
import { useInsideJokes } from '../../hooks/useInsideJokes';

// Short "what this circle means" copy for each Friends tier title.
const TIER_DESCRIPTIONS: Record<Tier, string> = {
  close: 'Your innermost circle. They see the most of your profile and updates.',
  friend: 'Your main circle. They see most of what you share.',
  acquaintance: 'People you know a little. They see the least of your profile.',
  none: 'Private, visible only to you.'
};

/**
 * Feature flag: when false the search bar is not rendered at all.
 * Flip to true once live people search is ready (searchFriends is already stubbed).
 */
const searchEnabled = false;

export default function FriendsScreen() {
  const router = useRouter();
  const { sections, total, refresh, onMoveTier } = useFriends();
  const { jokes, onAdd: onAddJoke } = useInsideJokes('all');

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [jokeOpen, setJokeOpen] = useState(false);
  const [moving, setMoving] = useState<FriendRowPerson | null>(null);

  // Mark Friends as the active analytics surface when this tab mounts.
  useEffect(() => {
    openSurface('friends');
  }, []);

  // Edit mode shows empty tier drop zones so you can move the last person out.
  useEffect(() => {
    void refresh(editing);
  }, [editing, refresh]);

  const empty = total === 0;

  const filteredSections = sections.map((s) => ({
    ...s,
    people: searchEnabled && query.trim()
      ? s.people.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
      : s.people
  }));

  const openMove = (person: FriendRowPerson) => setMoving(person);

  const handleRowPress = (person: FriendRowPerson) => {
    if (editing) {
      openMove(person);
      return;
    }
    // Open that friend's profile (same destination as Coming up).
    router.push({ pathname: '/person/[id]', params: { id: person.id } });
  };

  const handleMove = async (tier: Tier) => {
    if (!moving) return;
    const result = await onMoveTier(moving.id, tier, editing);
    if (result.upsell) {
      Alert.alert(
        'Circle is full',
        'Free plans hold 10 Close friends and 25 Friends. They landed in Acquaintances. Co-op lifts the caps.'
      );
    }
    setMoving(null);
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Friends"
        analyticsSurface="friends"
        trailing={
          <View className="flex-row items-center gap-2">
            {/* Edit toggles move-between-circles mode */}
            <ButtonSecondary
              size="sm"
              className="h-10"
              tone={editing ? 'solid' : 'outline'}
              onPress={() => setEditing((v) => !v)}
              accessibilityLabel={editing ? 'Done editing friends' : 'Edit friends'}
              analyticsId={FRIENDS.top_nav.edit}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            {/* + opens the Add-friend sheet (QR / link / scan) */}
            <Pressable
              onPress={withAnalyticsPress(FRIENDS.top_nav.add, () => setAddOpen(true))}
              accessibilityRole="button"
              accessibilityLabel="Add friend"
              className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-90"
            >
              <PlusIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
            </Pressable>
          </View>
        }
      />

      <ScreenBody>
        {searchEnabled ? (
          <View className="mb-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search friends"
              analyticsId={FRIENDS.top_nav.search}
            />
          </View>
        ) : null}

        {/* Friend Pod + Inside Jokes only when you have people */}
        {!empty ? (
          <>
            <View>
              <SectionTitle
                title="Friend Pod"
                description="A short recap of your friends' week, bundled so you can catch up fast."
                infoAnalyticsId={FRIENDS.pod.info}
                parentScreen="friends"
                section="pod"
                className="mb-2"
              />
              <FriendPodWidget
                size="full"
                onPlay={() =>
                  Alert.alert(
                    "Your friends' week",
                    'The full Friend Pod player ships next. For now this is the entry.'
                  )
                }
                onRecord={() =>
                  Alert.alert('Add your recap', 'Voice recording for the weekly pod ships with the player.')
                }
                onSubmitQuestion={() => setQuestionOpen(true)}
              />
            </View>

            <View className="mt-7">
              <SectionTitle
                title="Inside jokes"
                description="Little notes and quotes you save with friends so the good moments stick around."
                infoAnalyticsId={FRIENDS.inside_jokes.info}
                parentScreen="friends"
                section="inside_jokes"
                className="mb-2"
                action={
                  // + opens the sheet to post a new sticky note
                  <Pressable
                    onPress={withAnalyticsPress(FRIENDS.inside_jokes.add, () => setJokeOpen(true))}
                    accessibilityRole="button"
                    accessibilityLabel="Add an Inside Joke"
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple active:opacity-90"
                  >
                    <Text className="font-sans-b text-[18px] leading-none text-white">+</Text>
                  </Pressable>
                }
              />
              <InsideJokesWidget
                size="full"
                jokes={jokes}
                analyticsIds={{
                  note: FRIENDS.inside_jokes.note,
                  add: FRIENDS.inside_jokes.add,
                  noteBody: FRIENDS.inside_jokes.note_body
                }}
              />
            </View>
          </>
        ) : null}

        {editing && !empty ? (
          <Text className="mb-1 mt-7 font-sans-sb text-[12px] text-ink-mute">
            Tap a friend to move them into a circle.
          </Text>
        ) : null}

        {empty ? (
          <View className="mt-4">
            <ColdStart onAdd={() => setAddOpen(true)} />
          </View>
        ) : (
          filteredSections.map((section) => {
            if (section.people.length === 0 && !editing) return null;
            return (
              <View
                key={section.tier}
                className={cn(
                  'mt-7 rounded-2xl',
                  editing && 'border border-dashed border-ink/20 p-3'
                )}
              >
                {/* Tier title: dashed underline + short "what this circle means" bubble */}
                <SectionTitle
                  title={TIER_LABEL[section.tier]}
                  description={TIER_DESCRIPTIONS[section.tier]}
                  infoAnalyticsId={FRIENDS.roster.info}
                  parentScreen="friends"
                  section="roster"
                  analyticsProps={{ tier: section.tier }}
                  count={section.people.length}
                  className="mb-2"
                />

                <View className="gap-2.5">
                  {section.people.length === 0 && editing ? (
                    <Text className="py-3 text-center font-sans-sb text-[12px] text-ink-mute">
                      Move someone here
                    </Text>
                  ) : null}

                  {section.people.map((p, i) => (
                    <FriendRow
                      key={p.id}
                      person={p}
                      index={i}
                      editing={editing}
                      onPress={() => handleRowPress(p)}
                      onLongPress={() => openMove(p)}
                      onStory={() => router.push(`/story/${p.id}`)}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScreenBody>

      <AddFriendSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onShare={() => {
          setAddOpen(false);
          Alert.alert('Invite link', 'Share sheet opens here when invite-links ship.');
        }}
        onScan={() => {
          setAddOpen(false);
          Alert.alert('Scan a code', 'Camera opens here when QR scan ships.');
        }}
      />

      <SubmitQuestion open={questionOpen} onClose={() => setQuestionOpen(false)} />

      <AddInsideJokeSheet
        open={jokeOpen}
        onClose={() => setJokeOpen(false)}
        onAdd={onAddJoke}
      />

      <TierPicker
        open={!!moving}
        onClose={() => setMoving(null)}
        personName={moving?.name ?? ''}
        currentTier={moving?.tier ?? 'friend'}
        onPick={(tier) => void handleMove(tier)}
      />
    </Screen>
  );
}
