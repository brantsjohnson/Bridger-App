// ============================================
// WHAT THIS FILE DOES (plain English):
// One conversation — capped at 5 messages a day each way. Bubbles, a live
// "left today" chip, Share contact (never counts against the cap), double-tap
// a friend's bubble to heart it (also not a sent message), and a composer
// that locks when you are out. If they burned their 5, we show a clear
// notice and nudge you to share your contact card instead.
// SECURITY: plaintext is only in memory after decrypt; never log bubble text.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeftIcon,
  ClockIcon,
  HeartIcon,
  PhoneIcon,
  SendIcon,
  UserRoundPlusIcon
} from 'lucide-react-native';
import {
  DAILY_CAP,
  MESSAGES,
  trackClick,
  trackDeadClick
} from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  Avatar,
  cn,
  useReduceMotion,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { useThread } from '../../hooks/useThread';
import type { ThreadBubble } from '../../data/messages';

type Props = {
  threadId: string;
  onBack?: () => void;
  /** Optional pre-sent message (e.g. touch-grass "I'm in") — auto-sends. */
  seedMessage?: string;
  /**
   * Prefill the composer only (Assistant draft_message). NEVER auto-sends.
   * The person must tap send themselves.
   */
  draftMessage?: string;
};

export function ThreadScreen({
  threadId,
  onBack,
  seedMessage,
  draftMessage
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { thread, loading, onSend, onShareContact, onToggleHeart, myLeft, theirLeft, atCap } =
    useThread(threadId);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [draftFilled, setDraftFilled] = useState(false);

  // Seed once if we arrived from touch-grass "I'm in"
  useEffect(() => {
    if (!seedMessage || seeded || !thread || loading) return;
    setSeeded(true);
    void onSend(seedMessage);
  }, [seedMessage, seeded, thread, loading, onSend]);

  // Assistant draft: put text in the box only — never send for them.
  useEffect(() => {
    if (!draftMessage || draftFilled || !thread || loading) return;
    setDraftFilled(true);
    setDraft(draftMessage);
  }, [draftMessage, draftFilled, thread, loading]);

  if (loading || !thread) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="font-sans-sb text-[14px] text-ink-mute">
          {loading ? 'Loading…' : 'Conversation not found'}
        </Text>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="mt-4 min-h-[44px] rounded-full border border-ink-line px-5 py-2"
        >
          <Text className="font-sans-b text-[14px] text-ink">Back</Text>
        </Pressable>
      </View>
    );
  }

  // Messages are all blue now (the inbox uses card SHAPE, not color, for
  // status), so your sent bubbles stay a single, calm blue.
  const token = ACCENTS.blue;
  const first = thread.name.split(' ')[0] ?? thread.name;
  const theyMaxed = theirLeft <= 0;
  // Keep every message short — 150 characters, so this stays a nudge, not a
  // place to write essays.
  const MESSAGE_MAX = 150;

  const send = async () => {
    if (!draft.trim() || atCap || sending) return;
    setSending(true);
    try {
      await onSend(draft);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  // Share contact posts the card into the thread (uncounted). Setup lives on
  // the Messages list "Your contact card" row — don't yank them out mid-chat.
  const share = async () => {
    await onShareContact();
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <View
        style={{ paddingTop: Math.max(insets.top, 8) }}
        className="flex-row items-center gap-3 border-b border-ink-line bg-surface px-4 py-3"
      >
        <Pressable
          onPress={withAnalyticsPress(MESSAGES.conversation.back, onBack)}
          accessibilityRole="button"
          accessibilityLabel="Back"
          // Solid ink fill + canvas chevron — same as ScreenHeader so dark mode
          // never washes a near-black arrow into the dark header bar.
          className="h-11 w-11 items-center justify-center rounded-full bg-ink active:opacity-80"
        >
          <ChevronLeftIcon size={22} color={c.canvas} strokeWidth={3} />
        </Pressable>
        <Avatar
          name={thread.name}
          emoji={thread.emoji}
          accent={thread.accent}
          personId={thread.personId}
          size="sm"
        />
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 font-sans-b text-[16px] tracking-tight text-ink"
        >
          {thread.name}
        </Text>
        <View
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1',
            myLeft > 0 ? 'bg-[#DFF3E4]' : 'bg-[#FFE1D2]'
          )}
        >
          <Text
            className={cn(
              'font-sans-b text-[11px]',
              myLeft > 0 ? 'text-success' : 'text-coral'
            )}
          >
            {myLeft} left today
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {thread.bubbles.map((b) => (
          <MessageBubble
            key={b.id}
            bubble={b}
            token={token}
            onToggleHeart={(method) => void onToggleHeart(b.id, method)}
          />
        ))}

        {theyMaxed ? (
          <AnalyticsRegion
            analyticsId={MESSAGES.conversation.maxed_notice}
            interactive={false}
            className="rounded-2xl bg-amber px-4 py-3.5"
            accessibilityLabel={`${first} used their ${DAILY_CAP} for today. They cannot reply until tomorrow.`}
          >
            <ClockIcon size={16} color="#1C1B16" strokeWidth={2.6} style={{ alignSelf: 'center' }} />
            <Text className="mt-1.5 text-center font-sans-sb text-[13px] leading-snug text-[#1C1B16]/80">
              <Text className="font-sans-b text-[#1C1B16]">
                {first}'s used their {DAILY_CAP} for today
              </Text>{' '}
              They can't reply until tomorrow.
            </Text>
          </AnalyticsRegion>
        ) : null}
      </ScrollView>

      <View className="gap-2.5 px-4 pt-2">
        {theyMaxed ? (
          <>
            <Pressable
              onPress={withAnalyticsPress(MESSAGES.conversation.share_contact, () =>
                void share()
              )}
              accessibilityRole="button"
              accessibilityLabel="Share your contact instead"
              className="min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-2xl bg-[#DFF3E4] px-4 py-4"
            >
              <UserRoundPlusIcon size={20} color="#2FA85B" strokeWidth={2.5} />
              <Text className="font-sans-b text-[16px] text-success">
                Share your contact instead
              </Text>
            </Pressable>
            <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
              so you two can actually connect
            </Text>
          </>
        ) : (
          <>
            <Pressable
              onPress={withAnalyticsPress(MESSAGES.conversation.share_contact, () =>
                void share()
              )}
              accessibilityRole="button"
              accessibilityLabel="Share contact card"
              className="min-h-[44px] w-full flex-row items-center justify-center gap-2 rounded-full bg-[#DFF3E4] px-3 py-2.5"
            >
              <UserRoundPlusIcon size={16} color="#2FA85B" strokeWidth={2.6} />
              <Text className="font-sans-b text-[13px] text-success">Share contact</Text>
            </Pressable>

            {atCap ? (
              <View className="rounded-2xl border border-coral/30 bg-[#FFE1D2] px-4 py-3">
                <Text className="text-center font-sans-b text-[13px] text-coral">
                  Out of messages today — share your contact card
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2 rounded-full border border-ink-line bg-white py-1.5 pl-4 pr-1.5">
                <TextInput
                  value={draft}
                  onChangeText={(text) => setDraft(text.slice(0, MESSAGE_MAX))}
                  onSubmitEditing={() => void send()}
                  returnKeyType="send"
                  maxLength={MESSAGE_MAX}
                  placeholder="Message…"
                  accessibilityLabel="Message"
                  placeholderTextColor="#9A9688"
                  className="min-w-0 flex-1 font-sans-sb text-[15px] text-[#1C1B16]"
                />
                <Pressable
                  onPress={withAnalyticsPress(MESSAGES.composer.send, () => void send())}
                  disabled={sending || !draft.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  accessibilityState={{ disabled: sending || !draft.trim() }}
                  className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success disabled:opacity-40"
                >
                  <SendIcon size={18} color="#FFFFFF" strokeWidth={2.6} />
                </Pressable>
              </View>
            )}

            <Text className="text-center font-sans-sb text-[12px] text-ink-mute">
              {myLeft} of {DAILY_CAP} left today
              {draft.length > 0
                ? ` · ${draft.length}/${MESSAGE_MAX}`
                : ' · share your contact card to keep going'}
            </Text>
          </>
        )}
      </View>

    </View>
  );
}

