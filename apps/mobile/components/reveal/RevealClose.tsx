// ============================================
// WHAT THIS FILE DOES (plain English):
// Reveal Screen 3 — the close. Fireworks bloom behind the words, then
// "You two should click.", then either up to 3 friend-of-friend suggestions
// (who + why + Add) OR a gentle nudge to turn on Discover matching. The
// "See their profile" button lives in the fixed bottom bar of the reveal
// screen. Copy is exact from REVEAL.md.
// ============================================
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { REVEAL, trackDeadClick } from '@bridger/shared';
import { Avatar, withAnalyticsPress } from '@bridger/ui';
import type { BridgeSuggestion } from '../../data/discover';
import { personById } from '../../data/people';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import { FireworksBackdrop } from '../FireworksBackdrop';

/** Fixed cream on the dark reveal — theme tokens flip in dark mode. */
const ON_DARK = '#F5F0E6';
const ON_DARK_MUTE = 'rgba(245, 240, 230, 0.55)';
const CARD_BG = 'rgba(245, 240, 230, 0.08)';
const CARD_LINE = 'rgba(245, 240, 230, 0.16)';

export function RevealClose({
  suggestions,
  discoverable,
  theirName: _theirName,
  onAdd,
  onEnableDiscover
}: {
  suggestions: BridgeSuggestion[];
  discoverable: boolean;
  theirName: string;
  onAdd: (personId: string, viaFriendId: string) => void;
  onEnableDiscover: () => void;
}) {
  /** Local "Requested" state so Add flips immediately after a successful tap. */
  const [requested, setRequested] = useState<Set<string>>(() => new Set());
  // Size of this close block so fireworks can bloom behind the whole area.
  const [area, setArea] = useState({ width: 0, height: 0 });

  const showSuggestions = discoverable && suggestions.length > 0;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== area.width || height !== area.height) {
      setArea({ width, height });
    }
  };

  return (
    <View className="relative mt-8 items-center" onLayout={onLayout}>
      {/* THE PARTY: fireworks behind everything (same spark look as Home welcome). */}
      {area.width > 0 && area.height > 0 ? (
        <FireworksBackdrop
          width={area.width}
          height={area.height}
          playHaptics
          loop
          shellCount={6}
        />
      ) : null}

      {/* Foreground copy + suggestions sit above the sparks. */}
      <View className="z-10 w-full items-center gap-5">
        <Text
          className="text-center font-pixel text-[28px] leading-[32px]"
          style={{ color: ON_DARK }}
        >
          You two should click.
        </Text>

        <Text
          className="text-center font-sans-md text-[13px]"
          style={{ color: ON_DARK_MUTE }}
        >
          Revisit anytime under &quot;In common&quot;
        </Text>

        {/* THIS SECTION DOES: FoF cards when Discover is on, else an opt-in nudge. */}
        {showSuggestions ? (
          <View className="mt-2 w-full gap-3">
            <Text
              className="text-center font-sans-b text-[12px] uppercase tracking-wide"
              style={{ color: ON_DARK_MUTE }}
              onPress={() => trackDeadClick(REVEAL.suggestions.title)}
              accessibilityRole="text"
            >
              People you might click with
            </Text>
            {suggestions.slice(0, 3).map((s) => {
              const person = personById(s.personId);
              const via = s.viaFriendId ? personById(s.viaFriendId) : null;
              const first = person.name.split(' ')[0] ?? 'them';
              const viaFirst = via?.name.split(' ')[0];
              const already = requested.has(s.personId);
              return (
                <View
                  key={s.id}
                  className="w-full flex-row items-center gap-3 rounded-2xl px-3.5 py-3"
                  style={{
                    backgroundColor: CARD_BG,
                    borderWidth: 1,
                    borderColor: CARD_LINE
                  }}
                  onStartShouldSetResponder={() => {
                    trackDeadClick(REVEAL.suggestions.card);
                    return false;
                  }}
                >
                  <Avatar
                    name={person.name}
                    emoji={person.emoji}
                    accent={person.accent}
                    personId={person.id}
                    photo={avatarPhotoFor(person.id, person.avatarUrl)}
                    size="md"
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-sans-b text-[15px]"
                      style={{ color: ON_DARK }}
                    >
                      {person.name}
                    </Text>
                    {viaFirst ? (
                      <Text
                        numberOfLines={1}
                        className="font-sans-md text-[12px]"
                        style={{ color: ON_DARK_MUTE }}
                      >
                        via {viaFirst}
                      </Text>
                    ) : null}
                    <Text
                      numberOfLines={2}
                      className="mt-0.5 font-sans-sb text-[13px] leading-snug"
                      style={{ color: ON_DARK }}
                    >
                      {s.sharedThread}
                    </Text>
                  </View>
                  <Pressable
                    disabled={already}
                    onPress={withAnalyticsPress(REVEAL.suggestions.add, () => {
                      onAdd(s.personId, s.viaFriendId);
                      setRequested((prev) => new Set(prev).add(s.personId));
                    })}
                    accessibilityRole="button"
                    accessibilityLabel={
                      already ? `Requested ${first}` : `Add ${first}`
                    }
                    className="min-h-[44px] min-w-[72px] items-center justify-center rounded-full px-3"
                    style={{
                      backgroundColor: already
                        ? 'rgba(245, 240, 230, 0.12)'
                        : ON_DARK
                    }}
                  >
                    <Text
                      className="font-sans-b text-[13px]"
                      style={{ color: already ? ON_DARK_MUTE : '#0E0E0E' }}
                    >
                      {already ? 'Requested' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : !discoverable ? (
          <View
            className="mt-2 w-full items-center gap-3 rounded-2xl px-4 py-4"
            style={{
              backgroundColor: CARD_BG,
              borderWidth: 1,
              borderColor: CARD_LINE
            }}
          >
            <Text
              className="text-center font-sans-b text-[15px]"
              style={{ color: ON_DARK }}
            >
              Meet friends of friends
            </Text>
            <Text
              className="text-center font-sans-md text-[13px] leading-snug"
              style={{ color: ON_DARK_MUTE }}
            >
              Turn on Discover matching to see people you might click with across
              this new connection.
            </Text>
            <Pressable
              onPress={withAnalyticsPress(
                REVEAL.suggestions.optin_toggle,
                onEnableDiscover
              )}
              accessibilityRole="button"
              accessibilityLabel="Turn on Discover matching"
              className="mt-1 min-h-[44px] items-center justify-center rounded-full px-5"
              style={{ backgroundColor: ON_DARK }}
            >
              <Text className="font-sans-b text-[14px]" style={{ color: '#0E0E0E' }}>
                Turn on Discover
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
