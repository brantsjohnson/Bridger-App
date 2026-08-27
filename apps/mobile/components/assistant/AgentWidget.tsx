// ============================================
// WHAT THIS FILE DOES (plain English):
// Billy on Home: ask by text or mic, see the answer, approve a draft, or open
// the full room. Only mounts when Assistant is opted in (parent gates it).
// Looks like Coming up on purpose: dashed title, bright color capsule, bold
// white line, soft white chips. Tap the Billy header on the blue card to open
// the full room (suggestions / mic stay their own buttons so web stays valid).
// ============================================
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
import { ArrowUpIcon, MicIcon } from 'lucide-react-native';
import {
  BILLY_NAME,
  HOME,
  deriveAssistantUiStatus,
  trackProduct,
  type AssistantProposal
} from '@bridger/shared';
import {
  AnalyticsRegion,
  SectionTitle,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { LinearGradient } from 'expo-linear-gradient';
import {
  assistantTurn,
  cancelAssistantAct,
  closeAssistantSession,
  confirmAssistantAct,
  openAssistantSession
} from '../../data/assistant';
import { addAssistantCalendarEntry } from '../../lib/assistant-calendar';
import { useBridgeLive } from '../../providers/bridge-live-provider';
import {
  useBillyVoice,
  type BillyVoiceResult
} from '../../providers/billy-voice-provider';
import { AGENT_SUGGESTIONS, type AgentDraft } from './agent';
import { BillyMark, type MarkMood } from './BillyMark';
import { DraftPreview, type DraftOutcome } from './DraftPreview';
import {
  EventPreviewCard,
  type EventPreviewPrefill
} from './EventPreviewCard';
import {
  BILLY_BLUE,
  BILLY_MIC_GRADIENT,
  BILLY_MIC_GRADIENT_LOCATIONS
} from './billy-theme';
import { ListeningRow } from './ListeningRow';

export function AgentWidget() {
  const router = useRouter();
  const c = useThemeColors();
  const {
    setEnabled,
    setLive,
    sessionId: liveSessionId,
    setSessionId: setLiveSession
  } = useBridgeLive();
  const voice = useBillyVoice();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const unreadRef = useRef(false);
  const lastLineRef = useRef('');
  const proposalsRef = useRef<AssistantProposal[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastLine, setLastLine] = useState('');
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);
  const [draftCard, setDraftCard] = useState<AgentDraft | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<DraftOutcome>('idle');
  /** Fixed event-template card when Billy proposes draft_event. */
  const [eventPrefill, setEventPrefill] = useState<EventPreviewPrefill | null>(
    null
  );
  const [eventProposalId, setEventProposalId] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);

  const voiceLiveRef = useRef(false);
  busyRef.current = busy;
  unreadRef.current = unread;
  lastLineRef.current = lastLine;
  proposalsRef.current = proposals;
  voiceLiveRef.current = voice.listening || voice.sending;

  const listening = voice.listening;
  const hearing = voice.hearing;
  const status = deriveAssistantUiStatus({
    busy: busy || voice.sending,
    listening,
    hasProposals: proposals.length > 0 || Boolean(draftCard),
    hasUnreadResult: unread && !busy && !listening && !voice.sending
  });

  // THIS SECTION DOES: open a short session while this Home widget is on screen.
  // Reuse the live session if you came back mid-listen (same mic, same Nest id).
  useEffect(() => {
    trackProduct('assistant_opened', { entry: 'home' });
    setEnabled(true);
    let active = true;
    void (async () => {
      try {
        if (liveSessionId) {
          sessionRef.current = liveSessionId;
          setSessionId(liveSessionId);
          return;
        }
        const id = await openAssistantSession();
        if (!active) {
          void closeAssistantSession(id);
          return;
        }
        sessionRef.current = id;
        setSessionId(id);
        setLiveSession(id);
      } catch {
        // Widget stays; send shows a soft error.
      }
    })();
    return () => {
      active = false;
      const id = sessionRef.current;
      const micLive = voiceLiveRef.current;
      // Keep the Nest session when the shared mic is still open (Island needs it).
      const keep =
        busyRef.current ||
        unreadRef.current ||
        proposalsRef.current.length > 0 ||
        micLive;
      // THIS SECTION DOES: leave work alive for the Island when you walk away.
      if (id && !keep) {
        void closeAssistantSession(id);
        setLiveSession(null);
        setLive({ status: 'idle', line: '' });
      } else if (keep && !micLive) {
        setLive({
          status: busyRef.current
            ? 'background'
            : proposalsRef.current.length
              ? 'needs-you'
              : 'result',
          line: lastLineRef.current || 'Billy'
        });
      }
      // Keep sessionRef while the shared mic is live so finishListening can send.
      if (!micLive) {
        sessionRef.current = null;
      }
    };
    // liveSessionId only read on mount to resume — do not re-open every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setEnabled, setLive, setLiveSession]);

  // THIS SECTION DOES: keep the Island in sync when you leave Home mid-work.
  // Listening / sending lines are owned by BillyVoiceProvider (shared mic).
  useEffect(() => {
    if (voice.listening || voice.sending) return;
    const line =
      status === 'thinking'
        ? 'Working…'
        : status === 'needs-you'
          ? lastLine || 'Needs your confirm'
          : status === 'result'
            ? lastLine || 'Billy has an answer'
            : '';
    if (status === 'idle' && !line) return;
    setLive({ status, line });
  }, [status, lastLine, setLive, voice.listening, voice.sending]);

  async function ensureSession(): Promise<string> {
    let id = sessionRef.current ?? sessionId;
    if (!id) {
      id = await openAssistantSession();
      sessionRef.current = id;
      setSessionId(id);
      setLiveSession(id);
    }
    return id;
  }

  function applyReply(reply: string, acts: AssistantProposal[]) {
    setLastLine(reply);
    setUnread(true);
    setProposals(acts);
    setDraftOutcome('idle');
    const msgAct = acts.find(
      (a) =>
        a.tool === 'draft_message' ||
        a.tool === 'reply_message' ||
        a.tool === 'schedule_message'
    );
    if (msgAct) {
      const to =
        typeof msgAct.args.personName === 'string'
          ? msgAct.args.personName
          : typeof msgAct.args.to === 'string'
            ? msgAct.args.to
            : 'friend';
      const body = String(
        msgAct.args.draft ?? msgAct.args.text ?? msgAct.preview
      );
      setDraftCard({
        id: msgAct.id,
        kind: msgAct.tool === 'schedule_message' ? 'Scheduled message' : 'Message',
        to,
        body,
        proposalId: msgAct.id
      });
      setEventPrefill(null);
      setEventProposalId(null);
      return;
    }
    setDraftCard(null);
    const eventAct = acts.find((a) => a.tool === 'draft_event');
    if (eventAct) {
      const raw = (eventAct.args.prefill ?? eventAct.args) as EventPreviewPrefill;
      setEventPrefill(raw);
      setEventProposalId(eventAct.id);
    } else {
      setEventPrefill(null);
      setEventProposalId(null);
    }
  }

  // THIS SECTION DOES: hook Home into the shared mic so Island/Screen stay in sync
  useEffect(() => {
    const onVoiceResult = (res: BillyVoiceResult) => {
      applyReply(res.reply, res.proposedActs ?? []);
      setBusy(false);
    };
    voice.bindHandlers({
      ensureSession: () => ensureSession(),
      onVoiceResult,
      onVoiceError: (kind) => {
        setBusy(false);
        if (kind === 'permission') {
          Alert.alert(
            'Microphone',
            'Billy needs mic access to hear you. You can still type.'
          );
        } else {
          Alert.alert('Voice', 'Could not send that recording. Try typing.');
        }
      }
    });
    // Pick up a reply that finished while you were on another tab.
    const pending = voice.takePendingResult();
    if (pending) applyReply(pending.reply, pending.proposedActs ?? []);
    return () => voice.bindHandlers(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bind once per mount
  }, []);

  async function ask(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setDraft('');
    setBusy(true);
    setUnread(false);
    try {
      const id = await ensureSession();
      const res = await assistantTurn(id, t);
      applyReply(res.reply, res.proposedActs ?? []);
    } catch {
      setLastLine("I couldn't answer just now. Try again in a moment.");
      setUnread(true);
    } finally {
      setBusy(false);
    }
  }

  async function startListen() {
    if (busy || voice.sending) return;
    setUnread(false);
    await voice.startListening();
  }

  async function onConfirmProposal(
    p: AssistantProposal,
    argsPatch?: Record<string, unknown>
  ) {
    try {
      const res = await confirmAssistantAct(p.id, argsPatch);
      setProposals((list) => list.filter((x) => x.id !== p.id));
      const handoff = res.handoff;
      if (handoff?.type === 'draft_message' || handoff?.type === 'reply_message') {
        if (handoff.personId && handoff.draft) {
          setDraftOutcome('handoff');
          router.push(
            `/messages/${encodeURIComponent(handoff.personId)}?draft=${encodeURIComponent(handoff.draft)}`
          );
          return;
        }
      }
      if (handoff?.type === 'schedule_message' && handoff.queued) {
        setDraftOutcome('saved');
        setDraftCard(null);
        Alert.alert(
          'Scheduled',
          handoff.sendAt
            ? `Queued for ${handoff.sendAt}. Cancel from Billy activity until it sends.`
            : 'Queued. Cancel from Billy activity until it sends.'
        );
        return;
      }
      if (handoff?.type === 'draft_event') {
        setEventPrefill(null);
        setEventProposalId(null);
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
        setDraftOutcome(result === 'added' ? 'saved' : 'handoff');
        Alert.alert(
          result === 'added' ? 'Added to calendar' : 'Calendar handoff',
          result === 'added'
            ? 'Saved on your device calendar.'
            : 'Opened a calendar link so you can add it yourself.'
        );
        return;
      }
      if (handoff?.type === 'send_touch_grass' && handoff.sent) {
        setDraftOutcome('saved');
        Alert.alert('Touch Grass', 'Your signal is live for your circle.');
        return;
      }
      setDraftOutcome('saved');
      setEventPrefill(null);
      setEventProposalId(null);
      Alert.alert('Saved', p.preview);
    } catch {
      Alert.alert('Could not complete', 'Please try again.');
    }
  }

  async function onApproveDraft(body: string) {
    const p =
      proposals.find((x) => x.id === draftCard?.proposalId) ?? proposals[0];
    if (!p) {
      Alert.alert('Draft', 'Nothing to confirm yet.');
      return;
    }
    // Pass edited body to Nest so confirm uses what you see on the card.
    await onConfirmProposal(p, { draft: body, text: body });
  }

  async function onApproveEvent() {
    const p =
      proposals.find((x) => x.id === eventProposalId) ??
      proposals.find((x) => x.tool === 'draft_event');
    if (!p) {
      Alert.alert('Event', 'Nothing to confirm yet.');
      return;
    }
    await onConfirmProposal(p);
  }

  const working =
    status === 'thinking' || status === 'background' || voice.sending;
  const mood: MarkMood = listening
    ? 'listening'
    : working
      ? 'thinking'
      : status === 'result' || status === 'needs-you'
        ? 'excited'
        : 'resting';

  // THIS SECTION DOES: open the full Billy room from Home
  const openBilly = () => {
    setUnread(false);
    router.push({ pathname: '/assistant', params: { entry: 'home' } });
  };

  return (
    <View className="mt-6">
      {/*
        Same title language as Coming up: pixel heading + dashed underline +
        short "what is this?" tip. That is the personality outside the card.
      */}
      <View className="mb-2">
        <SectionTitle
          title={BILLY_NAME}
          description="Ask about your people, your week, and your plans. Tap the blue card to open the full room, or ask right here."
          infoAnalyticsId={HOME.assistant.info}
          parentScreen="home"
          section="assistant"
        />
      </View>

      {/*
        Blue card is a View (not a button). Only the header opens Billy.
        Suggestions / composer / mic stay their own buttons — nesting
        Pressable+button inside Pressable+button breaks HTML on web.
        Visual language matches Coming up: saturated fill, bold light type,
        soft chips, big rounded capsule.
      */}
      <View
        className="overflow-hidden rounded-card"
        style={{ backgroundColor: BILLY_BLUE }}
      >
        {/* THIS SECTION DOES: tap the face + line to open the full Billy room. */}
        <Pressable
          onPress={withAnalyticsPress(HOME.assistant.open, openBilly)}
          accessibilityRole="button"
          accessibilityLabel="Open Billy"
          className="flex-row items-center gap-3 px-4 pt-3.5 active:opacity-95"
        >
          <BillyMark mood={mood} size="md" surface="home" tile />
          {/* Plain View (not AnalyticsRegion Pressable) so web does not nest buttons. */}
          <View className="min-h-[44px] min-w-0 flex-1 justify-center">
            {/* White bold line on color, same punch as Coming up row labels */}
            <Text className="font-sans-b text-[15px] leading-snug text-white">
              {listening
                ? voice.liveTranscript.trim() || 'Listening. Say what you need.'
                : working || voice.sending
                  ? 'Working on that…'
                  : unread
                    ? lastLine
                    : 'Ask about your people, your week, your plans.'}
            </Text>
          </View>
        </Pressable>

        {working ? (
          <View className="mx-4 mt-2.5 h-1 overflow-hidden rounded-full bg-white/25">
            <View className="h-full w-2/3 rounded-full bg-white" />
          </View>
        ) : null}

        {draftCard ? (
          <View className="px-4 pt-3">
            <DraftPreview
              draft={draftCard}
              surface="home"
              outcome={draftOutcome}
              onApprove={(body) => void onApproveDraft(body)}
              onVoiceEdit={() => void startListen()}
              listening={listening}
            />
          </View>
        ) : null}

        {eventPrefill && eventProposalId ? (
          <View className="px-4 pt-3">
            <EventPreviewCard
              prefill={eventPrefill}
              surface="home"
              onApprove={() => void onApproveEvent()}
            />
          </View>
        ) : null}

        {proposals[0] && !draftCard && !eventPrefill ? (
          <View className="mx-4 mt-3 gap-1.5 rounded-2xl bg-white p-2.5">
            <Text className="font-sans-sb text-[12px] text-ink" numberOfLines={3}>
              {proposals[0].preview}
            </Text>
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={withAnalyticsPress(HOME.assistant.confirm, () =>
                  void onConfirmProposal(proposals[0]!)
                )}
                accessibilityRole="button"
                accessibilityLabel="Confirm"
                className="min-h-[36px] rounded-full bg-ink px-3 py-1.5"
              >
                <Text className="font-sans-b text-[12px] text-white">Confirm</Text>
              </Pressable>
              <Pressable
                onPress={withAnalyticsPress(HOME.assistant.cancel, () => {
                  void cancelAssistantAct(proposals[0]!.id);
                  setProposals((list) => list.filter((x) => x.id !== proposals[0]!.id));
                })}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                className="min-h-[36px] rounded-full border border-ink-line px-3 py-1.5"
              >
                <Text className="font-sans-b text-[12px] text-ink">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {status === 'idle' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 pt-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {AGENT_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={withAnalyticsPress(HOME.assistant.suggestion, () =>
                  void ask(s)
                )}
                accessibilityRole="button"
                accessibilityLabel={s}
                className="shrink-0 rounded-full bg-white px-3 py-1.5"
              >
                <Text className="font-sans-b text-[12px] text-ink">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {listening || voice.sending ? (
          <View className="p-4">
            <ListeningRow
              hearing={hearing}
              transcript={voice.liveTranscript}
              onCancel={() => void voice.cancelListening()}
              onFinish={() => void voice.finishListening()}
              stopAnalyticsId={HOME.assistant.stop_listen}
              finishAnalyticsId={HOME.assistant.mic}
            />
          </View>
        ) : (
          <View className="flex-row items-center gap-2 p-4">
            <AnalyticsRegion
              analyticsId={HOME.assistant.composer}
              interactive={false}
              className="min-h-[40px] min-w-0 flex-1"
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`Message ${BILLY_NAME}`}
                placeholderTextColor={c.inkMute}
                accessibilityLabel={`Message ${BILLY_NAME}`}
                editable={!busy}
                returnKeyType="send"
                onSubmitEditing={() => void ask(draft)}
                className="h-10 rounded-full bg-white px-3.5 font-sans-b text-[13px] text-ink"
              />
            </AnalyticsRegion>
            {draft.trim() ? (
              <Pressable
                onPress={withAnalyticsPress(HOME.assistant.send, () =>
                  void ask(draft)
                )}
                accessibilityRole="button"
                accessibilityLabel="Send"
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
              >
                <ArrowUpIcon size={16} color="#1C1B16" strokeWidth={3} />
              </Pressable>
            ) : (
              <Pressable
                onPress={withAnalyticsPress(HOME.assistant.mic, () =>
                  void startListen()
                )}
                accessibilityRole="button"
                accessibilityLabel="Talk to Billy"
              >
                {/* Mic: fun purple / dark blue / charcoal fill, white icon */}
                <LinearGradient
                  colors={[...BILLY_MIC_GRADIENT]}
                  locations={[...BILLY_MIC_GRADIENT_LOCATIONS]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MicIcon size={16} color="#FFFFFF" strokeWidth={2.6} />
                </LinearGradient>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
