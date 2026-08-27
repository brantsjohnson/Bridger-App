// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows one fixed Bridger event template preview before you approve a Billy
// draft_event. Approve opens the real create-event screen with this prefill.
// Never claims the event was created until Bridger confirms.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ASSISTANT, HOME } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';

export type EventPreviewPrefill = {
  title?: string;
  whenLabel?: string;
  place?: string;
  notes?: string;
  [key: string]: unknown;
};

type Props = {
  prefill: EventPreviewPrefill;
  /** Called when the user taps Approve (parent confirms act / opens create). */
  onApprove?: () => void | Promise<void>;
  surface?: 'home' | 'assistant';
};

export function EventPreviewCard({
  prefill,
  onApprove,
  surface = 'assistant'
}: Props) {
  const [busy, setBusy] = React.useState(false);

  const title =
    typeof prefill.title === 'string' && prefill.title.trim()
      ? prefill.title.trim()
      : 'Untitled hang';
  const when =
    typeof prefill.whenLabel === 'string'
      ? prefill.whenLabel
      : typeof prefill.date === 'string'
        ? prefill.date
        : typeof prefill.startsAt === 'string'
          ? prefill.startsAt
          : 'Time TBD';
  const place =
    typeof prefill.place === 'string'
      ? prefill.place
      : typeof prefill.location === 'string'
        ? prefill.location
        : 'Place TBD';

  const ids =
    surface === 'home'
      ? {
          card: HOME.assistant.event_preview,
          approve: HOME.assistant.event_approve
        }
      : {
          card: ASSISTANT.event.body,
          approve: ASSISTANT.event.approve
        };

  return (
    <View className="mt-3 gap-2 rounded-xl border border-ink-line bg-white px-3 py-3">
      <AnalyticsRegion analyticsId={ids.card} interactive={false}>
        <Text className="font-sans-b text-[10px] uppercase tracking-widest text-ink-mute">
          Event draft
        </Text>
        <Text
          className="mt-1 font-sans-b text-[15px] text-ink"
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text className="mt-1 font-sans-sb text-[13px] text-ink-soft">{when}</Text>
        <Text className="font-sans-sb text-[13px] text-ink-soft">{place}</Text>
        {typeof prefill.notes === 'string' && prefill.notes.trim() ? (
          <Text
            className="mt-1 font-sans-sb text-[13px] text-ink-mute"
            numberOfLines={3}
          >
            {prefill.notes.trim()}
          </Text>
        ) : null}
      </AnalyticsRegion>

      {onApprove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Approve event draft and open create"
          disabled={busy}
          className="mt-2 min-h-[44px] items-center justify-center rounded-full bg-ink px-3 py-2"
          style={{ opacity: busy ? 0.6 : 1 }}
          onPress={withAnalyticsPress(ids.approve, async () => {
            setBusy(true);
            try {
              await onApprove();
            } finally {
              setBusy(false);
            }
          })}
        >
          <Text className="font-sans-b text-[13px] text-white">Approve</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
