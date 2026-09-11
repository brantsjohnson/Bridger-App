// ============================================
// WHAT THIS FILE DOES (plain English):
// Your private scratchpad on a friend's profile — notes, calendar dates, and
// soft "check in sometimes" nudges. Only you can see these; they never appear
// on their profile for anyone else. Lives under the Notes tab on person/[id].
// Magic Patterns: NotesReminders.
// Analytics: PROFILE.notes_reminders.*; outcomes friend_note_* (no note text).
// ACCESSIBILITY: selected pills use text-canvas on bg-ink so dark mode stays
// readable (white-on-cream used to vanish).
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import {
  BellIcon,
  CalendarHeartIcon,
  PlusIcon,
  StickyNoteIcon,
  TrashIcon
} from 'lucide-react-native';
import type { FriendNote, FriendNoteCadence } from '@bridger/shared';
import { PROFILE } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  PixelHeading,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  addFriendNote,
  cadenceLabel,
  deleteFriendNote,
  friendNoteDateLabel,
  listFriendNotes
} from '../../data/friend-notes';

const PURPLE = ACCENTS.purple.hex;

type Kind = FriendNote['kind'];

const KINDS: { key: Kind; label: string }[] = [
  { key: 'text', label: 'Note' },
  { key: 'date', label: 'Date' },
  { key: 'check_in', label: 'Check in' }
];

const CADENCES: FriendNoteCadence[] = ['week', 'biweek', 'month'];

