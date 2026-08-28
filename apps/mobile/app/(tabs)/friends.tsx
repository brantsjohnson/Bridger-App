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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TAB_COLOR,
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
import { useTabAttention } from '../../hooks/useTabAttention';
import { useInsideJokes } from '../../hooks/useInsideJokes';
import { createShareInvite } from '../../data/invites';
import { getInviteAccess } from '../../data/access';

/**
 * Feature flag: when false the search bar is not rendered at all.
 * Flip to true once live people search is ready (searchFriends is already stubbed).
 */
const searchEnabled = false;

export default function FriendsScreen() {
  // THIS SECTION DOES: theme colors for icons in the header.
  const c = useThemeColors();
  const router = useRouter();
  // THIS SECTION DOES: section title dots after the Friends nav-bar badge clears.
  const { sectionDots } = useTabAttention('friends');
  const friendsDot = TAB_COLOR.friends;

  // THIS SECTION DOES: load the roster, jokes wall, and this week's Friend Pod.
  const { sections, total, refresh, onMoveTier } = useFriends();
  const { jokes, onAdd: onAddJoke } = useInsideJokes('all');
  const { recap, refresh: refreshPod } = useFriendPod();

  // THIS SECTION DOES: local UI state for sheets, edit mode, and search.
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [jokeOpen, setJokeOpen] = useState(false);
  const [moving, setMoving] = useState<FriendRowPerson | null>(null);
  const [canInvite, setCanInvite] = useState(true);
  /** Freeze page scroll while a native drag is in progress. */
  const [rosterDragging, setRosterDragging] = useState(false);

  // THIS SECTION DOES: block Recap if the header + just won the tap (fall-through guard).
  const preferAddFriend = useRef(false);

  // THIS SECTION DOES: open the full-page weekly podcast (not a popup).
  const openPlayer = useCallback(() => {
    router.push('/recap');
  }, [router]);

  // THIS SECTION DOES: open the recap recorder from Friend Pod only (never header +).
  const openRecorder = useCallback(() => {
    // Header + and this row can fight if the title row remounts mid-tap.
    if (preferAddFriend.current) return;
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
  }, [recap?.canRecordAfter]);

  // THIS SECTION DOES: header + is add-friend only (QR / link / scan).
  const openAddFriend = useCallback(() => {
    if (!canInvite) {
      Alert.alert(
        'Invites paused',
        'During the TestFlight demo you cannot send invite links. Ask a friend who is already on Bridger to add you.'
      );
      return;
    }
    preferAddFriend.current = true;
    setRecordOpen(false);
    setAddOpen(true);
    // Clear the lock after the gesture settles so Pod record still works.
    setTimeout(() => {
      preferAddFriend.current = false;
    }, 400);
  }, [canInvite]);

  // THIS SECTION DOES: keep Edit / + as the same React nodes so the header
  // does not remount them on every Friends re-render (that let + taps hit Recap).
  const headerTrailing = useMemo(
    () => (
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
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-90"
        >
          {/* Solid ink circle + canvas plus so the + stays readable in both themes */}
          <PlusIcon size={18} color={c.canvas} strokeWidth={3} />
        </Pressable>
      </View>
    ),
    [editing, openAddFriend, c.canvas]
  );

  // THIS SECTION DOES: mark Friends as the active analytics surface on mount.
  useEffect(() => {
    openSurface('friends');
    void getInviteAccess()
      .then((a) => setCanInvite(a.canInvite))
      .catch(() => setCanInvite(true));
  }, []);

  // THIS SECTION DOES: in edit mode, show empty tier drop zones too.
  useEffect(() => {
    void refresh(editing);
  }, [editing, refresh]);

  const empty = total === 0;

  // THIS SECTION DOES: filter the roster when search is enabled.
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
        'Free Lite holds 5 Close friends and 30 Friends. They landed in Acquaintances. Co-op raises the caps and adds named groups.'
      );
    }
  };

  // THIS SECTION DOES: finish a Move-to sheet pick, then close the sheet.
  const handlePickerMove = async (tier: Tier) => {
    if (!moving) return;
    await retierPerson(moving, tier);
    setMoving(null);
  };

  return (
    <Screen tone="canvas">
      {/* THIS SECTION DOES: page title + Edit + Add-friend +. */}
      <ScreenHeader
        title="Friends"
        analyticsSurface="friends"
        trailing={headerTrailing}
      />

      {/* THIS SECTION DOES: the scrolling page body (frozen while dragging). */}
      <ScreenBody scrollEnabled={!rosterDragging}>
        {/* THIS SECTION DOES: optional search (feature-flagged off until live). */}
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

        {/* THIS SECTION DOES: Friend Pod + Inside Jokes when you have people. */}
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
                showDot={!!sectionDots.pod}
                dotColor={friendsDot}
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
                showDot={!!sectionDots.inside_jokes}
                dotColor={friendsDot}
                action={
                  // + opens the sheet to post a new sticky note
                  <Pressable
                    onPress={withAnalyticsPress(FRIENDS.inside_jokes.add, () => setJokeOpen(true))}
                    accessibilityRole="button"
                    accessibilityLabel="Add an Inside Joke"
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple active:opacity-90"
                  >
                    {/* Icon + (not a Text "+") so font metrics cannot shove it off-center. */}
                    <PlusIcon size={16} color="#FFFFFF" strokeWidth={3} />
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

        {/* THIS SECTION DOES: a short tip while Edit mode is on. */}
        {editing && !empty ? (
          <Text className="mb-1 mt-7 font-sans-sb text-[12px] text-ink-mute">
            Drag a friend into another group. Tap to pick instead.
          </Text>
        ) : null}

        {/* THIS SECTION DOES: empty state, or the tiered friends roster. */}
        {empty ? (
          <View className="mt-4">
            <ColdStart onAdd={() => openAddFriend()} inviteLocked={!canInvite} />
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

      {/* THIS SECTION DOES: sheets that open from the page (add, scan, recap, jokes, move). */}
      <AddFriendSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onShare={() => {
          if (!canInvite) {
            Alert.alert(
              'Invites paused',
              'During the TestFlight demo you cannot send invite links.'
            );
            return;
          }
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
