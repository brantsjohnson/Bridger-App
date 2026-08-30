// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 1 of Create event: title (required), details, day/time (calendar +
// time list), one address field with live lookup, optional co-hosts, chip-in
// handle, and "let friends invite friends" with a guest cap.
//
// PAYMENT: chip-in is a plain handle only (Venmo / Cash App). Bridger never
// touches the money — guests pay the host directly.
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { CREATE_EVENT, FREE_BENEFITS } from '@bridger/shared';
import { Avatar, Chip, SearchField, TextField, Toggle, cn, withAnalyticsPress } from '@bridger/ui';
import { listPeople } from '../../../data/people';
import { AddressField } from './AddressField';
import { DatePickerChip, TimePickerChip } from './DateTimePickers';
import { RecurrenceFields } from './RecurrenceFields';
import type { CreateEventDraft } from './types';

const CHIP_METHODS = ['Venmo', 'Cash App', 'PayPal', 'Zelle', 'Cash in person'] as const;

/** Free Lite default; create screen passes the real membership max (35 or 100). */
const DEFAULT_GUEST_MAX = FREE_BENEFITS.eventGuestCap;

// THIS SECTION DOES: keep the typed guest cap inside what this plan allows
// (free 35 / co-op 100), so free hosts never send 36+ and never hit a server error.
function clampCap(n: number, max: number): number {
  if (!Number.isFinite(n)) return Math.min(DEFAULT_GUEST_MAX, max);
  return Math.min(max, Math.max(2, Math.round(n)));
}

