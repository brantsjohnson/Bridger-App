// ============================================
// WHAT THIS FILE DOES (plain English):
// Full Billy room: text + voice chat from your saved notes, drafts you must
// approve before anything leaves. User-facing name is Billy. Gated by Settings
// opt-in (opening without it fails and sends you back). Shares one mic with
// Home and the Island so listening + live transcript continue across screens.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  CheckIcon,
  EyeIcon,
  MicIcon
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ASSISTANT,
  BILLY_NAME,
  deriveAssistantUiStatus,
  trackProduct,
  type AssistantProposal
} from '@bridger/shared';
import {
  AnalyticsRegion,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  assistantTurn,
  cancelAssistantAct,
  closeAssistantSession,
  confirmAssistantAct,
  fetchAssistantSettings,
  openAssistantSession
} from '../../data/assistant';
import { ApiHttpError } from '../../lib/api';
import { addAssistantCalendarEntry } from '../../lib/assistant-calendar';
import { useBridgeLive } from '../../providers/bridge-live-provider';
import {
  useBillyVoice,
  type BillyVoiceResult
} from '../../providers/billy-voice-provider';
import {
  AGENT_SUGGESTIONS,
  type AgentDraft,
  type AgentMessage
} from '../../components/assistant/agent';
import { BillyMark } from '../../components/assistant/BillyMark';
import {
  DraftPreview,
  type DraftOutcome
} from '../../components/assistant/DraftPreview';
import {
  EventPreviewCard,
  type EventPreviewPrefill
} from '../../components/assistant/EventPreviewCard';
import {
  BILLY_BLUE,
  BILLY_MIC_GRADIENT,
  BILLY_MIC_GRADIENT_LOCATIONS
} from '../../components/assistant/billy-theme';
import { ListeningRow } from '../../components/assistant/ListeningRow';

const LOW_RISK_TOOLS = new Set([
  'save_note',
  'set_reminder',
  'suggest_reconnect_nudge'
]);

const WELCOME: AgentMessage = {
  id: 'welcome',
  role: 'billy',
  text: "I'm on. I can only see what you can see: your circles, your notes, your events. Ask me anything, or start with one of these.",
  at: 'now'
};