export function NotesReminders({
  personId,
  pendingPersonId,
  firstName
}: {
  personId?: string;
  /** Card you made for someone who is not on Bridger yet. */
  pendingPersonId?: string;
  firstName: string;
}) {
  const c = useThemeColors();
  const [kind, setKind] = useState<Kind>('text');
  const [draft, setDraft] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [cadence, setCadence] = useState<FriendNoteCadence>('biweek');
  const [notes, setNotes] = useState<FriendNote[]>([]);

  // Load your private notes for this friend (or the card you made).
  useEffect(() => {
    void listFriendNotes({ personId, pendingPersonId }).then(setNotes);
  }, [personId, pendingPersonId]);

  const placeholder =
    kind === 'text'
      ? 'Little thing to remember…'
      : kind === 'date'
        ? 'Graduation'
        : 'Optional hint (ask about their job)';

  const add = async () => {
    const body = draft.trim();
    if (!body && kind !== 'check_in') return;
    // Check-in can use a default body if they only flip the toggle.
    const resolvedBody = body || (kind === 'check_in' ? 'Check in' : '');
    if (!resolvedBody) return;

    const created = await addFriendNote({
      personId,
      pendingPersonId,
      kind,
      body: resolvedBody,
      date: kind === 'date' ? draftDate.trim() || undefined : undefined,
      cadence: kind === 'check_in' ? cadence : undefined
    });
    setNotes((prev) => [created, ...prev]);
    setDraft('');
    setDraftDate('');
  };

  const remove = (note: FriendNote) => {
    Alert.alert('Delete this note?', 'Only you can see these. This removes it for good.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteFriendNote(note.id).then(() =>
            setNotes((prev) => prev.filter((n) => n.id !== note.id))
          );
        }
      }
    ]);
  };

  return (
    <View>
      <AnalyticsRegion
        analyticsId={PROFILE.notes_reminders.section_header}
        interactive={false}
        accessibilityLabel="Notes and reminders"
      >
        <PixelHeading size="sm">Notes & reminders</PixelHeading>
        {/* ink-soft (not mute) so the privacy line stays readable in dark mode */}
        <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
          On {firstName} · only you can see these
        </Text>
      </AnalyticsRegion>

      <View className="mt-3 rounded-card border border-ink-line bg-surface p-3">
        {/* Kind toggle: Note | Date | Check in */}
        <View className="flex-row gap-2">
          {KINDS.map((k) => {
            const on = kind === k.key;
            return (
              <Pressable
                key={k.key}
                onPress={withAnalyticsPress(PROFILE.notes_reminders.kind, () => setKind(k.key), {
                  analyticsProps: { kind: k.key }
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={k.label}
                className={cn(
                  'flex-1 items-center rounded-full px-2 py-2',
                  on ? 'bg-ink' : 'border border-ink-line'
                )}
              >
                {/*
                  text-canvas flips with the theme: dark text on cream ink in
                  dark mode, white on black ink in light mode.
                */}
                <Text
                  className={cn(
                    'font-sans-b text-[13px]',
                    on ? 'text-canvas' : 'text-ink-soft'
                  )}
                >
                  {k.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Cadence chips for check-in only */}
        {kind === 'check_in' ? (
          <View className="mt-2.5 flex-row flex-wrap gap-2">
            {CADENCES.map((cd) => {
              const on = cadence === cd;
              return (
                <Pressable
                  key={cd}
                  onPress={withAnalyticsPress(
                    PROFILE.notes_reminders.cadence,
                    () => setCadence(cd),
                    { analyticsProps: { cadence: cd } }
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={cadenceLabel(cd)}
                  className={cn(
                    'rounded-full px-3 py-1.5',
                    on ? 'bg-purple' : 'border border-ink-line'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[12px]',
                      on ? 'text-white' : 'text-ink-soft'
                    )}
                  >
                    {cadenceLabel(cd)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Optional calendar day for Date kind */}
        {kind === 'date' ? (
          <TextInput
            value={draftDate}
            onChangeText={setDraftDate}
            placeholder="YYYY-MM-DD or May 5"
            placeholderTextColor={c.inkSoft}
            accessibilityLabel="Date"
            className="mt-2.5 rounded-full border border-ink-line bg-canvas px-4 py-2.5 font-sans-sb text-[14px] text-ink"
          />
        ) : null}

        <View className="mt-2.5 flex-row items-center gap-2 rounded-full border border-ink-line bg-canvas py-1.5 pl-4 pr-1.5">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void add()}
            placeholder={placeholder}
            placeholderTextColor={c.inkSoft}
            accessibilityLabel={
              kind === 'text' ? 'New note' : kind === 'date' ? 'New date label' : 'Check-in hint'
            }
            className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink"
          />
          <Pressable
            onPress={withAnalyticsPress(PROFILE.notes_reminders.add, () => void add(), {
              analyticsProps: { kind }
            })}
            accessibilityRole="button"
            accessibilityLabel="Add note"
            className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink"
          >
            {/* canvas color so the + stays visible when ink flips in dark mode */}
            <PlusIcon size={16} color={c.canvas} strokeWidth={3} />
          </Pressable>
        </View>
      </View>

      <View className="mt-2.5 gap-2">
        {notes.map((n) => (
          <View
            key={n.id}
            className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
          >
            {n.kind === 'date' ? (
              <CalendarHeartIcon size={20} color={PURPLE} strokeWidth={2.4} />
            ) : n.kind === 'check_in' ? (
              <BellIcon size={20} color={PURPLE} strokeWidth={2.4} />
            ) : (
              <StickyNoteIcon size={20} color={c.inkSoft} strokeWidth={2.2} />
            )}
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[14px] text-ink" numberOfLines={1}>
                {n.body}
              </Text>
              {n.kind === 'date' ? (
                <Text className="font-sans-sb text-[12px] text-purple" numberOfLines={1}>
                  {friendNoteDateLabel(n) || n.date} · reminds you 1 week before + day of
                </Text>
              ) : null}
              {n.kind === 'check_in' && n.cadence ? (
                <Text className="font-sans-sb text-[12px] text-purple" numberOfLines={1}>
                  Nudges you {cadenceLabel(n.cadence).toLowerCase()} · only you
                </Text>
              ) : null}
            </View>
            {n.remind || n.kind === 'check_in' ? (
              <BellIcon size={16} color={PURPLE} strokeWidth={2.4} />
            ) : null}
            <Pressable
              onPress={withAnalyticsPress(PROFILE.notes_reminders.delete, () => remove(n), {
                analyticsProps: { kind: n.kind }
              })}
              accessibilityRole="button"
              accessibilityLabel="Delete note"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center"
            >
              <TrashIcon size={18} color={c.inkSoft} strokeWidth={2.2} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
