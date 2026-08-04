// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 3 of Create event: the cover picture and the "who's bringing what"
// sign-up list. You can add a cover photo (recommended size shown so you can
// design one) or pick an emoji; if you skip it, we drop in a random emoji when
// the event is created. Below that, the host adds bring-items and guests get
// assigned to them from a dropdown.
//
// MEDIA EXCEPTION: Bridger is capture-only everywhere except two spots — the
// profile photo and this event cover. That is on purpose (see EVENTS.md).
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ImageIcon, PlusIcon } from 'lucide-react-native';
import type { Cover, EventAssignment } from '@bridger/shared';
import { CREATE_EVENT, trackProduct } from '@bridger/shared';
import { ButtonSecondary, CoverArt, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../../data/people';
import { AssignmentRow } from './AssignmentRow';
import type { CreateEventDraft } from './types';

// A few friendly emoji to offer as a cover when there is no photo.
const EMOJI_CHOICES = ['🎉', '✨', '🌿', '🍜', '🎧', '🎬', '🏔️', '☕️', '🎨', '🍕', '🌸', '🔥'];

// Demo-only stand-in for a real photo pick. The live app will open the system
// photo library via expo-image-picker (not installed yet — see plan flag).
const DEMO_PHOTO: Cover = { kind: 'photo', url: 'https://picsum.photos/seed/bridger-event/1200/675' };

let assignmentSeq = 0;

export function ExtrasStep({
  draft,
  onChange
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
}) {
  const c = useThemeColors();
  const [newItem, setNewItem] = useState('');

  // Who can be assigned an item: you (the host) plus everyone invited.
  const candidates = useMemo(
    () => [personById('me'), ...draft.invitedIds.map(personById)],
    [draft.invitedIds]
  );

  function setCover(cover?: Cover) {
    onChange({ cover });
  }

  function addItem() {
    const label = newItem.trim();
    if (!label) return;
    assignmentSeq += 1;
    const item: EventAssignment = { id: `a-${Date.now()}-${assignmentSeq}`, label };
    onChange({ assignments: [...draft.assignments, item] });
    setNewItem('');
    // Product outcome: a new bring-item exists (no label text — PRIVACY).
    trackProduct('event_assignment_added');
  }

  function updateItem(id: string, patch: Partial<EventAssignment>) {
    onChange({
      assignments: draft.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a))
    });
  }

  function assign(id: string, personId?: string) {
    updateItem(id, { assigneeId: personId });
    // A guest claimed (or was assigned) an item; assignee state changed.
    if (personId) trackProduct('event_assignment_taken');
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-5 pb-8">
        {/* --- COVER --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Cover</Text>

          {draft.cover ? (
            <View className="overflow-hidden rounded-card border border-ink-line" style={{ aspectRatio: 16 / 9 }}>
              <CoverArt cover={draft.cover} rounded />
            </View>
          ) : (
            <Pressable
              onPress={withAnalyticsPress(CREATE_EVENT.extras.add_cover, () => setCover(DEMO_PHOTO))}
              accessibilityRole="button"
              accessibilityLabel="Add a cover photo"
              className="items-center justify-center gap-2 rounded-card border-2 border-dashed border-ink-line bg-surface"
              style={{ aspectRatio: 16 / 9 }}
            >
              <ImageIcon size={28} color={c.inkMute} strokeWidth={2.2} />
              <Text className="font-sans-b text-[13px] text-ink-soft">Add a cover photo</Text>
              <Text className="font-sans-md text-[11px] text-ink-mute">Best at 1200 x 675 (16:9)</Text>
            </Pressable>
          )}

          <View className="mt-2 flex-row items-center gap-2">
            {draft.cover ? (
              <>
                <ButtonSecondary
                  size="sm"
                  tone="outline"
                  onPress={() => setCover(DEMO_PHOTO)}
                  analyticsId={CREATE_EVENT.extras.add_cover}
                  accessibilityLabel="Change photo"
                >
                  Change photo
                </ButtonSecondary>
                <ButtonSecondary
                  size="sm"
                  tone="ghost"
                  onPress={() => setCover(undefined)}
                  accessibilityLabel="Remove cover"
                >
                  Remove
                </ButtonSecondary>
              </>
            ) : null}
          </View>

          <Text className="mb-2 mt-3 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            Or pick an emoji
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {EMOJI_CHOICES.map((e) => {
              const on = draft.cover?.kind === 'emoji' && draft.cover.value === e;
              return (
                <Pressable
                  key={e}
                  onPress={withAnalyticsPress(CREATE_EVENT.extras.cover_emoji, () =>
                    setCover({ kind: 'emoji', value: e })
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Emoji cover ${e}`}
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-full border',
                    on ? 'border-purple bg-purple/15' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text className="text-[20px]">{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* --- ASSIGNMENTS (who's bringing what) --- */}
        <View>
          <Text className="font-sans-b text-[13px] text-ink">Who's bringing what</Text>
          <Text className="mb-2.5 mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
            Add things to bring. Guests can claim one, and get a reminder a day and 2 hours before.
          </Text>

          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1 flex-row items-center rounded-full border border-ink-line bg-canvas-raised px-4 h-11">
              <TextInput
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addItem}
                placeholder="Chips, drinks, a chair..."
                placeholderTextColor={c.inkMute}
                accessibilityLabel="New bring item"
                className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink"
                style={{ padding: 0 }}
              />
            </View>
            <Pressable
              onPress={withAnalyticsPress(CREATE_EVENT.extras.add_assignment, addItem)}
              accessibilityRole="button"
              accessibilityLabel="Add bring item"
              className="h-11 w-11 items-center justify-center rounded-full bg-purple active:opacity-90"
            >
              <PlusIcon size={20} color="#1C1B16" strokeWidth={2.8} />
            </Pressable>
          </View>

          <View className="mt-3 gap-2.5">
            {draft.assignments.length === 0 ? (
              <Text className="font-sans-sb text-[13px] text-ink-mute">
                Nothing to bring yet. Add an item above.
              </Text>
            ) : null}
            {draft.assignments.map((item) => (
              <AssignmentRow
                key={item.id}
                item={item}
                candidates={candidates}
                onAssign={(personId) => assign(item.id, personId)}
                onChangeHandle={(handle) => updateItem(item.id, { chipInHandle: handle })}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
