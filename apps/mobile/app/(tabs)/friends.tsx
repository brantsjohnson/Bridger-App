// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friends tab: your confirmed circle, grouped by Close / Friends /
// Acquaintances. Edit mode lets you drag people into another group (or use
// the Move-to sheet via tap / long-press). "Add friend" and the empty state
// open Connect your contacts (or QR / link / scan). Search filters the roster.
// Cards you made for people not on Bridger yet sit above the live roster.
// Friend Pod and Inside Jokes sit above the roster.
// Analytics: opens the friends surface on mount; every control uses FRIENDS.*
// ids from the shared taxonomy (no invented names).
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
// #region agent log
import { debugScreenMount } from '../../lib/debug-instrumentation';
// #endregion
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
  withAnalyticsPress
} from '@bridger/ui';
import { ColdStart } from '../../components/ColdStart';
import { ContactInviteSheet } from '../../components/invite/ContactInviteSheet';
import { AddFriendSheet } from '../../components/friends/AddFriendSheet';
import { PendingFriendRow } from '../../components/friends/PendingFriendRow';
import { AddInsideJokeSheet } from '../../components/friends/AddInsideJokeSheet';
import { FriendPodWidget } from '../../components/friends/FriendPodWidget';
import { FriendsRoster } from '../../components/friends/FriendsRoster';
import type { FriendRowPerson } from '../../components/friends/FriendRow';
import { InsideJokesWidget } from '../../components/friends/InsideJokesWall';
import { ScanFriendSheet } from '../../components/friends/ScanFriendSheet';
import { TierPicker } from '../../components/friends/TierPicker';
import { useConnectContacts } from '../../hooks/useConnectContacts';
import { useFriends } from '../../hooks/useFriends';
import { useTabAttention } from '../../hooks/useTabAttention';
import { useInsideJokes } from '../../hooks/useInsideJokes';
import { createShareInvite } from '../../data/invites';
import { getInviteAccess } from '../../data/access';
import { listPendingPeople, type PendingPerson } from '../../data/pending-people';
import { getTabSnapshot, setTabSnapshot } from '../../lib/tab-snapshots';

/**
 * Friends search filters the roster you already have (name / handle).
 * It does not hit Discover or invent new people.
 */
const searchEnabled = true;

