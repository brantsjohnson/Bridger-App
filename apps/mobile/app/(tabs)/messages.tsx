// ============================================
// WHAT THIS FILE DOES (plain English):
// The Messages tab — Bridger's capped inbox (5 texts per person per day).
// Deliberately small: find a friend, open a thread, expand your contact card
// dropdown to edit fields. Conversation rows are name + preview only (no
// profile pics). Color and shape of each blob still show whose turn it is.
// Data comes from useMessages so demo fixtures and the live API share this
// screen.
// SECURITY: message bodies are end-to-end encrypted at rest — staff cannot read them.
// ============================================
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronDownIcon, IdCardIcon, SquarePenIcon } from 'lucide-react-native';
import {
  DAILY_CAP,
  dismissSurface,
  MESSAGES,
  openSurface,
  trackClick,
  TIER_LABEL,
  type Tier
} from '@bridger/shared';
import {
  AnalyticsRegion,
  EmptyState,
  MESSAGE_SHAPES,
  Screen,
  ScreenBody,
  ScreenHeader,
  Reveal,
  SearchField,
  TIER_COLOR,
  cn,
  ringToneForTier,
  useThemeColors,
  withAnalyticsPress,
  type MessageCardState
} from '@bridger/ui';
import type { ThreadRow } from '../../data/messages';
import { skipTabEnterAnimation } from '../../lib/tab-snapshots';
import { ContactCardPanel } from '../../components/messages/ContactCardPanel';
import { NewMessageSheet } from '../../components/messages/NewMessageSheet';
import { startThreadWith } from '../../data/messages';
import { useMessages } from '../../hooks/useMessages';
import { takeMessagesReturnTo } from '../../lib/messages-return';

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
  // Dropdown for editing your card on this list (share lives on each thread).
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    openSurface('messages');
  }, []);

  const toggleContactCard = () => {
    trackClick(MESSAGES.conversation.contact_card_row, { method: 'dropdown' });
    if (cardOpen) {
      dismissSurface('contact_card');
      setCardOpen(false);
      return;
    }
    openSurface('contact_card', 'messages');
    setCardOpen(true);
  };

  const openThread = async (personId: string) => {
    const id = await startThreadWith(personId);
    router.push(`/messages/${id}`);
  };

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Messages"
        analyticsSurface="messages"
        // No profile circle here — this screen is already one hop from the
        // header photo, and conversation rows are name-only (no faces).
        hideProfile
        // Messages now opens from the header shortcut, so give it a way back.
        // Prefer the tab you left (stashed on open); never force Home.
        onBack={() => {
          const returnTo = takeMessagesReturnTo();
          if (returnTo) {
            router.replace(returnTo as Href);
            return;
          }
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/home');
        }}
        trailing={
          <Pressable
            onPress={withAnalyticsPress(MESSAGES.top_nav.new_message, () =>
              setComposing(true)
            )}
            accessibilityRole="button"
            accessibilityLabel="New message"
            className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80"
          >
            <SquarePenIcon size={18} color={c.canvas} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <ScreenBody>
        <View
          className={cn(
            'mb-3 overflow-hidden rounded-2xl border border-ink-line bg-surface',
            cardOpen && 'border-purple/30'
          )}
        >
          <Pressable
            onPress={toggleContactCard}
            accessibilityRole="button"
            accessibilityState={{ expanded: cardOpen }}
            accessibilityLabel="Your contact card"
            className="min-h-[44px] w-full flex-row items-center gap-3 px-4 py-3 active:bg-[#F1ECFF]"
          >
            <IdCardIcon size={20} color="#6B2FEA" strokeWidth={2.4} />
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 font-sans-b text-[14px] text-ink"
            >
              Your contact card
            </Text>
            <View style={{ transform: [{ rotate: cardOpen ? '180deg' : '0deg' }] }}>
              <ChevronDownIcon size={16} color={c.inkMute} strokeWidth={2.6} />
            </View>
          </Pressable>
          {cardOpen ? (
            <View className="px-3 pb-3">
              <ContactCardPanel />
            </View>
          ) : null}
        </View>

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

                  {group.map((t, i) => {
                    // COLOR = how close they are (green close, blue friends,
                    // orange acquaintances — the same colors as the story rings).
                    // DARK means it is your turn to reply. LIGHT means you already
                    // did and you're waiting on them. SHAPE says the same thing
                    // again in the outline, for anyone who can't rely on color.
                    const state = cardState(t);
                    const waiting = state === 'replied';
                    const shape = MESSAGE_SHAPES[state];
                    const tone = TIER_COLOR[ringToneForTier(tier)];
                    const fill = waiting ? tone.light : tone.deep;
                    const textColor = waiting ? tone.onLight : tone.onDeep;
                    return (
                      <Reveal key={t.id} index={i} instant={skipTabEnterAnimation('messages')}>
                        <Pressable
                          onPress={withAnalyticsPress(MESSAGES.conversation.row, () =>
                            router.push(`/messages/${t.id}`)
                          )}
                          accessibilityRole="button"
                          accessibilityLabel={`${t.name}. ${t.preview}. ${
                            waiting ? 'Waiting on them' : 'Your turn to reply'
                          }`}
                          style={{ ...shape, backgroundColor: fill }}
                          className="min-h-[44px] w-full flex-row items-center gap-3 overflow-hidden px-4 py-3.5 active:opacity-90"
                        >
                          {/* Name + preview only — no profile pic on this list. */}
                          <View className="min-w-0 flex-1">
                            <Text
                              numberOfLines={1}
                              style={{ color: textColor }}
                              className="font-sans-b text-[15px]"
                            >
                              {t.name}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={{ color: textColor }}
                              className="font-sans-sb text-[13px] opacity-80"
                            >
                              {t.preview}
                            </Text>
                          </View>
                          <View className="shrink-0 items-end gap-1.5">
                            <Text
                              style={{ color: textColor }}
                              className="font-sans-b text-[11px] opacity-70"
                            >
                              {t.time}
                            </Text>
                            {t.unread ? (
                              <View
                                accessible
                                accessibilityLabel="Unread"
                                style={{ backgroundColor: textColor }}
                                className="h-2.5 w-2.5 rounded-full"
                              />
                            ) : null}
                          </View>
                        </Pressable>
                      </Reveal>
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
          {/* Light mint card — keep both lines near-black so dark mode stays readable. */}
          <Text className="text-center font-pixel text-[16px] text-[#1C1B16]">
            {DAILY_CAP} messages a day per friend
          </Text>
          <Text className="mt-1.5 text-center font-sans-sb text-[13px] text-[#1C1B16]/75">
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
