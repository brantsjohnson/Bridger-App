// ============================================
// WHAT THIS FILE DOES (plain English):
// The create-event form sheet: title, when, where, optional chip-in
// handle, invite a few friends. Saves through createEvent() so demo and live
// use the same door. Chip-in is a text handle only — we never process money.
// Analytics: flow create_event; publish emits event_created (has_chip_in only —
// never title/bio/address text).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  trackFlowAbandoned,
  trackFlowCompleted,
  trackFlowStarted,
  trackFlowStep,
  trackProduct
} from '@bridger/shared';
import {
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Chip,
  Sheet,
  TextField,
  cn
} from '@bridger/ui';
import type { CreateEventInput } from '../data/events';
import { listPeople } from '../data/people';

const CAP = 35;
const CHIP_METHODS = ['Venmo', 'Cash App', 'PayPal', 'Zelle', 'Cash in person'] as const;

export function CreateEventSheet({
  open,
  onClose,
  onCreate
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateEventInput) => void | Promise<void>;
}) {
  const people = listPeople();
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [place, setPlace] = useState('');
  const [address, setAddress] = useState('');
  const [chipInHandle, setChipInHandle] = useState('');
  const [chipInAmount, setChipInAmount] = useState('');
  const [chipInMethod, setChipInMethod] = useState<string>('');
  const [friendsInvite, setFriendsInvite] = useState(true);
  const [invited, setInvited] = useState<string[]>(['maya', 'devon']);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef<number | null>(null);
  const lastStep = useRef('start');
  const completed = useRef(false);

  // Start the timed create_event flow when the sheet opens.
  useEffect(() => {
    if (!open) return;
    startedAt.current = Date.now();
    lastStep.current = 'start';
    completed.current = false;
    trackFlowStarted('create_event');
  }, [open]);

  function toggle(id: string) {
    setInvited((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    lastStep.current = 'invite';
    trackFlowStep('create_event', 'invite');
  }

  const overCap = invited.length > CAP;

  async function submit() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({
        title,
        bio,
        day: 'Fri 31 Jul',
        time: '18:30',
        place: place || 'TBD',
        address,
        invitedIds: invited,
        allowFriendsToInvite: friendsInvite,
        chipInAmount: chipInAmount || undefined,
        chipInMethod: (chipInMethod as CreateEventInput['chipInMethod']) || undefined,
        chipInHandle: chipInHandle || undefined
      });
      completed.current = true;
      const elapsed = startedAt.current != null ? Date.now() - startedAt.current : 0;
      trackFlowCompleted('create_event', elapsed, { flow_step: 'publish' });
      // Product outcome — booleans only, never title/bio/address content.
      trackProduct('event_created', {
        has_cohost: false,
        has_chip_in: Boolean(chipInAmount || chipInMethod)
      });
      onClose();
      setTitle('');
      setBio('');
      setPlace('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!completed.current && startedAt.current != null) {
          trackFlowAbandoned(
            'create_event',
            Date.now() - startedAt.current,
            lastStep.current
          );
        }
        onClose();
      }}
      title="Create event"
      footer={
        <ButtonPrimary
          full
          size="md"
          disabled={!title.trim() || saving}
          onPress={() => void submit()}
        >
          {overCap ? 'Guest list over 35 — co-op for up to 100' : 'Create'}
        </ButtonPrimary>
      }
    >
      {/* Scroll so lower fields stay reachable when the keyboard is open. */}
      <ScrollView
        className="max-h-[420px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View className="gap-3 pb-2">
        <TextField
          label="Title"
          value={title}
          onChange={(v) => {
            setTitle(v);
            if (lastStep.current === 'start') {
              lastStep.current = 'fields';
              trackFlowStep('create_event', 'fields');
            }
          }}
          placeholder="Sketch night"
        />
        <TextField
          label="Bio"
          value={bio}
          onChange={setBio}
          placeholder="Pens, paper, no pressure."
          multiline
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Date" value="Fri 31 Jul" onChange={() => undefined} />
          </View>
          <View className="flex-1">
            <TextField label="Time" value="18:30" onChange={() => undefined} />
          </View>
        </View>
        <TextField label="Place" value={place} onChange={setPlace} placeholder="Rowan Park" />
        <TextField
          label="Address"
          value={address}
          onChange={setAddress}
          placeholder="Street, unit, how to get in"
        />
        <Text className="-mt-1 font-sans-md text-[11px] text-ink-mute">
          Only people going or invited can see the address.
        </Text>

        {/* PAYMENT: handle only — Bridger never processes chip-in money */}
        <View className="rounded-card border border-ink-line bg-surface p-3.5">
          <Text className="font-sans-b text-[13px] text-ink">Chipping in (optional)</Text>
          <Text className="mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
            Guests pay you directly. We never touch it.
          </Text>
          <View className="mt-3 gap-3">
            <TextField
              label="Amount per person"
              value={chipInAmount}
              onChange={setChipInAmount}
              placeholder="$5"
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
                    selected={chipInMethod === m}
                    onPress={() => setChipInMethod(chipInMethod === m ? '' : m)}
                  />
                ))}
              </View>
            </View>
            {chipInMethod && chipInMethod !== 'Cash in person' ? (
              <TextField
                label="Your handle"
                value={chipInHandle}
                onChange={setChipInHandle}
                placeholder="@you"
              />
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => setFriendsInvite((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: friendsInvite }}
          className="flex-row items-center justify-between rounded-card border border-ink-line bg-surface px-4 py-3"
        >
          <Text className="flex-1 font-sans-b text-[13px] text-ink">
            Let friends invite friends
          </Text>
          <View
            className={cn(
              'h-7 w-12 justify-center rounded-full px-1',
              friendsInvite ? 'bg-teal' : 'bg-ink-line'
            )}
          >
            <View
              className={cn(
                'h-5 w-5 rounded-full bg-surface',
                friendsInvite ? 'self-end' : 'self-start'
              )}
            />
          </View>
        </Pressable>

        <View>
          <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">
            Invite ({invited.length}/{CAP})
          </Text>
          <View className="gap-2">
            {people.map((p) => {
              const on = invited.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggle(p.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  className={cn(
                    'flex-row items-center gap-3 rounded-card border px-3 py-2.5',
                    on ? 'border-purple/40 bg-[#F1ECFF]' : 'border-ink-line bg-surface'
                  )}
                >
                  <Avatar name={p.name} emoji={p.emoji} accent={p.accent} personId={p.id} size="sm" />
                  <Text className="flex-1 font-sans-b text-[14px] text-ink">{p.name}</Text>
                  <ButtonSecondary size="sm" tone={on ? 'solid' : 'outline'}>
                    {on ? 'Invited' : 'Invite'}
                  </ButtonSecondary>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      </ScrollView>
    </Sheet>
  );
}