export default function FriendsScreen() {
  // #region agent log
  useEffect(() => debugScreenMount('friends'), []);
  // #endregion
  const router = useRouter();
  // THIS SECTION DOES: section title dots after the Friends nav-bar badge clears.
  const { sectionDots } = useTabAttention('friends');
  const friendsDot = TAB_COLOR.friends;

  // THIS SECTION DOES: load the roster, jokes wall, and this week's Friend Pod.
  const { sections, total, refresh, onMoveTier } = useFriends();
  const { jokes, onAdd: onAddJoke } = useInsideJokes('all');
  const contacts = useConnectContacts();
  const [pending, setPending] = useState<PendingPerson[]>(
    () => getTabSnapshot<PendingPerson[]>('pendingPeople') ?? []
  );

  // THIS SECTION DOES: local UI state for sheets, edit mode, and search.
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [jokeOpen, setJokeOpen] = useState(false);
  const [moving, setMoving] = useState<FriendRowPerson | null>(null);
  const [canInvite, setCanInvite] = useState(true);
  /** Freeze page scroll while a native drag is in progress. */
  const [rosterDragging, setRosterDragging] = useState(false);

  // THIS SECTION DOES: open the weekly podcast. Play starts audio; open waits.
  // Recording + suggesting a question now live on that page, not on this tab.
  const openPlayer = useCallback((autoplay: boolean) => {
    router.push({
      pathname: '/recap',
      params: { autoplay: autoplay ? '1' : '0' }
    });
  }, [router]);

  // THIS SECTION DOES: header + is add-friend only (QR / link / scan).
  const openAddFriend = useCallback(() => {
    if (!canInvite) {
      Alert.alert(
        'Invites paused',
        'During the TestFlight demo you cannot send invite links. Ask a friend who is already on Bridger to add you.'
      );
      return;
    }
    setAddOpen(true);
  }, [canInvite]);

  // THIS SECTION DOES: one labeled Add friend control, reused in the header
  // and beside Your circle (same look; different analytics id by placement).
  const addFriendButton = useCallback(
    (analyticsId: string) => (
      <ButtonSecondary
        size="sm"
        className="h-10"
        tone="solid"
        onPress={openAddFriend}
        accessibilityLabel="Add friend"
        analyticsId={analyticsId}
      >
        Add friend
      </ButtonSecondary>
    ),
    [openAddFriend]
  );

  // THIS SECTION DOES: keep header Add friend as a stable node so the title
  // row does not remount on every Friends re-render (that let taps hit Recap).
  const headerTrailing = useMemo(
    () => addFriendButton(FRIENDS.top_nav.add),
    [addFriendButton]
  );

  // THIS SECTION DOES: Edit lives on Your circle, next to that row's Add friend.
  const circleActions = useMemo(
    () => (
      <View className="flex-row items-center gap-2">
        <ButtonSecondary
          size="sm"
          className="h-10"
          tone={editing ? 'solid' : 'light'}
          onPress={() => setEditing((v) => !v)}
          accessibilityLabel={editing ? 'Done editing friends' : 'Edit friends'}
          analyticsId={FRIENDS.roster.edit}
        >
          {editing ? 'Done' : 'Edit'}
        </ButtonSecondary>
        {addFriendButton(FRIENDS.roster.add)}
      </View>
    ),
    [editing, addFriendButton]
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

  // THIS SECTION DOES: reload cards you made when this tab is on screen again.
  const refreshPending = useCallback(() => {
    void listPendingPeople().then((rows) => {
      setPending(rows);
      setTabSnapshot('pendingPeople', rows);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Roster + pending: after add/reveal the tab stays mounted, so we must
      // refresh on focus or Friends looks empty until a force-close remount.
      void refresh(editing);
      refreshPending();
    }, [refresh, refreshPending, editing])
  );

  const empty = total === 0 && pending.length === 0;

  // THIS SECTION DOES: filter the roster by name or handle (never logs the query).
  const filteredSections = sections.map((s) => {
    const q = query.trim().toLowerCase();
    if (!searchEnabled || !q) return s;
    return {
      ...s,
      people: s.people.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)
      )
    };
  });

  const q = query.trim().toLowerCase();
  const filteredPending =
    searchEnabled && q
      ? pending.filter((p) => (p.displayName ?? '').toLowerCase().includes(q))
      : pending;

  // THIS SECTION DOES: pick a contact, save their number, open the card you made.
  const handleContactPicked = async (
    contact: Parameters<typeof contacts.pickContact>[0]
  ) => {
    const card = await contacts.pickContact(contact);
    if (!card) return;
    refreshPending();
    router.push({ pathname: '/pending/[id]', params: { id: card.id } });
  };

  const startConnectFromAdd = () => {
    setAddOpen(false);
    contacts.startConnect();
  };

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
      {/* THIS SECTION DOES: page title + labeled Add friend. Edit sits on Your circle. */}
      <ScreenHeader
        title="Friends"
        analyticsSurface="friends"
        trailing={headerTrailing}
      />

      {/* THIS SECTION DOES: the scrolling page body (frozen while dragging). */}
      <ScreenBody scrollEnabled={!rosterDragging}>
        {/* THIS SECTION DOES: Friend Pod always — record even with zero friends
            (your clip just has nobody to hear it yet). */}
        <View>
          <SectionTitle
            title="Friend Pod"
            description={
              empty
                ? 'Record your week now. Once friends join, they can hear it here.'
                : "A short recap of your friends' week, bundled so you can catch up fast."
            }
            infoAnalyticsId={FRIENDS.pod.info}
            parentScreen="friends"
            section="pod"
            className="mb-2"
            showDot={!!sectionDots.pod}
            dotColor={friendsDot}
          />
          <FriendPodWidget
            size="full"
            onPlay={() => openPlayer(true)}
            onOpen={() => openPlayer(false)}
          />
        </View>

        {/* THIS SECTION DOES: Inside jokes always — empty wall shows a + post-it. */}
        <View className="mt-7">
          <SectionTitle
            title="Inside jokes"
            description={
              empty
                ? 'Save the first joke now. Tag friends once they are here.'
                : 'Little notes and quotes you save with friends so the good moments stick around.'
            }
            infoAnalyticsId={FRIENDS.inside_jokes.info}
            parentScreen="friends"
            section="inside_jokes"
            className="mb-2"
            showDot={!!sectionDots.inside_jokes}
            dotColor={friendsDot}
            action={
              // Header + still opens the sheet when the wall already has notes.
              jokes.length > 0 ? (
                <Pressable
                  onPress={withAnalyticsPress(FRIENDS.inside_jokes.add, () => setJokeOpen(true))}
                  accessibilityRole="button"
                  accessibilityLabel="Add an Inside Joke"
                  className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple active:opacity-90"
                >
                  <PlusIcon size={18} color="#FFFFFF" strokeWidth={3} />
                </Pressable>
              ) : null
            }
          />
          <InsideJokesWidget
            size="full"
            jokes={jokes}
            onAdd={() => setJokeOpen(true)}
            analyticsIds={{
              note: FRIENDS.inside_jokes.note,
              add: FRIENDS.inside_jokes.add,
              noteBody: FRIENDS.inside_jokes.note_body
            }}
          />
        </View>

        {/* THIS SECTION DOES: a short tip while Edit mode is on. */}
        {editing && !empty ? (
          <Text className="mb-1 mt-7 font-sans-sb text-[12px] text-ink-mute">
            Drag a friend into another group. Tap to pick instead.
          </Text>
        ) : null}

        {/* THIS SECTION DOES: friends roster, or the invite empty card under the pods. */}
        <View className="mt-7">
          {/* Roster block title is "Your circle" so it is not the same word as
              the page header ("Friends") or the middle tier ("Friends").
              Edit and Add friend sit here, right above Close friends. */}
          <SectionTitle
            title="Your circle"
            description={
              empty
                ? 'Your people live here once they join.'
                : 'Close friends, Friends, and Acquaintances — who sees what.'
            }
            infoAnalyticsId={FRIENDS.roster.info}
            parentScreen="friends"
            section="roster"
            className="mb-1"
            showDot={!!sectionDots.roster}
            dotColor={friendsDot}
            action={circleActions}
          />
          {/* Search sits right under Your circle so it filters this roster,
              not Friend Pod or Inside Jokes above. */}
          {searchEnabled ? (
            <View className="mb-1">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search friends"
                analyticsId={FRIENDS.roster.search}
              />
            </View>
          ) : null}
          {empty ? (
            <ColdStart
              friendsEmpty
              onAdd={() => openAddFriend()}
              onConnectContacts={contacts.startConnect}
              inviteLocked={!canInvite}
            />
          ) : (
            <View>
              {filteredPending.length > 0 ? (
                <View className="mb-6">
                  <SectionTitle
                    title="Not on Bridger yet"
                    description="Cards you made from a contact. When they join with that number, their real profile takes over and your notes stay."
                    infoAnalyticsId={FRIENDS.roster.pending_header}
                    parentScreen="friends"
                    section="roster"
                    analyticsProps={{ pending: true }}
                    count={filteredPending.length}
                    className="mb-2"
                  />
                  <View className="gap-2.5">
                    {filteredPending.map((p) => (
                      <PendingFriendRow
                        key={p.id}
                        person={p}
                        onPress={() =>
                          router.push({
                            pathname: '/pending/[id]',
                            params: { id: p.id }
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              {total > 0 ? (
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
              ) : null}
            </View>
          )}
        </View>
      </ScreenBody>

      {/* THIS SECTION DOES: sheets that open from the page (add, scan, recap, jokes, move). */}
      <AddFriendSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConnectContacts={startConnectFromAdd}
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

      <ContactInviteSheet
        open={contacts.sheetOpen}
        contacts={contacts.contacts}
        onPick={(c) => void handleContactPicked(c)}
        onClose={() => contacts.setSheetOpen(false)}
        title="Pick someone to add"
        surface="friends_contacts_sheet"
        parentScreen="friends"
        pickAnalyticsId={FRIENDS.add_sheet.contact_row}
        cancelAnalyticsId={FRIENDS.add_sheet.contacts_cancel}
      />

      <ScanFriendSheet open={scanOpen} onClose={() => setScanOpen(false)} />

      <AddInsideJokeSheet
        open={jokeOpen}
        onClose={() => setJokeOpen(false)}
        onAdd={onAddJoke}
        parentScreen="friends"
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
