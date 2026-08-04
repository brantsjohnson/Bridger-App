// ============================================
// WHAT THIS FILE DOES (plain English):
// The Messages tab — Bridger's capped inbox (5 texts per person per day).
// Deliberately small: find a friend, open a thread, set up your contact card.
// Conversation rows use organic accent tiles (Magic Patterns blobs). Data
// comes from useMessages so demo fixtures and the live API share this screen.
// SECURITY: message bodies are end-to-end encrypted at rest — staff cannot read them.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRightIcon, IdCardIcon, SquarePenIcon } from 'lucide-react-native';
import {
  DAILY_CAP,
  MESSAGES,
  openSurface,
  TIER_LABEL,
  type Tier
} from '@bridger/shared';
import {
  AnalyticsRegion,
  Avatar,
  EmptyState,
  MESSAGE_SHAPES,
  Screen,
  ScreenBody,
  ScreenHeader,
  SearchField,
  TIER_GRADIENT,
  cn,
  ringToneForTier,
  useThemeColors,
  withAnalyticsPress,
  type MessageCardState
} from '@bridger/ui';
import type { ThreadRow } from '../../data/messages';
import { NewMessageSheet } from '../../components/messages/NewMessageSheet';
import { startThreadWith } from '../../data/messages';
import { getProfilePhoto } from '../../data/fixtures/demo-media';
import { useMessages } from '../../hooks/useMessages';

// --- STATUS SHAPE: turn a thread into one of three card outlines ---
// maxed = you've used all 5 today · needsReply = they spoke last (your turn) ·
// replied = you spoke last (waiting on them).
function cardState(t: ThreadRow): MessageCardState {
  if (t.myLeft <= 0) return 'maxed';
  return t.lastFrom === 'them' ? 'needsReply' : 'replied';
}

// --- GROUPING: Close first, then Friends, then Acquaintances ---
// Private ('none') threads are not shown as their own group here.
const TIER_GROUPS: Tier[] = ['close', 'friend', 'acquaintance'];

export default function MessagesScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const { threads, query, setQuery, empty } = useMessages();
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    openSurface('messages');
  }, []);

  const openThread = async (personId: string) => {
    const id = await startThreadWith(personId);
    router.push(`/messages/${id}`);
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Messages"
        analyticsSurface="messages"
        trailing={
          <Pressable
            onPress={withAnalyticsPress(MESSAGES.top_nav.new_message, () =>
              setComposing(true)
            )}
            accessibilityRole="button"
            accessibilityLabel="New message"
            className="h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-white active:bg-[#F1ECFF]"
          >
            <SquarePenIcon size={18} color={c.ink} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <ScreenBody>
        <Pressable
          onPress={withAnalyticsPress(MESSAGES.conversation.contact_card_row, () =>
            router.push('/messages/contact-card')
          )}
          accessibilityRole="button"
          accessibilityLabel="Your contact card"
          className="mb-3 min-h-[44px] w-full flex-row items-center gap-3 rounded-2xl border border-ink-line bg-surface px-4 py-3 active:bg-[#F1ECFF]"
        >
          <IdCardIcon size={20} color="#6B2FEA" strokeWidth={2.4} />
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-sans-b text-[14px] text-ink"
          >
            Your contact card
          </Text>
          <ChevronRightIcon size={16} color={c.inkMute} strokeWidth={2.6} />
        </Pressable>

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find a friend"
          analyticsId={MESSAGES.top_nav.search}
        />

        <View className="mt-5 gap-6">
          {threads.length === 0 ? (
            <EmptyState
              emoji="✉️"
              line={
                empty
                  ? 'No conversations yet. Tap the pen to start one with a friend.'
                  : 'No one by that name.'
              }
            />
          ) : (
            // One block per tier — Close, then Friends, then Acquaintances.
            TIER_GROUPS.map((tier) => {
              const group = threads.filter((t) => t.tier === tier);
              if (group.length === 0) return null;
              return (
                <View key={tier} className="gap-2.5">
                  {/* Section label — non-interactive, so a tap logs a dead_click. */}
                  <AnalyticsRegion
                    analyticsId={MESSAGES.conversation.section_header}
                    interactive={false}
                    analyticsProps={{ tier }}
                    accessibilityRole="header"
                    accessibilityLabel={TIER_LABEL[tier]}
                    className="px-1"
                  >
                    <Text className="font-sans-b text-[12px] uppercase tracking-[1.5px] text-ink-mute">
                      {TIER_LABEL[tier]}
                    </Text>
                  </AnalyticsRegion>

                  {group.map((t) => {
                    // COLOR = how close they are (same colors as the story
                    // rings). SHAPE = whose turn it is. And when you've already
                    // replied and are just waiting on them, the same color goes
                    // pale so the inbox shows you what actually needs you.
                    const state = cardState(t);
                    const waiting = state === 'replied';
                    const shape = MESSAGE_SHAPES[state];
                    const colors =
                      TIER_GRADIENT[ringToneForTier(tier)][waiting ? 'soft' : 'strong'];
                    const textClass = waiting ? 'text-ink' : 'text-white';
                    return (
                      <Pressable
                        key={t.id}
                        onPress={withAnalyticsPress(MESSAGES.conversation.row, () =>
                          router.push(`/messages/${t.id}`)
                        )}
                        accessibilityRole="button"
                        accessibilityLabel={`${t.name}. ${t.preview}`}
                        style={shape}
                        className="min-h-[44px] w-full flex-row items-center gap-3 overflow-hidden px-4 py-3.5 active:opacity-90"
                      >
                        {/* The colored fill sits behind the row content. */}
                        <LinearGradient
                          colors={colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        {/* White ring keeps every face readable on the color. */}
                        <View className="rounded-full bg-white/90 p-[2px]">
                          <Avatar
                            name={t.name}
                            emoji={t.emoji}
                            accent={t.accent}
                            photo={getProfilePhoto(t.personId)}
                          />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            numberOfLines={1}
                            className={cn('font-sans-b text-[15px]', textClass)}
                          >
                            {t.name}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className={cn('font-sans-sb text-[13px] opacity-80', textClass)}
                          >
                            {t.preview}
                          </Text>
                        </View>
                        <View className="shrink-0 items-end gap-1.5">
                          <Text
                            className={cn('font-sans-b text-[11px] opacity-70', textClass)}
                          >
                            {t.time}
                          </Text>
                          {t.unread ? (
                            <View
                              accessible
                              accessibilityLabel="Unread"
                              className={cn(
                                'h-2.5 w-2.5 rounded-full',
                                waiting ? 'bg-ink' : 'bg-white'
                              )}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <AnalyticsRegion
          analyticsId={MESSAGES.conversation.cap_note}
          interactive={false}
          className="mt-7 rounded-2xl bg-[#DFF3E4] px-5 py-5"
          accessibilityLabel={`${DAILY_CAP} messages a day per friend. Bridger is not another inbox.`}
        >
          <Text className="text-center font-pixel text-[16px] text-success">
            {DAILY_CAP} messages a day per friend
          </Text>
          <Text className="mt-1.5 text-center font-sans-sb text-[13px] text-ink-soft">
            Bridger isn't another inbox. Swap numbers and go live your life.
          </Text>
        </AnalyticsRegion>
      </ScreenBody>

      <NewMessageSheet
        open={composing}
        onClose={() => setComposing(false)}
        onPick={(personId) => {
          setComposing(false);
          void openThread(personId);
        }}
      />
    </Screen>
  );
}
