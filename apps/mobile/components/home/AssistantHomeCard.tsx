// ============================================
// WHAT THIS FILE DOES (plain English):
// A little Assistant chat box on Home, under Stories, only when you've turned
// it on in Settings. Same card size as an Announcement. You type here; the
// full-screen Assistant stays available from Settings for longer chats.
// ============================================
// TODO: replace with Magic Patterns component AssistantHomeCard when designed.
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { HOME, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  ORGANIC,
  SectionTitle,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  assistantTurn,
  cancelAssistantAct,
  closeAssistantSession,
  confirmAssistantAct,
  openAssistantSession,
  type AssistantProposal
} from '../../data/assistant';
import { addAssistantCalendarEntry } from '../../lib/assistant-calendar';

type Bubble = { id: string; role: 'user' | 'assistant'; text: string };

/** Match Announcements card height so Home stays even. */
const CHAT_BOX_HEIGHT = 124;

export function AssistantHomeCard() {
  const router = useRouter();
  const c = useThemeColors();
  const transcriptRef = useRef<ScrollView>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);

  const sessionRef = useRef<string | null>(null);

  // THIS SECTION DOES: open a short session while this Home card is on screen.
  useEffect(() => {
    trackProduct('assistant_opened', { entry: 'home' });
    let active = true;
    void (async () => {
      try {
        const id = await openAssistantSession();
        if (!active) {
          void closeAssistantSession(id);
          return;
        }
        sessionRef.current = id;
        setSessionId(id);
      } catch {
        // Card stays visible; send will show a soft error bubble.
      }
    })();
    return () => {
      active = false;
      const id = sessionRef.current;
      if (id) void closeAssistantSession(id);
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollToEnd({ animated: true });
  }, [bubbles, proposals]);

  async function send() {
    if (!draft.trim() || busy) return;
    const text = draft.trim();
    setDraft('');
    setBusy(true);
    try {
      let id = sessionRef.current ?? sessionId;
      if (!id) {
        id = await openAssistantSession();
        sessionRef.current = id;
        setSessionId(id);
      }
      const res = await assistantTurn(id, text);
      setBubbles((b) => [
        ...b,
        { id: `u-${Date.now()}`, role: 'user', text },
        { id: `a-${Date.now() + 1}`, role: 'assistant', text: res.reply }
      ]);
      setProposals(res.proposedActs ?? []);
    } catch {
      setBubbles((b) => [
        ...b,
        { id: `u-${Date.now()}`, role: 'user', text },
        {
          id: `a-${Date.now() + 1}`,
          role: 'assistant',
          text: "I couldn't answer just now. Try again in a moment."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(p: AssistantProposal) {
    try {
      const res = await confirmAssistantAct(p.id);
      setProposals((list) => list.filter((x) => x.id !== p.id));
      const handoff = res.handoff;
      if (handoff?.type === 'draft_message' && handoff.personId && handoff.draft) {
        router.push(
          `/messages/${encodeURIComponent(handoff.personId)}?draft=${encodeURIComponent(handoff.draft)}`
        );
        return;
      }
      if (handoff?.type === 'draft_event') {
        const prefill = encodeURIComponent(JSON.stringify(handoff.prefill ?? {}));
        router.push(`/event/create?prefill=${prefill}`);
        return;
      }
      if (handoff?.type === 'add_calendar_entry') {
        const result = await addAssistantCalendarEntry({
          title: handoff.title,
          date: handoff.date,
          notes: handoff.notes
        });
        Alert.alert(
          result === 'added' ? 'Added to calendar' : 'Calendar handoff',
          result === 'added'
            ? 'Saved on your device calendar.'
            : 'Opened a calendar link so you can add it yourself.'
        );
        return;
      }
      Alert.alert('Saved', p.preview);
    } catch {
      Alert.alert('Could not complete', 'Please try again.');
    }
  }

  async function onCancel(p: AssistantProposal) {
    await cancelAssistantAct(p.id);
    setProposals((list) => list.filter((x) => x.id !== p.id));
  }

  return (
    <View className="mt-5">
      <SectionTitle
        title="Assistant"
        description="A small chat from what you've saved. Confirms before it acts."
        infoAnalyticsId={HOME.assistant.info}
        parentScreen="home"
        section="assistant"
        className="mb-2"
      />

      {/* Same footprint as an Announcements card: short transcript + composer. */}
      <View
        style={[ORGANIC.soft, { height: CHAT_BOX_HEIGHT }]}
        className="overflow-hidden border border-ink-line bg-canvas"
      >
        <ScrollView
          ref={transcriptRef}
          className="flex-1 px-3 pt-2"
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 4, gap: 6, flexGrow: 1 }}
        >
          {bubbles.length === 0 && proposals.length === 0 ? (
            <AnalyticsRegion
              analyticsId={HOME.assistant.empty_state}
              interactive={false}
            >
              <Text className="font-sans text-[12px] leading-snug text-ink-mute">
                Ask about a friend you have notes for…
              </Text>
            </AnalyticsRegion>
          ) : null}

          <AnalyticsRegion
            analyticsId={HOME.assistant.transcript}
            interactive={false}
            className="gap-1.5"
          >
            {bubbles.slice(-3).map((b) => (
              <View
                key={b.id}
                className={cn(
                  'max-w-[92%] rounded-xl px-2.5 py-1.5',
                  b.role === 'user'
                    ? 'self-end bg-ink'
                    : 'self-start border border-ink-line bg-canvas'
                )}
              >
                <Text
                  className={cn(
                    'font-sans text-[12px] leading-snug',
                    b.role === 'user' ? 'text-canvas' : 'text-ink'
                  )}
                  numberOfLines={2}
                >
                  {b.text}
                </Text>
              </View>
            ))}
          </AnalyticsRegion>

          {proposals[0] ? (
            <View className="gap-1.5 rounded-xl border border-ink-line p-2">
              <Text className="font-sans-sb text-[11px] text-ink" numberOfLines={2}>
                {proposals[0].preview}
              </Text>
              <View className="flex-row gap-1.5">
                <ButtonPrimary
                  size="sm"
                  analyticsId={HOME.assistant.confirm}
                  onPress={() => void onConfirm(proposals[0]!)}
                >
                  Confirm
                </ButtonPrimary>
                <ButtonSecondary
                  size="sm"
                  analyticsId={HOME.assistant.cancel}
                  onPress={() => void onCancel(proposals[0]!)}
                >
                  Cancel
                </ButtonSecondary>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-center gap-1.5 border-t border-ink-line px-2 py-1.5">
          <AnalyticsRegion
            analyticsId={HOME.assistant.composer}
            interactive={false}
            className="min-h-[36px] flex-1"
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask…"
              placeholderTextColor={c.inkMute}
              accessibilityLabel="Assistant message"
              editable={!busy}
              returnKeyType="send"
              onSubmitEditing={() => void send()}
              className="min-h-[36px] rounded-xl border border-ink-line px-2.5 py-1.5 font-sans text-[13px] text-ink"
            />
          </AnalyticsRegion>
          <Pressable
            onPress={withAnalyticsPress(HOME.assistant.send, () => void send())}
            disabled={busy || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            className="min-h-[36px] min-w-[52px] items-center justify-center rounded-full bg-ink px-2.5"
          >
            <Text className="font-sans-sb text-[12px] text-canvas">
              {busy ? '…' : 'Send'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
