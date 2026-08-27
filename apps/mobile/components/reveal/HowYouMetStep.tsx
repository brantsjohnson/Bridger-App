// ============================================
// WHAT THIS FILE DOES (plain English):
// Reveal Screen 0 — "How did you two meet?" Asked once before anything private
// is shown. Pick just-met or already-know (required — each option shows a
// checkbox so it is obvious you need to choose). When one is picked, the whole
// row fills with color. "Just met" puts them in Acquaintances automatically.
// "Already know" optionally shows Close / Friends / Acquaintances buckets.
//
// Discover connects usually have no place to save (unless you also share an
// event). In that case a centered "Add a note - optional" tap opens a short
// box (no card around the label).
// In-person / QR keeps the "Record where you met" checkbox (default on).
//
// Colors are fixed (not theme tokens) so dark mode cannot flip this step into
// cream-on-cream. PRIVACY: place is neighborhood-scale only; note text never
// goes into analytics.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CheckIcon, ChevronDownIcon, HandshakeIcon, MapPinIcon, UsersIcon } from 'lucide-react-native';
import { REVEAL, TIER_LABEL, trackUi, type MeetContext, type Tier } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { ROSTER_TIERS } from '../../data/friends';
import { NEARBY_AREA } from '../../data/reveal';

/** Fixed reveal palette — stays readable when the app is in dark mode. */
const ON_DARK = '#F5F0E6';
const ON_DARK_SOFT = 'rgba(245, 240, 230, 0.72)';
const ON_DARK_MUTE = 'rgba(245, 240, 230, 0.55)';
const CARD_BORDER = 'rgba(245, 240, 230, 0.28)';
const CARD_FILL = 'rgba(245, 240, 230, 0.08)';
const PLACE_INK = '#1C1B16';

/** How many characters they can put in a how-you-met note. */
const NOTE_MAX = 80;

/**
 * Bright fill for each meet choice when selected. Whole container colors in so
 * the pick is unmistakable — not just a thin border.
 */
const CHOICE_FILL: Record<MeetContext, string> = {
  'just-met': '#00A676',
  'already-know': '#6B2FEA'
};

/** Bright fills for the optional tier buckets (same family as story rings). */
const TIER_FILL: Record<'close' | 'friend' | 'acquaintance', string> = {
  close: '#2FA85B',
  friend: '#1D6FE8',
  acquaintance: '#F2560E'
};

type Props = {
  context: MeetContext | null;
  onContext: (c: MeetContext) => void;
  /** Optional circle when they already know each other. Null = skip / default. */
  tier: Tier | null;
  onTier: (t: Tier | null) => void;
  recordPlace: boolean;
  onRecordPlace: (v: boolean) => void;
  /** Short freeform how-you-met note (Discover path). Never logged. */
  meetNote: string;
  onMeetNote: (v: string) => void;
  /**
   * True when this connect came through Discover (a mutual friend). Those
   * usually have no place to record, so we offer a note instead.
   */
  viaDiscover: boolean;
};

