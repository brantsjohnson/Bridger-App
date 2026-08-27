// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows the real words Billy drafted (message bubble). You can edit, then
// Approve, which opens Bridger's composer / confirm path. Never claims "Sent"
// unless the parent reports a real outcome.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  CheckIcon,
  MicIcon,
  PencilIcon,
  SendIcon
} from 'lucide-react-native';
import { ASSISTANT, HOME } from '@bridger/shared';
import {
  AnalyticsRegion,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';

const SUCCESS_HEX = '#0F8A5F';
import type { AgentDraft } from './agent';
import { VoiceWave } from './VoiceWave';

export type DraftOutcome = 'idle' | 'handoff' | 'saved';

type Props = {
  draft: AgentDraft;
  /** Called when the user taps Approve (parent opens composer / Nest confirm). */
  onApprove?: (body: string) => void | Promise<void>;
  /** Optional voice-edit hook (parent may start listening). */
  onVoiceEdit?: () => void;
  listening?: boolean;
  /** Real outcome from parent. Never invent "Sent". */
  outcome?: DraftOutcome;
  surface?: 'home' | 'assistant';
};

export function DraftPreview({
  draft,
  onApprove,
  onVoiceEdit,
  listening = false,
  outcome = 'idle',
  surface = 'assistant'
}: Props) {
  const c = useThemeColors();
  const [body, setBody] = useState(draft.body);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const ids =
    surface === 'home'
      ? {
          body: HOME.assistant.body,
          edit: HOME.assistant.draft_edit,
          approve: HOME.assistant.draft_approve,
          voice: HOME.assistant.mic
        }
      : {
          body: ASSISTANT.draft.body,
          edit: ASSISTANT.draft.edit,
          approve: ASSISTANT.draft.approve,
          voice: ASSISTANT.draft.voice_edit
        };

  // THIS SECTION DOES: show a truthful receipt after approve, never a fake Sent.
  if (outcome === 'handoff' || outcome === 'saved') {
    return (
      <AnalyticsRegion
        analyticsId={
          surface === 'assistant' ? ASSISTANT.draft.outcome : HOME.assistant.body
        }
        interactive={false}
      >
        <View className="flex-row items-center gap-2.5 rounded-2xl border border-success/40 bg-[#E6F7F0] px-3.5 py-3">
          <CheckIcon size={16} color={SUCCESS_HEX} strokeWidth={3} />
          <Text className="flex-1 font-sans-b text-[13px] text-ink">
            {outcome === 'saved'
              ? 'Saved'
              : `Opened for you to send to ${draft.to}`}
          </Text>
        </View>
      </AnalyticsRegion>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-white">
      <View className="flex-row items-center justify-between gap-2 px-3.5 pt-3">
        <Text
          className="min-w-0 flex-1 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute"
          numberOfLines={1}
        >
          {draft.kind} to {draft.to}
        </Text>
        {!editing ? (
          <Pressable
            onPress={withAnalyticsPress(ids.edit, () => setEditing(true))}
            accessibilityRole="button"
            accessibilityLabel="Edit draft"
            className="min-h-[44px] flex-row items-center gap-1 px-1"
          >
            <PencilIcon size={12} color={c.inkMute} strokeWidth={2.8} />
            <Text className="font-sans-b text-[12px] text-ink-mute">Edit</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="px-3.5 pb-3 pt-2">
        {editing ? (
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            accessibilityLabel="Edit the message"
            className="min-h-[72px] w-full rounded-2xl rounded-br-md border border-ink bg-white px-3.5 py-2.5 font-sans-sb text-[14px] leading-snug text-ink"
          />
        ) : (
          <Pressable
            onPress={withAnalyticsPress(ids.edit, () => setEditing(true))}
            accessibilityRole="button"
            accessibilityLabel="Edit draft text"
          >
            <AnalyticsRegion analyticsId={ids.body} interactive={false}>
              <Text className="rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 font-sans-sb text-[14px] leading-snug text-white">
                {body}
              </Text>
            </AnalyticsRegion>
          </Pressable>
        )}
        {listening ? (
          <View className="mt-2 flex-row items-center gap-2">
            <VoiceWave size="sm" color="#1C1B16" hearing />
            <Text className="font-sans-b text-[12px] text-ink">
              Listening. Say what to change.
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2 border-t border-ink-line px-3.5 py-2.5">
        <Pressable
          onPress={withAnalyticsPress(ids.voice, () => onVoiceEdit?.())}
          accessibilityRole="button"
          accessibilityLabel="Change it by voice"
          accessibilityState={{ selected: listening }}
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full border',
            listening ? 'border-ink bg-ink' : 'border-ink-line bg-white'
          )}
        >
          <MicIcon
            size={16}
            color={listening ? '#FFFFFF' : c.ink}
            strokeWidth={2.6}
          />
        </Pressable>

        {editing ? (
          <Pressable
            onPress={withAnalyticsPress(ids.edit, () => setEditing(false))}
            accessibilityRole="button"
            accessibilityLabel="Save draft edits"
            className="h-11 flex-1 items-center justify-center rounded-full bg-ink px-3.5"
          >
            <Text className="font-sans-b text-[13px] text-white">Save</Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={busy || !onApprove}
            onPress={withAnalyticsPress(ids.approve, () => {
              void (async () => {
                if (!onApprove) return;
                setBusy(true);
                try {
                  await onApprove(body);
                } finally {
                  setBusy(false);
                }
              })();
            })}
            accessibilityRole="button"
            accessibilityLabel="Approve and open send"
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-ink px-3.5"
          >
            <SendIcon size={14} color="#FFFFFF" strokeWidth={2.8} />
            <Text className="font-sans-b text-[13px] text-white">
              {busy ? 'Opening…' : 'Approve and send'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