/** Keep one leading $ on the amount — never $$ if they already typed it. */
function formatChipAmount(raw: string): string {
  const cleaned = raw.replace(/\$/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  return `$${cleaned}`;
}

/** Prefix @ for Venmo/PayPal/Zelle, $ for Cash App — never double the prefix. */
function formatChipHandle(raw: string, method: string): string {
  const body = raw.replace(/^[@$]+/, '').trim();
  if (!body) return '';
  if (method === 'Cash App') return `$${body}`;
  return `@${body}`;
}

export function DetailsStep({
  draft,
  onChange,
  maxGuestCap = DEFAULT_GUEST_MAX
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
  /** Membership guest ceiling: Free Lite 35, co-op 100. */
  maxGuestCap?: number;
}) {
  const [coHostQuery, setCoHostQuery] = useState('');
  // Hard ceiling for this host's plan (never let free type past 35).
  const guestMax = Math.max(2, Math.min(100, Math.round(maxGuestCap)));

  // Only friends / close friends can be a co-host (not acquaintances).
  const coHostOptions = useMemo(() => {
    const base = listPeople().filter((p) => p.tier === 'friend' || p.tier === 'close');
    const q = coHostQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((p) => p.name.toLowerCase().includes(q));
  }, [coHostQuery]);

  const needsHandle =
    draft.chipInEnabled && !!draft.chipInMethod && draft.chipInMethod !== 'Cash in person';
  const handlePlaceholder =
    draft.chipInMethod === 'Cash App' ? '$cashtag' : '@username';

  function toggleCoHost(id: string) {
    const has = draft.coHostIds.includes(id);
    onChange({
      coHostIds: has ? draft.coHostIds.filter((x) => x !== id) : [...draft.coHostIds, id]
    });
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-4 pb-8">
        {/* --- TITLE: required (red asterisk on the label) --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">
            Event title<Text style={{ color: '#E24B4A' }}>*</Text>
          </Text>
          <TextField
            value={draft.title}
            onChange={(v) => onChange({ title: v })}
            placeholder="Sketch night"
            analyticsId={CREATE_EVENT.details.title}
            accessibilityLabel="Event title, required"
          />
        </View>

        <TextField
          label="Details"
          value={draft.bio}
          onChange={(v) => onChange({ bio: v })}
          placeholder="Pens, paper, no pressure."
          multiline
          analyticsId={CREATE_EVENT.details.bio}
        />

        {/* --- DAY + TIME: Google-Calendar style chips --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Day and time</Text>
          <View className="flex-row gap-2">
            <DatePickerChip
              dayIso={draft.dayIso}
              dayLabel={draft.day}
              onChange={(iso, label) => onChange({ dayIso: iso, day: label })}
            />
            <TimePickerChip time={draft.time} onChange={(t) => onChange({ time: t })} />
          </View>
        </View>

        {/* --- REPEATS: optional weekly / monthly / yearly rule --- */}
        <RecurrenceFields
          repeats={draft.repeats}
          recurrence={draft.recurrence}
          dayIso={draft.dayIso}
          onChange={onChange}
        />

        {/* --- ADDRESS: one field; place name fills from a suggestion --- */}
        <AddressField
          address={draft.address}
          onChangeAddress={(v) => onChange({ address: v })}
          onPickPlace={(place) => onChange({ place })}
        />

        {/* --- CO-HOSTS: toggle on, then search + multi-select friends --- */}
        <View className="rounded-card border border-ink-line bg-surface px-4 py-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink">Add co-hosts?</Text>
            <Toggle
              checked={draft.addCoHosts}
              onChange={(v) =>
                onChange({ addCoHosts: v, coHostIds: v ? draft.coHostIds : [] })
              }
              label="Add co-hosts"
              analyticsId={CREATE_EVENT.details.cohost_toggle}
            />
          </View>
          {draft.addCoHosts ? (
            <View className="mt-3 gap-2">
              <Text className="font-sans-md text-[11px] text-ink-mute">
                Co-hosts can edit the event, and people they know may show up as invite suggestions.
              </Text>
              <SearchField
                value={coHostQuery}
                onChange={setCoHostQuery}
                placeholder="Search friends"
                analyticsId={CREATE_EVENT.details.cohost_search}
              />
              <View className="gap-2">
                {coHostOptions.map((p) => {
                  const on = draft.coHostIds.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={withAnalyticsPress(CREATE_EVENT.details.cohost_row, () =>
                        toggleCoHost(p.id)
                      )}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Co-host ${p.name}`}
                      className={cn(
                        'min-h-[48px] flex-row items-center gap-3 rounded-card border px-3 py-2',
                        on ? 'border-purple bg-purple/15' : 'border-ink-line bg-canvas'
                      )}
                    >
                      <Avatar
                        name={p.name}
                        emoji={p.emoji}
                        accent={p.accent}
                        personId={p.id}
                        size="sm"
                      />
                      <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink">{p.name}</Text>
                      <View
                        className={cn(
                          'h-6 w-6 items-center justify-center rounded-full border',
                          on ? 'border-purple bg-purple' : 'border-ink-line'
                        )}
                      >
                        {on ? <CheckIcon size={14} color="#fff" strokeWidth={3} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        {/* PAYMENT: turn on chip-in, then amount + method + username. Never process money. */}
        <View className="rounded-card border border-ink-line bg-surface px-4 py-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[13px] text-ink">Chipping in?</Text>
              <Text className="mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
                Guests pay you directly. We never touch it.
              </Text>
            </View>
            <Toggle
              checked={draft.chipInEnabled}
              onChange={(v) =>
                onChange(
                  v
                    ? { chipInEnabled: true }
                    : {
                        chipInEnabled: false,
                        chipInAmount: '',
                        chipInMethod: '',
                        chipInHandle: ''
                      }
                )
              }
              label="Chipping in"
              analyticsId={CREATE_EVENT.details.chip_in_toggle}
            />
          </View>
          {draft.chipInEnabled ? (
            <View className="mt-3 gap-3">
              <TextField
                label="Amount per person"
                value={draft.chipInAmount}
                onChange={(v) => onChange({ chipInAmount: formatChipAmount(v) })}
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
                      onPress={() => {
                        const next = draft.chipInMethod === m ? '' : m;
                        onChange({
                          chipInMethod: next,
                          chipInHandle: next
                            ? formatChipHandle(draft.chipInHandle, next)
                            : ''
                        });
                      }}
                    />
                  ))}
                </View>
              </View>
              {needsHandle ? (
                <TextField
                  label="Your username"
                  value={draft.chipInHandle}
                  onChange={(v) =>
                    onChange({ chipInHandle: formatChipHandle(v, draft.chipInMethod) })
                  }
                  placeholder={handlePlaceholder}
                  analyticsId={CREATE_EVENT.details.chip_in_handle}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Let friends invite friends — opens second-degree invites + guest cap */}
        <View className="rounded-card border border-ink-line bg-surface px-4 py-3">
          <View className="flex-row items-center justify-between gap-3">
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
          {draft.allowFriendsToInvite ? (
            <View className="mt-3 gap-2">
              <Text className="font-sans-sb text-[12px] leading-snug text-ink-mute">
                Guests can bring someone you don't know yet.
              </Text>
              <TextField
                label="Guest cap"
                value={String(draft.guestCap)}
                onChange={(v) => {
                  const digits = v.replace(/[^0-9]/g, '');
                  if (!digits) {
                    onChange({ guestCap: Math.min(DEFAULT_GUEST_MAX, guestMax) });
                    return;
                  }
                  onChange({ guestCap: clampCap(Number(digits), guestMax) });
                }}
                placeholder={String(Math.min(DEFAULT_GUEST_MAX, guestMax))}
                analyticsId={CREATE_EVENT.details.guest_cap}
              />
              <Text className="font-sans-md text-[11px] text-ink-mute">
                {guestMax >= 100
                  ? 'Between 2 and 100 people.'
                  : `Between 2 and ${guestMax} people on Free Lite. Co-op hosts up to 100.`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