export function HowYouMetStep({
  context,
  onContext,
  tier,
  onTier,
  recordPlace,
  onRecordPlace,
  meetNote,
  onMeetNote,
  viaDiscover
}: Props) {
  const noteRef = useRef<TextInput>(null);
  const [noteOpen, setNoteOpen] = useState(meetNote.trim().length > 0);

  useEffect(() => {
    if (!noteOpen) return;
    const t = setTimeout(() => noteRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [noteOpen]);

  const options: Array<{
    value: MeetContext;
    label: string;
    Icon: typeof HandshakeIcon;
  }> = [
    { value: 'just-met', label: 'We just met', Icon: HandshakeIcon },
    {
      value: 'already-know',
      label: 'We already know each other',
      Icon: UsersIcon
    }
  ];

  return (
    <View className="gap-3">
      {options.map(({ value, label, Icon }) => {
        const selected = context === value;
        const fill = CHOICE_FILL[value];
        return (
          <Pressable
            key={value}
            onPress={withAnalyticsPress(
              REVEAL.flow.how_you_met_choice,
              () => {
                onContext(value);
                // Just-met always lands in Acquaintances — clear any optional pick.
                if (value === 'just-met') onTier(null);
              },
              { analyticsProps: { method: value } }
            )}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${label}. ${selected ? 'Selected' : 'Not selected'}`}
            className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border-2 px-4 py-4"
            style={{
              borderColor: selected ? fill : CARD_BORDER,
              backgroundColor: selected ? fill : CARD_FILL
            }}
          >
            <Icon
              size={20}
              color={selected ? '#FFFFFF' : ON_DARK_SOFT}
              strokeWidth={2.4}
            />
            <Text
              className="min-w-0 flex-1 font-sans-b text-[15px]"
              style={{ color: selected ? '#FFFFFF' : ON_DARK_SOFT }}
            >
              {label}
            </Text>
            {/*
              Empty box when unselected = "you need to pick one".
              Filled check when selected = done.
            */}
            <View
              accessible={false}
              className="h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
              style={{
                borderColor: selected ? '#FFFFFF' : 'rgba(245, 240, 230, 0.55)',
                backgroundColor: selected ? '#FFFFFF' : 'transparent'
              }}
            >
              {selected ? (
                <CheckIcon size={16} color={fill} strokeWidth={3.2} />
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {/*
        --- OPTIONAL CIRCLE (already-know only) ---
        Just-met skips this and goes straight to Acquaintances. Already-know
        can pick Close / Friends / Acquaintances, or skip and we default later.
      */}
      {context === 'already-know' ? (
        <View className="gap-2 rounded-2xl border p-4" style={{ borderColor: CARD_BORDER }}>
          <Text className="font-sans-b text-[15px]" style={{ color: ON_DARK }}>
            Want to add them to a circle?
          </Text>
          <Text className="font-sans-md text-[12px]" style={{ color: ON_DARK_MUTE }}>
            Optional · Close, Friends, or Acquaintances
          </Text>
          <View className="mt-1 gap-2">
            {ROSTER_TIERS.map((t) => {
              const selected = tier === t;
              // ROSTER_TIERS is only the three circles — never "none".
              const fill = TIER_FILL[t as keyof typeof TIER_FILL];
              return (
                <Pressable
                  key={t}
                  onPress={withAnalyticsPress(
                    REVEAL.flow.tier_choice,
                    () => onTier(selected ? null : t),
                    { analyticsProps: { to_tier: t } }
                  )}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Add to ${TIER_LABEL[t]}`}
                  className="min-h-[48px] flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3"
                  style={{
                    borderColor: selected ? fill : CARD_BORDER,
                    backgroundColor: selected ? fill : CARD_FILL
                  }}
                >
                  <Text
                    className="min-w-0 flex-1 font-sans-b text-[15px]"
                    style={{ color: selected ? '#FFFFFF' : ON_DARK_SOFT }}
                  >
                    {TIER_LABEL[t]}
                  </Text>
                  <View
                    accessible={false}
                    className="h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
                    style={{
                      borderColor: selected ? '#FFFFFF' : 'rgba(245, 240, 230, 0.55)',
                      backgroundColor: selected ? '#FFFFFF' : 'transparent'
                    }}
                  >
                    {selected ? (
                      <CheckIcon size={16} color={fill} strokeWidth={3.2} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/*
        --- MEMORY: place (in person) or note (Discover) ---
        Discover usually has no coarse place. Offer a short note instead.
        In-person / QR keeps the place checkbox.
      */}
      {viaDiscover ? (
        <View className="items-center pt-1">
          {/* THIS SECTION DOES: a centered tap opens the note. No box around the label. */}
          <Pressable
            onPress={withAnalyticsPress(REVEAL.flow.meet_note_toggle, () =>
              setNoteOpen((v) => !v)
            )}
            accessibilityRole="button"
            accessibilityState={{ expanded: noteOpen }}
            accessibilityLabel="Add a note, optional"
            className="min-h-[44px] flex-row items-center justify-center gap-1.5 px-2"
          >
            <Text className="text-center font-sans-b text-[15px]" style={{ color: ON_DARK }}>
              Add a note - optional
            </Text>
            <ChevronDownIcon
              size={18}
              color={ON_DARK}
              strokeWidth={2.4}
              style={{ transform: [{ rotate: noteOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {noteOpen ? (
            <View className="mt-1 w-full">
              <TextInput
                ref={noteRef}
                value={meetNote}
                onChangeText={(t) => onMeetNote(t.slice(0, NOTE_MAX))}
                onBlur={() => {
                  // Analytics: they left a note — never the text itself.
                  if (meetNote.trim().length > 0) {
                    trackUi('click', REVEAL.flow.meet_note);
                  }
                }}
                placeholder="e.g. met through a hiking group"
                placeholderTextColor={ON_DARK_MUTE}
                maxLength={NOTE_MAX}
                accessibilityLabel="How you met note"
                className="min-h-[48px] rounded-2xl border px-3.5 py-3 font-sans-sb text-[14px]"
                style={{
                  borderColor: CARD_BORDER,
                  color: ON_DARK,
                  backgroundColor: 'rgba(245, 240, 230, 0.06)'
                }}
              />
              <Text
                className="mt-1.5 text-right font-sans-md text-[11px]"
                style={{ color: ON_DARK_MUTE }}
              >
                {meetNote.length}/{NOTE_MAX}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View
          className="rounded-2xl border p-4"
          style={{ borderColor: CARD_BORDER, backgroundColor: CARD_FILL }}
        >
          <Pressable
            onPress={withAnalyticsPress(REVEAL.flow.record_place_toggle, () =>
              onRecordPlace(!recordPlace)
            )}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: recordPlace }}
            accessibilityLabel="Record where you met"
            className="min-h-[44px] flex-row items-center gap-3"
          >
            <View
              className={cn(
                'h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                recordPlace ? 'border-success bg-success' : ''
              )}
              style={recordPlace ? undefined : { borderColor: 'rgba(245, 240, 230, 0.45)' }}
            >
              {recordPlace ? (
                <CheckIcon size={16} color="#FFFFFF" strokeWidth={3.2} />
              ) : null}
            </View>
            <Text className="font-sans-b text-[15px]" style={{ color: ON_DARK }}>
              Record where you met
            </Text>
          </Pressable>

          {recordPlace ? (
            <View className="mt-3 flex-row items-center gap-2 rounded-2xl bg-teal px-3 py-2.5">
              <MapPinIcon size={16} color={PLACE_INK} strokeWidth={2.6} />
              <Text className="font-sans-sb text-[14px]" style={{ color: PLACE_INK }}>
                {NEARBY_AREA} · approximate
              </Text>
            </View>
          ) : null}

          <Text className="mt-2.5 font-sans-md text-[12px]" style={{ color: ON_DARK_MUTE }}>
            Only you two see it · edit or remove anytime
          </Text>
        </View>
      )}
    </View>
  );
}