export default function AgentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entry?: string }>();
  const entry =
    params.entry === 'home' || params.entry === 'voice' || params.entry === 'island'
      ? params.entry
      : 'settings';
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const {
    setEnabled,
    setLive,
    sessionId: liveSessionId,
    setSessionId: setLiveSession
  } = useBridgeLive();
  const voice = useBillyVoice();
  const endRef = useRef<ScrollView>(null);
  const sessionRef = useRef<string | null>(null);
  const proposalsRef = useRef<AssistantProposal[]>([]);
  const voiceLiveRef = useRef(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);
  const [draftByMsg, setDraftByMsg] = useState<
    Record<string, { draft: AgentDraft; outcome: DraftOutcome }>
  >({});
  const [eventCard, setEventCard] = useState<{
    proposalId: string;
    prefill: EventPreviewPrefill;
  } | null>(null);

  proposalsRef.current = proposals;
  sessionRef.current = sessionId;
  voiceLiveRef.current = voice.listening || voice.sending;

  const listening = voice.listening;
  const hearing = voice.hearing;
  const status = deriveAssistantUiStatus({
    busy: busy || voice.sending,
    listening,
    hasProposals: proposals.length > 0
  });

  useEffect(() => {
    trackProduct('assistant_opened', { entry });
    let active = true;
    void (async () => {
      try {
        const settings = await fetchAssistantSettings();
        if (!settings.assistantEnabled) {
          Alert.alert('Billy', 'Turn Billy on in Settings first.');
          router.back();
          return;
        }
        setEnabled(true);
        // Reuse the Home/Island session so voice continues in the same chat.
        if (liveSessionId) {
          if (active) {
            setSessionId(liveSessionId);
            sessionRef.current = liveSessionId;
          }
          return;
        }
        const id = await openAssistantSession();
        if (active) {
          setSessionId(id);
          sessionRef.current = id;
          setLiveSession(id);
        }
      } catch {
        Alert.alert('Billy unavailable', 'Turn it on in Settings, or try again later.');
        router.back();
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resume liveSessionId once
  }, [router, entry, setEnabled, setLiveSession]);

  useEffect(() => {
    return () => {
      const id = sessionRef.current;
      if (!id) return;
      // Keep Nest session alive if the shared mic is still running.
      if (voiceLiveRef.current) return;
      void closeAssistantSession(id);
      setLiveSession(null);
    };
  }, [setLiveSession]);

  // Listening / sending status is owned by BillyVoiceProvider.
  useEffect(() => {
    if (voice.listening || voice.sending) return;
    setLive({
      status,
      line:
        status === 'thinking'
          ? 'Working…'
          : status === 'needs-you'
            ? 'Needs your confirm'
            : ''
    });
  }, [status, setLive, voice.listening, voice.sending]);

  useEffect(() => {
    endRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, busy, proposals.length, voice.liveTranscript]);

  function attachDraftFromActs(msgId: string, acts: AssistantProposal[]) {
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
      const body = String(msgAct.args.draft ?? msgAct.args.text ?? msgAct.preview);
      setDraftByMsg((m) => ({
        ...m,
        [msgId]: {
          draft: {
            id: msgAct.id,
            kind:
              msgAct.tool === 'schedule_message'
                ? 'Scheduled message'
                : 'Message',
            to,
            body,
            proposalId: msgAct.id
          },
          outcome: 'idle'
        }
      }));
      setEventCard(null);
      return;
    }
    // Event drafts use a dedicated one-template preview card.
    const eventAct = acts.find((a) => a.tool === 'draft_event');
    if (!eventAct) {
      setEventCard(null);
      return;
    }
    void msgId;
    setEventCard({
      proposalId: eventAct.id,
      prefill: (eventAct.args.prefill ?? eventAct.args) as EventPreviewPrefill
    });
  }

  async function ask(text: string) {
    if (!text.trim() || busy || voice.sending) return;
    const t = text.trim();
    setDraft('');
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'you', text: t, at: 'now' }
    ]);
    try {
      const id = await ensureSession();
      const res = await assistantTurn(id, t);
      const aId = `a-${Date.now()}`;
      setMessages((m) => [
        ...m,
        { id: aId, role: 'billy', text: res.reply, at: 'now' }
      ]);
      setProposals(res.proposedActs ?? []);
      attachDraftFromActs(aId, res.proposedActs ?? []);
    } catch (err) {
      let reply = "I couldn't answer just now. Try again in a moment.";
      if (err instanceof ApiHttpError) {
        if (err.code === 'billy_allowance_exhausted') {
          trackProduct('billy_allowance_exhausted', {
            plan: String(err.body?.plan ?? 'taste')
          });
          reply =
            "You've used this month's Billy time. It refreshes on your next period, or upgrade to Billy+ in Settings.";
        } else if (err.code === 'billy_vendor_outage') {
          trackProduct('billy_vendor_outage_seen', {});
          reply = 'Billy is temporarily unavailable. Try again later.';
        }
      }
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'billy',
          text: reply,
          at: 'now'
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

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

  async function applyVoiceResult(res: BillyVoiceResult) {
    const transcript = (res.transcript ?? '').trim();
    const pendingLowRisk = proposalsRef.current.filter((p) =>
      LOW_RISK_TOOLS.has(p.tool)
    );
    const yes = /^(yes|yep|yeah|confirm|ok|okay)\.?$/i.test(transcript);

    if (yes && pendingLowRisk.length === 1) {
      setMessages((m) => [
        ...m,
        {
          id: `u-${Date.now()}`,
          role: 'you',
          text: transcript || 'yes',
          at: 'now'
        }
      ]);
      setBusy(false);
      await onConfirm(pendingLowRisk[0]!);
      return;
    }

    const shown = transcript || '(voice)';
    const aId = `a-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'you', text: shown, at: 'now' },
      { id: aId, role: 'billy', text: res.reply, at: 'now' }
    ]);
    setProposals(res.proposedActs ?? []);
    attachDraftFromActs(aId, res.proposedActs ?? []);
    setBusy(false);
  }

  // THIS SECTION DOES: same shared mic as Home / Island (live transcript too)
  useEffect(() => {
    voice.bindHandlers({
      ensureSession: () => ensureSession(),
      onVoiceResult: (res) => {
        void applyVoiceResult(res);
      },
      onVoiceError: (kind) => {
        setBusy(false);
        if (kind === 'permission') {
          Alert.alert(
            'Microphone',
            'Billy needs mic access to hear you. You can still type.'
          );
        } else {
          Alert.alert('Voice', 'Could not send that recording. Try typing instead.');
        }
      }
    });
    const pending = voice.takePendingResult();
    if (pending) void applyVoiceResult(pending);
    return () => voice.bindHandlers(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bind once per mount
  }, []);

  async function startListen() {
    if (busy || voice.sending) return;
    await voice.startListening();
  }

  async function onConfirm(
    p: AssistantProposal,
    argsPatch?: Record<string, unknown>
  ) {
    try {
      const res = await confirmAssistantAct(p.id, argsPatch);
      setProposals((list) => list.filter((x) => x.id !== p.id));
      const handoff = res.handoff;

      const markOutcome = (outcome: DraftOutcome) => {
        setDraftByMsg((m) => {
          const next = { ...m };
          for (const k of Object.keys(next)) {
            if (next[k]?.draft.proposalId === p.id) {
              next[k] = { ...next[k]!, outcome };
            }
          }
          return next;
        });
      };

      if (
        (handoff?.type === 'draft_message' || handoff?.type === 'reply_message') &&
        handoff.personId &&
        handoff.draft
      ) {
        markOutcome('handoff');
        router.push(
          `/messages/${encodeURIComponent(handoff.personId)}?draft=${encodeURIComponent(handoff.draft)}`
        );
        return;
      }
      if (handoff?.type === 'schedule_message' && handoff.queued) {
        markOutcome('saved');
        Alert.alert(
          'Scheduled',
          handoff.sendAt
            ? `Queued for ${handoff.sendAt}. Cancel from Billy activity until it sends.`
            : 'Queued. Cancel from Billy activity until it sends.'
        );
        return;
      }
      if (handoff?.type === 'draft_event') {
        setEventCard(null);
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
        markOutcome(result === 'added' ? 'saved' : 'handoff');
        Alert.alert(
          result === 'added' ? 'Added to calendar' : 'Calendar handoff',
          result === 'added'
            ? 'Saved on your device calendar.'
            : 'Opened a calendar link so you can add it yourself.'
        );
        return;
      }
      if (handoff?.type === 'send_touch_grass' && handoff.sent) {
        Alert.alert('Touch Grass', 'Your signal is live for your circle.');
        return;
      }
      Alert.alert('Saved', p.preview);
    } catch {
      Alert.alert('Could not complete', 'Please try again.');
    }
  }

  async function onApproveDraft(proposalId: string, body: string) {
    const p = proposals.find((x) => x.id === proposalId);
    if (!p) {
      Alert.alert('Draft', 'Nothing to confirm yet.');
      return;
    }
    await onConfirm(p, { draft: body, text: body });
  }

  async function onApproveEvent() {
    if (!eventCard) return;
    const p = proposals.find((x) => x.id === eventCard.proposalId);
    if (!p) {
      Alert.alert('Event', 'Nothing to confirm yet.');
      return;
    }
    await onConfirm(p);
  }

  function onClose() {
    if (busy) {
      setLive({ status: 'background', line: 'Still working…' });
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center gap-3 border-b border-ink-line px-4 pb-3 pt-3">
        <Pressable
          onPress={withAnalyticsPress(ASSISTANT.chat.close, onClose)}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-white"
        >
          <ArrowLeftIcon size={16} color={c.ink} strokeWidth={2.6} />
        </Pressable>
        <BillyMark
          mood={listening ? 'listening' : busy ? 'thinking' : 'resting'}
          size="sm"
          surface="assistant"
        />
        <AnalyticsRegion
          analyticsId={ASSISTANT.chat.header}
          interactive={false}
          className="min-w-0 flex-1"
        >
          <Text className="font-sans-b text-[15px] leading-tight text-ink">
            {BILLY_NAME}
          </Text>
          <Text className="font-sans-sb text-[12px] text-ink-mute" numberOfLines={1}>
            {listening
              ? voice.liveTranscript.trim() || 'Listening. Say what you need.'
              : busy || voice.sending
                ? 'Working. You can leave; it keeps going.'
                : 'Only sees what you can see'}
          </Text>
        </AnalyticsRegion>
      </View>

      <ScrollView
        ref={endRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, gap: 16 }}
      >
        <AnalyticsRegion
          analyticsId={ASSISTANT.chat.transcript}
          interactive={false}
          className="gap-4"
        >
          {messages.map((m) => (
            <Bubble
              key={m.id}
              message={m}
              draftState={draftByMsg[m.id]}
              onApproveDraft={(body) => {
                const pid = draftByMsg[m.id]?.draft.proposalId;
                if (pid) void onApproveDraft(pid, body);
              }}
              onVoiceEdit={() => void startListen()}
              listening={listening}
            />
          ))}
        </AnalyticsRegion>

        {busy || voice.sending ? (
          <AnalyticsRegion analyticsId={ASSISTANT.chat.working} interactive={false}>
            <View className="flex-row gap-2.5">
              <BillyMark mood="thinking" size="sm" />
              <View className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-ink-line bg-white p-3">
                <Text className="font-sans-sb text-[13px] text-ink">
                  Working on that…
                </Text>
              </View>
            </View>
          </AnalyticsRegion>
        ) : null}

        {eventCard ? (
          <EventPreviewCard
            prefill={eventCard.prefill}
            surface="assistant"
            onApprove={() => void onApproveEvent()}
          />
        ) : null}

        {proposals.map((p) => {
          const isDraftTool =
            p.tool === 'draft_message' ||
            p.tool === 'reply_message' ||
            p.tool === 'schedule_message' ||
            p.tool === 'draft_event';
          if (isDraftTool) return null;
          return (
            <View
              key={p.id}
              className="gap-2 rounded-2xl border border-ink-line p-3"
            >
              <AnalyticsRegion
                analyticsId={ASSISTANT.proposal.preview}
                interactive={false}
              >
                <Text className="font-sans-sb text-[13px] text-ink">{p.preview}</Text>
              </AnalyticsRegion>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={withAnalyticsPress(ASSISTANT.proposal.confirm, () =>
                    void onConfirm(p)
                  )}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-ink px-3"
                >
                  <Text className="font-sans-b text-[13px] text-white">Confirm</Text>
                </Pressable>
                <Pressable
                  onPress={withAnalyticsPress(ASSISTANT.proposal.cancel, () => {
                    void cancelAssistantAct(p.id);
                    setProposals((list) => list.filter((x) => x.id !== p.id));
                  })}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-full border border-ink-line px-3"
                >
                  <Text className="font-sans-b text-[13px] text-ink">Cancel</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        className={cn(
          'border-t px-4 pt-3',
          listening || voice.sending
            ? 'border-transparent'
            : 'border-ink-line bg-canvas'
        )}
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          ...(listening || voice.sending
            ? { backgroundColor: BILLY_BLUE }
            : null)
        }}
      >
        {!busy && !listening && !voice.sending && messages.length <= 2 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2.5"
            contentContainerStyle={{ gap: 8 }}
          >
            {AGENT_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={withAnalyticsPress(ASSISTANT.chat.suggestion, () =>
                  void ask(s)
                )}
                className="shrink-0 rounded-full border border-ink-line bg-canvas px-3 py-1.5"
              >
                <Text className="font-sans-b text-[12px] text-ink-soft">{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {listening || voice.sending ? (
          <ListeningRow
            hearing={hearing}
            transcript={voice.liveTranscript}
            onCancel={() => void voice.cancelListening()}
            onFinish={() => void voice.finishListening()}
            stopAnalyticsId={ASSISTANT.chat.voice}
            finishAnalyticsId={ASSISTANT.chat.voice}
          />
        ) : (
          <View className="flex-row items-center gap-2">
            <AnalyticsRegion
              analyticsId={ASSISTANT.chat.composer}
              interactive={false}
              className="min-h-[44px] min-w-0 flex-1"
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={busy ? 'Working on the last one…' : `Ask ${BILLY_NAME}`}
                placeholderTextColor={c.inkMute}
                accessibilityLabel={`Ask ${BILLY_NAME}`}
                editable={!busy}
                className="h-11 rounded-full border border-blue/25 bg-white px-4 font-sans-sb text-[14px] text-ink"
              />
            </AnalyticsRegion>
            {draft.trim() ? (
              <Pressable
                onPress={withAnalyticsPress(ASSISTANT.chat.send, () => void ask(draft))}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Send"
                className="h-11 w-11 items-center justify-center rounded-full bg-ink"
              >
                <ArrowUpIcon size={16} color="#FFFFFF" strokeWidth={3} />
              </Pressable>
            ) : (
              <Pressable
                onPress={withAnalyticsPress(ASSISTANT.chat.voice, () =>
                  void startListen()
                )}
                accessibilityRole="button"
                accessibilityLabel="Talk to Billy"
              >
                <LinearGradient
                  colors={[...BILLY_MIC_GRADIENT]}
                  locations={[...BILLY_MIC_GRADIENT_LOCATIONS]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
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
    </KeyboardAvoidingView>
  );
}

function Bubble({
  message,
  draftState,
  onApproveDraft,
  onVoiceEdit,
  listening
}: {
  message: AgentMessage;
  draftState?: { draft: AgentDraft; outcome: DraftOutcome };
  onApproveDraft: (body: string) => void;
  onVoiceEdit: () => void;
  listening: boolean;
}) {
  const mine = message.role === 'you';
  const c = useThemeColors();

  if (mine) {
    return (
      <View className="items-end">
        <Text className="max-w-[78%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 font-sans-sb text-[14px] leading-snug text-white">
          {message.text}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2.5">
      <BillyMark mood="speaking" size="sm" />
      <View className="min-w-0 flex-1 gap-2">
        <View className="rounded-2xl rounded-tl-md border border-ink-line bg-white p-3.5">
          <Text className="font-sans-sb text-[14px] leading-snug text-ink">
            {message.text}
          </Text>
          {message.sources?.length ? (
            <View className="mt-2.5 flex-row items-start gap-1.5 border-t border-ink-line pt-2.5">
              <EyeIcon size={14} color={c.inkMute} strokeWidth={2.6} />
              <Text className="flex-1 font-sans-sb text-[12px] leading-snug text-ink-mute">
                Looked at {message.sources.join(', ')}.
              </Text>
            </View>
          ) : null}
        </View>
        {draftState ? (
          <DraftPreview
            draft={draftState.draft}
            outcome={draftState.outcome}
            onApprove={onApproveDraft}
            onVoiceEdit={onVoiceEdit}
            listening={listening}
            surface="assistant"
          />
        ) : null}
        {message.actions?.map((a) => (
          <View
            key={a.id}
            className="flex-row items-center gap-2.5 rounded-2xl border border-ink-line bg-white px-3.5 py-2.5"
          >
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[13px] text-ink">{a.label}</Text>
              {a.detail ? (
                <Text className="font-sans-sb text-[12px] text-ink-mute">
                  {a.detail}
                </Text>
              ) : null}
            </View>
            <CheckIcon size={16} color={c.inkMute} strokeWidth={3} />
          </View>
        ))}
      </View>
    </View>
  );
}
