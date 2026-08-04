// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friends tab — your confirmed circle, grouped by Close / Friends /
// Acquaintances. Edit moves people between circles (TierPicker replaces web
// drag-and-drop). The + opens Add friend (QR + link + scan). Friend Pod and
// Inside Jokes sit above the roster. Data comes from hooks so demo fixtures
// and the live API use the same screen.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import type { Tier } from '@bridger/shared';
import { TIER_LABEL } from '@bridger/shared';
import {
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  SectionCount,
  cn
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

/**
 * Feature flag — when false the search bar is not rendered at all.
 * Flip to true once live people search is ready (searchFriends is already stubbed).
 */
const searchEnabled = false;

export default function FriendsScreen() {
  const { sections, total, refresh, onMoveTier } = useFriends();
  const { jokes, onAdd: onAddJoke } = useInsideJokes('all');

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [jokeOpen, setJokeOpen] = useState(false);
  const [moving, setMoving] = useState<FriendRowPerson | null>(null);

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
    // Profile route ships with the Profile tab; stub for now.
    Alert.alert(person.name, 'Their profile opens here next.');
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
        messagesDormant
        trailing={
          <View className="flex-row items-center gap-2">
            <ButtonSecondary
              size="sm"
              tone={editing ? 'solid' : 'outline'}
              onPress={() => setEditing((v) => !v)}
              accessibilityLabel={editing ? 'Done editing friends' : 'Edit friends'}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            <Pressable
              onPress={() => setAddOpen(true)}
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
            />
          </View>
        ) : null}

        {/* Friend Pod + Inside Jokes only when you have people */}
        {!empty ? (
          <>
            <View>
              <PixelHeading size="md" className="mb-2">
                Friend Pod
              </PixelHeading>
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
              <View className="mb-2 flex-row items-center justify-between gap-3">
                <PixelHeading size="md">Inside jokes</PixelHeading>
                <Pressable
                  onPress={() => setJokeOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add an Inside Joke"
                  className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple active:opacity-90"
                >
                  <Text className="font-sans-b text-[18px] leading-none text-white">+</Text>
                </Pressable>
              </View>
              <InsideJokesWidget size="full" jokes={jokes} />
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
                <View className="mb-2">
                  <SectionCount
                    label={TIER_LABEL[section.tier]}
                    count={section.people.length}
                  />
                </View>

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
                      onStory={() =>
                        Alert.alert(`${p.name}'s update`, 'Story viewer opens here next.')
                      }
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
