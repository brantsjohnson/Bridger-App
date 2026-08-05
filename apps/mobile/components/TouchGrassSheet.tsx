// ============================================
// WHAT THIS FILE DOES (plain English):
// The sheet that opens from Touch Grass: who to tell, when, optional note,
// then Send signal. Concentric groups only — no view counts.
// Analytics: own surface touch_grass_sheet; flow touch_grass_send; send emits
// touch_grass_sent with audience/when/has_why (never the free-text note).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  TOUCH_GRASS_SHEET,
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  ButtonSecondary,
  Sheet,
  TextField,
  cn,
  useSurfaceAct,
  withAnalyticsPress
} from '@bridger/ui';

const WHO = ['Close', 'Friends', 'Everyone'] as const;
const WHEN = ['Now', 'Tonight', 'This weekend'] as const;

const WHO_ID: Record<(typeof WHO)[number], string> = {
  Close: TOUCH_GRASS_SHEET.who.close,
  Friends: TOUCH_GRASS_SHEET.who.friends,
  Everyone: TOUCH_GRASS_SHEET.who.everyone
};

const WHEN_ID: Record<(typeof WHEN)[number], string> = {
  Now: TOUCH_GRASS_SHEET.when.now,
  Tonight: TOUCH_GRASS_SHEET.when.tonight,
  'This weekend': TOUCH_GRASS_SHEET.when.weekend
};

/** Map UI labels to product-event property values (no free text). */
const WHO_AUDIENCE: Record<(typeof WHO)[number], string> = {
  Close: 'close',
  Friends: 'friends',
  Everyone: 'everyone'
};

const WHEN_VALUE: Record<(typeof WHEN)[number], string> = {
  Now: 'now',
  Tonight: 'tonight',
  'This weekend': 'weekend'
};

export function TouchGrassSheet({
  open,
  onClose,
  onSend,
  parentScreen = 'events'
}: {
  open: boolean;
  onClose: () => void;
  onSend: (input: { who: string; when: string; note?: string }) => void;
  /** Screen that opened this sheet (events or home). */
  parentScreen?: string;
}) {
  const [who, setWho] = useState<(typeof WHO)[number]>('Friends');
  const [when, setWhen] = useState<(typeof WHEN)[number]>('Now');
  const [note, setNote] = useState('');
  const startedAt = useRef<number | null>(null);
  const lastStep = useRef('start');
  const completed = useRef(false);

  // Start the timed flow when the sheet opens.
  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    lastStep.current = 'start';
    completed.current = false;
    trackFlowStarted('touch_grass_send', { parent_screen: parentScreen });
  }, [open, parentScreen]);

  return (
    <Sheet
      open={open}
      onClose={() => {
        // Dismiss without send → abandoned flow + surface_dismissed from Sheet.
        if (!completed.current && startedAt.current != null) {
          trackFlowAbandoned(
            'touch_grass_send',
            Date.now() - startedAt.current,
            lastStep.current,
            { parent_screen: parentScreen }
          );
        }
        onClose();
      }}
      title="Touch grass"
      surface="touch_grass_sheet"
      parentScreen={parentScreen}
      dismissAnalyticsId={TOUCH_GRASS_SHEET.actions.dismiss}
      footer={
        <SendFooter
          who={who}
          when={when}
          note={note}
          parentScreen={parentScreen}
          startedAt={startedAt}
          completed={completed}
          onSend={onSend}
        />
      }
    >
      <View className="gap-4">
        <Segment
          label="Who to tell"
          options={[...WHO]}
          value={who}
          ids={WHO_ID}
          onChange={(v) => {
            setWho(v as (typeof WHO)[number]);
            lastStep.current = 'who';
            trackFlowStep('touch_grass_send', 'who', { parent_screen: parentScreen });
          }}
          tone="ink"
        />
        <Segment
          label="When"
          options={[...WHEN]}
          value={when}
          ids={WHEN_ID}
          onChange={(v) => {
            setWhen(v as (typeof WHEN)[number]);
            lastStep.current = 'when';
            trackFlowStep('touch_grass_send', 'when', { parent_screen: parentScreen });
          }}
          tone="green"
        />
        {/* short title that shows on the card — grab dinner, go on a walk, etc. */}
        {/* PRIVACY: we never put the note text into analytics — only has_why */}
        <TextField
          label="What do you want to do?"
          value={note}
          onChange={(v) => {
            setNote(v);
            if (lastStep.current !== 'why') {
              lastStep.current = 'why';
              trackFlowStep('touch_grass_send', 'why', { parent_screen: parentScreen });
            }
          }}
          placeholder="grab dinner, go on a walk…"
          analyticsId={TOUCH_GRASS_SHEET.why.input}
        />
      </View>
    </Sheet>
  );
}

/** Send button lives in the footer so it can mark the surface as acted. */
function SendFooter({
  who,
  when,
  note,
  parentScreen,
  startedAt,
  completed,
  onSend
}: {
  who: (typeof WHO)[number];
  when: (typeof WHEN)[number];
  note: string;
  parentScreen: string;
  startedAt: React.MutableRefObject<number | null>;
  completed: React.MutableRefObject<boolean>;
  onSend: (input: { who: string; when: string; note?: string }) => void;
}) {
  const { markActed } = useSurfaceAct();

  return (
    <ButtonSecondary
      full
      size="lg"
      tone="positive"
      analyticsId={TOUCH_GRASS_SHEET.actions.send}
      onPress={() => {
        completed.current = true;
        markActed();
        const elapsed = startedAt.current != null ? Date.now() - startedAt.current : 0;
        trackFlowCompleted('touch_grass_send', elapsed, { parent_screen: parentScreen });
        // Product outcome — audience/when/has_why only; never the free-text note.
        trackProduct('touch_grass_sent', {
          audience: WHO_AUDIENCE[who],
          when: WHEN_VALUE[when],
          has_why: note.trim().length > 0,
          parent_screen: parentScreen
        });
        onSend({ who, when, note: note.trim() || undefined });
      }}
    >
      Send signal
    </ButtonSecondary>
  );
}

function Segment({
  label,
  options,
  value,
  ids,
  onChange,
  tone
}: {
  label: string;
  options: string[];
  value: string;
  ids: Record<string, string>;
  onChange: (v: string) => void;
  tone: 'ink' | 'green';
}) {
  return (
    <View>
      <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable
              key={o}
              onPress={withAnalyticsPress(ids[o], () => onChange(o))}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o}
              className={cn(
                'flex-1 items-center rounded-full px-3 py-2.5',
                active
                  ? tone === 'ink'
                    ? 'bg-ink'
                    : 'bg-success'
                  : 'border border-ink-line bg-surface'
              )}
            >
              <Text
                className={cn(
                  'font-sans-b text-[13px]',
                  // ink fill flips light in dark mode — use canvas text there;
                  // success stay vivid green so white still contrasts.
                  active ? (tone === 'ink' ? 'text-canvas' : 'text-white') : 'text-ink'
                )}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