/** One chat bubble. Double-tap a friend's bubble to heart it (not a send). */
function MessageBubble({
  bubble,
  token,
  onToggleHeart
}: {
  bubble: ThreadBubble;
  token: { bg: string; text: string };
  onToggleHeart: (method: 'double_tap' | 'a11y') => void;
}) {
  const reduceMotion = useReduceMotion();
  const lastTap = useRef(0);
  const pop = useRef(new Animated.Value(0)).current;
  const showHeart = bubble.from === 'them' ? bubble.heartedByMe : bubble.heartedByThem;
  const canHeart = bubble.from === 'them';

  function popHeart() {
    if (reduceMotion) return;
    pop.setValue(0);
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true
      }),
      Animated.timing(pop, {
        toValue: 0,
        duration: 280,
        delay: 220,
        useNativeDriver: true
      })
    ]).start();
  }

  function heart(method: 'double_tap' | 'a11y') {
    if (!canHeart) return;
    trackClick(MESSAGES.conversation.heart, { method });
    if (!bubble.heartedByMe) popHeart();
    onToggleHeart(method);
  }

  function handlePress() {
    if (!canHeart) {
      trackDeadClick(MESSAGES.conversation.bubble);
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      heart('double_tap');
    } else {
      lastTap.current = now;
      trackDeadClick(MESSAGES.conversation.bubble);
    }
  }

  return (
    <View className={cn('flex-row', bubble.from === 'me' ? 'justify-end' : 'justify-start')}>
      <Pressable
        onPress={handlePress}
        accessibilityRole={canHeart ? 'button' : undefined}
        accessibilityLabel={
          canHeart
            ? `${bubble.text}. ${bubble.heartedByMe ? 'Hearted. ' : ''}Double tap to heart`
            : undefined
        }
        accessibilityHint={
          canHeart ? 'Hearts do not use one of your daily messages' : undefined
        }
        accessibilityActions={
          canHeart
            ? [{ name: 'activate', label: bubble.heartedByMe ? 'Unheart' : 'Heart' }]
            : undefined
        }
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'activate') heart('a11y');
        }}
        className={cn(
          'max-w-[76%] px-4 py-2.5',
          bubble.from === 'me'
            ? cn('rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px] rounded-br-[6px]', token.bg)
            : 'rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[6px] rounded-br-[20px] border border-ink-line bg-white'
        )}
      >
        {bubble.kind === 'storyReply' ? (
          <Text
            className={cn(
              'mb-1 font-sans-b text-[10px] uppercase tracking-wide',
              bubble.from === 'me' ? 'opacity-70' : 'text-ink-mute'
            )}
          >
            On your story
          </Text>
        ) : null}
        <Text
          className={cn(
            'font-sans-sb text-[15px] leading-snug',
            // Their bubbles stay white — text must stay near-black in dark mode.
            bubble.from === 'me' ? token.text : 'text-[#1C1B16]'
          )}
        >
          {bubble.text}
        </Text>
        {bubble.phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${bubble.phone}`)}
            accessibilityRole="link"
            accessibilityLabel={`Call ${bubble.phone}`}
            className="mt-1 flex-row items-center gap-1"
          >
            <Text className="font-sans-b text-[14px] text-success underline">
              {bubble.phone}
            </Text>
            <PhoneIcon size={14} color="#2FA85B" strokeWidth={2.6} />
          </Pressable>
        ) : null}
        {showHeart ? (
          <View
            className={cn(
              'mt-1.5 self-end',
              bubble.from === 'me' ? 'self-start' : 'self-end'
            )}
          >
            <HeartIcon size={14} color="#E11D48" fill="#E11D48" strokeWidth={2.2} />
          </View>
        ) : null}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: '30%',
            opacity: pop,
            transform: [
              {
                scale: pop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1.15]
                })
              }
            ]
          }}
        >
          <HeartIcon size={36} color="#E11D48" fill="#E11D48" strokeWidth={2} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
