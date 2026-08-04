// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 1 of Create event: the basics. Title, a short bio, the date and time
// (tap-to-pick, no keyboard needed), the place + address (with live address
// lookup), an optional co-host, what to bring, and an optional chip-in handle.
// Adding a co-host also opens their acquaintances to the invite list on step 2.
//
// PAYMENT: chip-in is a plain handle only (Venmo / Cash App). Bridger never
// touches the money — guests pay the host directly.
// ============================================
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { Avatar, Chip, TextField, Toggle, cn } from '@bridger/ui';
import { listPeople } from '../../../data/people';
import { AddressField } from './AddressField';
import type { CreateEventDraft } from './types';

const CHIP_METHODS = ['Venmo', 'Cash App', 'PayPal', 'Zelle', 'Cash in person'] as const;

// Build the next two weeks of dates so the host taps instead of typing.
function upcomingDays(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  for (let i = 0; i < 14; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ key: d.toISOString().slice(0, 10), label: fmt.format(d) });
  }
  return out;
}

// Times every 30 minutes, shown 07:00 through 23:30 (typical event window).
function timeSlots(): string[] {
  const out: string[] = [];
  for (let h = 7; h <= 23; h += 1) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
}

const DAYS = upcomingDays();
const TIMES = timeSlots();

export function DetailsStep({
  draft,
  onChange
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
}) {
  // Only friends / close friends can be a co-host (not acquaintances).
  const coHostOptions = listPeople().filter((p) => p.tier === 'friend' || p.tier === 'close');

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-4 pb-8">
        <TextField
          label="Title"
          value={draft.title}
          onChange={(v) => onChange({ title: v })}
          placeholder="Sketch night"
          analyticsId={CREATE_EVENT.details.title}
        />
        <TextField
          label="Bio"
          value={draft.bio}
          onChange={(v) => onChange({ bio: v })}
          placeholder="Pens, paper, no pressure."
          multiline
          analyticsId={CREATE_EVENT.details.bio}
        />

        {/* --- DATE: tap a day from the next two weeks --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {DAYS.map((d) => {
              const on = draft.day === d.label;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => onChange({ day: d.label })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={d.label}
                  className={cn(
                    'min-h-[44px] justify-center rounded-full border px-4',
                    on ? 'border-ink bg-ink' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text className={cn('font-sans-b text-[13px]', on ? 'text-white' : 'text-ink')}>
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* --- TIME: tap a 30-minute slot --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Time</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {TIMES.map((t) => {
              const on = draft.time === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => onChange({ time: t })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t}
                  className={cn(
                    'min-h-[44px] justify-center rounded-full border px-4',
                    on ? 'border-success bg-success' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text className={cn('font-sans-b text-[13px]', on ? 'text-white' : 'text-ink')}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <TextField
          label="Place"
          value={draft.place}
          onChange={(v) => onChange({ place: v })}
          placeholder="Rowan Park"
          analyticsId={CREATE_EVENT.details.place}
        />

        <AddressField
          address={draft.address}
          onChangeAddress={(v) => onChange({ address: v })}
          onPickPlace={(place) => onChange({ place: draft.place || place })}
        />

        {/* --- CO-HOST: pick one friend who can also edit the event --- */}
        <View>
          <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">Co-host (optional)</Text>
          <View className="flex-row flex-wrap gap-2">
            {coHostOptions.map((p) => {
              const on = draft.coHostId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onChange({ coHostId: on ? undefined : p.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Co-host ${p.name}`}
                  className={cn(
                    'min-h-[44px] flex-row items-center gap-2 rounded-full border py-1 pl-1 pr-3.5',
                    on ? 'border-purple bg-purple' : 'border-ink-line bg-surface'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="sm" />
                  <Text className={cn('font-sans-b text-[13px]', on ? 'text-white' : 'text-ink')}>
                    {p.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-1.5 font-sans-md text-[11px] text-ink-mute">
            A co-host can edit the event, and their acquaintances join your invite list.
          </Text>
        </View>

        <TextField
          label="Bring (optional)"
          value={draft.bring}
          onChange={(v) => onChange({ bring: v })}
          placeholder="A drink to share"
          analyticsId={CREATE_EVENT.details.bring}
        />

        {/* PAYMENT: handle only — Bridger never processes chip-in money */}
        <View className="rounded-card border border-ink-line bg-surface p-3.5">
          <Text className="font-sans-b text-[13px] text-ink">Chipping in (optional)</Text>
          <Text className="mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
            Guests pay you directly. We never touch it.
          </Text>
          <View className="mt-3 gap-3">
            <TextField
              label="Amount per person"
              value={draft.chipInAmount}
              onChange={(v) => onChange({ chipInAmount: v })}
              placeholder="$5"
              analyticsId={CREATE_EVENT.details.chip_in_amount}
            />
            <View>
              <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">How to send it</Text>
              <View className="flex-row flex-wrap gap-2">
                {CHIP_METHODS.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    accent="teal"
                    size="sm"
                    selected={draft.chipInMethod === m}
                    onPress={() => onChange({ chipInMethod: draft.chipInMethod === m ? '' : m })}
                  />
                ))}
              </View>
            </View>
            {draft.chipInMethod && draft.chipInMethod !== 'Cash in person' ? (
              <TextField
                label="Your handle"
                value={draft.chipInHandle}
                onChange={(v) => onChange({ chipInHandle: v })}
                placeholder="@you"
                analyticsId={CREATE_EVENT.details.chip_in_handle}
              />
            ) : null}
          </View>
        </View>

        {/* Let friends invite friends — opens the guest list to second-degree invites */}
        <View className="flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3">
          <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink">
            Let friends invite friends
          </Text>
          <Toggle
            checked={draft.allowFriendsToInvite}
            onChange={(v) => onChange({ allowFriendsToInvite: v })}
            label="Let friends invite friends"
            analyticsId={CREATE_EVENT.details.friends_invite_toggle}
          />
        </View>
      </View>
    </ScrollView>
  );
}
