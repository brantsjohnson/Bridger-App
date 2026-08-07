// ============================================
// WHAT THIS FILE DOES (plain English):
// The opt-in Assistant screen: a quiet chat that answers from your saved notes
// and proposes acts you must confirm. Only reachable after Settings opt-in.
// Supports text and short voice turns. Voice never auto-sends messages.
//
// TODO: replace with Magic Patterns component Assistant when designed.
// ============================================
import React, { useEffect, useState } from 'react';
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
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { ASSISTANT, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  assistantTurn,
  assistantVoiceTurn,
  cancelAssistantAct,
  closeAssistantSession,
  confirmAssistantAct,
  openAssistantSession,
  type AssistantProposal
} from '../../data/assistant';
import { addAssistantCalendarEntry } from '../../lib/assistant-calendar';

type Bubble = { id: string; role: 'user' | 'assistant'; text: string };

const LOW_RISK_TOOLS = new Set(['save_note', 'set_reminder', 'suggest_reconnect_nudge']);

export default function AssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entry?: string }>();
  const entry =
    params.entry === 'home' || params.entry === 'voice' ? params.entry : 'settings';
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);

  useEffect(() => {
    trackProduct('assistant_opened', { entry });
    let active = true;
    void (async () => {
      try {
        const id = await openAssistantSession();
        if (active) setSessionId(id);
      } catch {
        Alert.alert('Assistant unavailable', 'Turn it on in Settings, or try again later.');
        router.back();
      }
    })();
    return () => {
      active = false;
    };
  }, [router, entry]);

  useEffect(() => {
    return () => {
      if (sessionId) void closeAssistantSession(sessionId);
    };
  }, [sessionId]);

  // THIS SECTION DOES: apply a turn reply (text or voice) to the chat.
  function applyTurnResult(
    userText: string,
    reply: string,
    acts: AssistantProposal[]
  ) {
    setBubbles((b) => [
      ...b,
      { id: `u-${Date.now()}`, role: 'user', text: userText },
      { id: `a-${Date.now() + 1}`, role: 'assistant', text: reply }
    ]);
    setProposals(acts);
  }

  async function send() {
    if (!sessionId || !draft.trim() || busy) return;
    const text = draft.trim();
    setDraft('');
    setBusy(true);
    try {
      const res = await assistantTurn(sessionId, text);
      applyTurnResult(text, res.reply, res.proposedActs ?? []);
    } catch {
      setBubbles((b) => [
        ...b,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: "I couldn't answer just now. Try again in a moment."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  // THIS SECTION DOES: record a short voice question and send it for STT.
  async function toggleVoice() {
    if (!sessionId || busy) return;
    if (Platform.OS === 'web') {
      Alert.alert('Voice', 'Voice works in the phone app.');
      return;
    }

    if (recState.isRecording) {
      setBusy(true);
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('no recording');
        const audioBase64 = await readAsStringAsync(uri, {
          encoding: EncodingType.Base64
        });
        // Pending low-risk previews already on screen (for voice "yes").
        const pendingLowRisk = proposals.filter((p) => LOW_RISK_TOOLS.has(p.tool));
        const res = await assistantVoiceTurn(sessionId, audioBase64, 'voice.m4a');
        const transcript = (res.transcript ?? '').trim();
        const yes = /^(yes|yep|yeah|confirm|ok|okay)\.?$/i.test(transcript);

        // Voice "yes" confirms only one visible low-risk act; never draft_message.
        if (yes && pendingLowRisk.length === 1) {
          setBubbles((b) => [
            ...b,
            { id: `u-${Date.now()}`, role: 'user', text: transcript || 'yes' }
          ]);
          await onConfirm(pendingLowRisk[0]!);
          return;
        }

        const shown = transcript || '(voice)';
        applyTurnResult(shown, res.reply, res.proposedActs ?? []);
      } catch {
        Alert.alert('Voice', 'Could not send that recording. Try typing instead.');
      } finally {
        setBusy(false);
      }
      return;
    }

    const perm = await AudioModule.requestRecordingPermissionsAsync();
    trackProduct('permission_result', {
      permission: 'mic',
      outcome: perm.granted ? 'granted' : 'denied',
      context: 'assistant'
    });
    if (!perm.granted) {
      Alert.alert(
        'Microphone',
        'Without the mic, you can still type to the Assistant.'
      );
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function onConfirm(p: AssistantProposal) {
    try {
      const res = await confirmAssistantAct(p.id);
      setProposals((list) => list.filter((x) => x.id !== p.id));
      const handoff = res.handoff;
      if (handoff?.type === 'draft_message' && handoff.personId && handoff.draft) {
        // Prefer thread id = person id path used elsewhere when known.
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
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between border-b border-ink-line px-4 py-3">
        <AnalyticsRegion
          analyticsId={ASSISTANT.chat.header}
          interactive={false}
          className="flex-1"
        >
          <Text className="font-pixel text-[18px] text-ink">Assistant</Text>
          <Text className="font-sans text-[12px] text-ink-mute">
            From what you have saved
          </Text>
        </AnalyticsRegion>
        <Pressable
          onPress={withAnalyticsPress(ASSISTANT.chat.close, () => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Close Assistant"
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <Text className="font-sans-sb text-[14px] text-ink">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ paddingBottom: 16, gap: 10 }}
      >
        {bubbles.length === 0 ? (
          <AnalyticsRegion
            analyticsId={ASSISTANT.chat.empty_state}
            interactive={false}
          >
            <Text className="font-sans text-[14px] text-ink-mute">
              Ask about someone you have saved notes for. Example: what does
              Lindsey like?
            </Text>
          </AnalyticsRegion>
        ) : null}

        <AnalyticsRegion
          analyticsId={ASSISTANT.chat.transcript}
          interactive={false}
          className="gap-2.5"
        >
          {bubbles.map((b) => (
            <View
              key={b.id}
              className={cn(
                'max-w-[90%] rounded-2xl px-3.5 py-2.5',
                b.role === 'user'
                  ? 'self-end bg-ink'
                  : 'self-start border border-ink-line bg-canvas'
              )}
            >
              <Text
                className={cn(
                  'font-sans text-[14px]',
                  b.role === 'user' ? 'text-canvas' : 'text-ink'
                )}
              >
                {b.text}
              </Text>
            </View>
          ))}
        </AnalyticsRegion>

        {proposals.map((p) => (
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
              <ButtonPrimary
                analyticsId={ASSISTANT.proposal.confirm}
                onPress={() => void onConfirm(p)}
              >
                Confirm
              </ButtonPrimary>
              <ButtonSecondary
                analyticsId={ASSISTANT.proposal.cancel}
                onPress={() => void onCancel(p)}
              >
                Cancel
              </ButtonSecondary>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        className="flex-row items-end gap-2 border-t border-ink-line px-3 py-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <AnalyticsRegion
          analyticsId={ASSISTANT.chat.composer}
          interactive={false}
          className="min-h-[44px] flex-1"
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about a friend…"
            placeholderTextColor={c.inkMute}
            accessibilityLabel="Assistant message"
            multiline
            editable={!busy && !recState.isRecording}
            className="min-h-[44px] rounded-2xl border border-ink-line px-3 py-2 font-sans text-[14px] text-ink"
          />
        </AnalyticsRegion>
        <Pressable
          onPress={withAnalyticsPress(ASSISTANT.chat.voice, () => void toggleVoice())}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            recState.isRecording ? 'Stop and send voice' : 'Record voice question'
          }
          className={cn(
            'min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-ink-line px-3',
            recState.isRecording ? 'bg-coral' : 'bg-canvas'
          )}
        >
          <Text className="font-sans-sb text-[12px] text-ink">
            {recState.isRecording ? 'Stop' : 'Mic'}
          </Text>
        </Pressable>
        <Pressable
          onPress={withAnalyticsPress(ASSISTANT.chat.send, () => void send())}
          disabled={busy || !draft.trim() || recState.isRecording}
          accessibilityRole="button"
          accessibilityLabel="Send"
          className="min-h-[44px] min-w-[64px] items-center justify-center rounded-full bg-ink px-3"
        >
          <Text className="font-sans-sb text-[13px] text-canvas">
            {busy ? '…' : 'Send'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
