// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friends tab: your confirmed circle, grouped by Close / Friends /
// Acquaintances. Edit mode lets you drag people into another group (or use
// the Move-to sheet via tap / long-press). The header + is Add friend ONLY
// (QR / link / scan) — "Add your recap" lives on the Friend Pod card below.
// Friend Pod and Inside Jokes sit above the roster.
// Analytics: opens the friends surface on mount; every control uses FRIENDS.*
// ids from the shared taxonomy (no invented names).
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import type { Tier } from '@bridger/shared';
import { FRIENDS, openSurface, trackProduct } from '@bridger/shared';
import {
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  SectionTitle,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { ColdStart } from '../../components/ColdStart';
import { AddFriendSheet } from '../../components/friends/AddFriendSheet';
import { AddInsideJokeSheet } from '../../components/friends/AddInsideJokeSheet';
import { FriendPodWidget } from '../../components/friends/FriendPodWidget';
import { FriendsRoster } from '../../components/friends/FriendsRoster';
import type { FriendRowPerson } from '../../components/friends/FriendRow';
import { InsideJokesWidget } from '../../components/friends/InsideJokesWall';
import { ScanFriendSheet } from '../../components/friends/ScanFriendSheet';
import { SubmitQuestion } from '../../components/friends/SubmitQuestion';
import { TierPicker } from '../../components/friends/TierPicker';
import { RecapRecorder } from '../../components/pod/RecapRecorder';
import { useFriendPod } from '../../hooks/useFriendPod';
import { useFriends } from '../../hooks/useFriends';
import { useInsideJokes } from '../../hooks/useInsideJokes';
import { createShareInvite } from '../../data/invites';

/**
 * Feature flag: when false the search bar is not rendered at all.
 * Flip to true once live people search is ready (searchFriends is already stubbed).
 */
const searchEnabled = false;

export default function FriendsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { sections, total, refresh, onMoveTier } = useFriends();
  const { jokes, onAdd: onAddJoke } = useInsideJokes('all');
  const { recap, refresh: refreshPod } = useFriendPod();

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  // Play opens the full-page weekly podcast (not a popup).
  const openPlayer = () => {
    router.push('/recap');
  };

  // Record opens the recorder, unless the user's rolling week hasn't reset yet.
  // Only wired to "Add your recap" in Friend Pod — never the header +.
  const openRecorder = () => {
    if (recap?.canRecordAfter) {
      const when = new Date(recap.canRecordAfter);
      Alert.alert(
        'Already recorded',
        `You can add a new recap after ${when.toLocaleDateString()}.`
      );
      return;
    }
    setAddOpen(false);
    setRecordOpen(true);
  };

  // Header + is add-friend only (QR / link / scan). Never opens the recap recorder.
  const openAddFriend = () => {
    setRecordOpen(false);
    setAddOpen(true);
  };
  const [jokeOpen, setJokeOpen] = useState(false);
  const [moving, setMoving] = useState<FriendRowPerson | null>(null);
  /** Freeze page scroll while a native drag is in progress. */
  const [rosterDragging, setRosterDragging] = useState(false);

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

  // THIS SECTION DOES: move someone into a new circle (drag or picker).
  const retierPerson = async (person: FriendRowPerson, tier: Tier) => {
    if (person.tier === tier) return;
    const from = person.tier ?? 'friend';
    const result = await onMoveTier(person.id, tier, editing);
    // Outcome only when the circle actually changes — never names.
    if (result.landedIn !== from) {
      trackProduct('friend_retiered', {
        from_tier: from,
        to_tier: result.landedIn
      });
    }
    if (result.upsell) {
      Alert.alert(
        'Circle is full',
        'Free plans hold 10 Close friends and 25 Friends. They landed in Acquaintances. Co-op lifts the caps.'
      );
    }
  };

  const handlePickerMove = async (tier: Tier) => {
    if (!moving) return;
    await retierPerson(moving, tier);
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
              tone={editing ? 'solid' : 'light'}
              onPress={() => setEditing((v) => !v)}
              accessibilityLabel={editing ? 'Done editing friends' : 'Edit friends'}
              analyticsId={FRIENDS.top_nav.edit}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            {/* + opens Add friend only (never the recap / podcast recorder) */}
            <Pressable
              onPress={withAnalyticsPress(FRIENDS.top_nav.add, openAddFriend)}
              accessibilityRole="button"
              accessibilityLabel="Add friend"
              className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-90"
            >
              {/* Solid ink circle + canvas plus so the + stays readable in both themes */}
              <PlusIcon size={18} color={c.canvas} strokeWidth={3} />
            </Pressable>
          </View>
        }
      />

      <ScreenBody scrollEnabled={!rosterDragging}>
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
                onPlay={() => void openPlayer()}
                onRecord={openRecorder}
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
            Drag a friend into another group. Tap to pick instead.
          </Text>
        ) : null}

        {empty ? (
          <View className="mt-4">
            <ColdStart onAdd={() => setAddOpen(true)} />
          </View>
        ) : (
          <FriendsRoster
            sections={filteredSections}
            editing={editing}
            onOpenPerson={(p) =>
              router.push({ pathname: '/person/[id]', params: { id: p.id } })
            }
            onOpenStory={(p) => router.push(`/story/${p.id}?from=profile`)}
            onOpenMove={openMove}
            onDropTier={(p, tier) => void retierPerson(p, tier)}
            onDraggingChange={setRosterDragging}
          />
        )}
      </ScreenBody>

      <AddFriendSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onShare={() => {
          setAddOpen(false);
          void (async () => {
            try {
              const invite = await createShareInvite();
              await Share.share({
                message: `Add me on Bridger\n${invite.url}`,
                url: invite.url
              });
            } catch (e) {
              Alert.alert(
                'Could not make invite link',
                e instanceof Error ? e.message : 'Try again.'
              );
            }
          })();
        }}
        onScan={() => {
          setAddOpen(false);
          setScanOpen(true);
        }}
      />

      <ScanFriendSheet open={scanOpen} onClose={() => setScanOpen(false)} />

      <SubmitQuestion open={questionOpen} onClose={() => setQuestionOpen(false)} />

      {/* Add your recap: record the week's 5 questions by voice */}
      <RecapRecorder
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        weekId={recap?.week.id ?? ''}
        questions={recap?.week.questions ?? []}
        onPosted={() => void refreshPod()}
      />

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
        onPick={(tier) => void handlePickerMove(tier)}
      />
    </Screen>
  );
}
