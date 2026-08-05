// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 3 of Create event: pick a cover (Photo or Emoji) and build Assignments.
// Photo can have banner text over it. Emoji uses the keyboard and a vibrant
// background color. You can clear the emoji. Cover preview is always tappable.
//
// MEDIA EXCEPTION: Bridger is capture-only everywhere except two spots — the
// profile photo and this event cover. That is on purpose (see EVENTS.md).
// ============================================
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ImageIcon, PlusIcon } from 'lucide-react-native';
import type { Cover, EventAssignment } from '@bridger/shared';
import { CREATE_EVENT, trackProduct } from '@bridger/shared';
import { CoverArt, TextField, cn, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { personById } from '../../../data/people';
import { AssignmentRow } from './AssignmentRow';
import type { CreateEventDraft } from './types';

type CoverMode = 'photo' | 'emoji';

// Loud banner colors for emoji covers.
const VIBRANT_COLORS = [
  '#FF4D6D',
  '#FF8C42',
  '#FFD23F',
  '#6BCB77',
  '#4D96FF',
  '#9B5DE5',
  '#F15BB5',
  '#00BBF9',
  '#FEE440',
  '#00F5D4'
];

const DEMO_PHOTO_URL = 'https://picsum.photos/seed/bridger-event/1200/675';

const MODES: { id: CoverMode; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'emoji', label: 'Emoji' }
];

let assignmentSeq = 0;

function modeFromCover(cover?: Cover): CoverMode {
  if (cover?.kind === 'emoji') return 'emoji';
  return 'photo';
}

export function ExtrasStep({
  draft,
  onChange
}: {
  draft: CreateEventDraft;
  onChange: (patch: Partial<CreateEventDraft>) => void;
}) {
  const c = useThemeColors();
  const [newItem, setNewItem] = useState('');
  const [mode, setMode] = useState<CoverMode>(() => modeFromCover(draft.cover));
  const [emojiDraft, setEmojiDraft] = useState(
    draft.cover?.kind === 'emoji' ? draft.cover.value : ''
  );
  const [bannerText, setBannerText] = useState(
    draft.cover?.kind === 'photo' ? draft.cover.bannerText ?? '' : draft.title || ''
  );
  const [bg, setBg] = useState(() => {
    if (draft.cover?.kind === 'emoji' && draft.cover.bg) return draft.cover.bg;
    return VIBRANT_COLORS[5];
  });

  const photoUrl =
    draft.cover?.kind === 'photo' ? draft.cover.url : DEMO_PHOTO_URL;

  // Who can be assigned: you (the host) plus everyone invited.
  const candidates = useMemo(
    () => [personById('me'), ...draft.invitedIds.map(personById)],
    [draft.invitedIds]
  );

  function setCover(cover?: Cover) {
    onChange({ cover });
  }

  function pickMode(next: CoverMode) {
    setMode(next);
    if (next === 'photo') {
      setCover({
        kind: 'photo',
        url: photoUrl,
        bannerText: bannerText.trim() || undefined
      });
    } else {
      setCover({
        kind: 'emoji',
        value: emojiDraft,
        bg
      });
    }
  }

  function pickBg(hex: string) {
    setBg(hex);
    if (mode === 'emoji') {
      setCover({ kind: 'emoji', value: emojiDraft, bg: hex });
    }
  }

  function updatePhotoBanner(text: string) {
    setBannerText(text);
    setCover({
      kind: 'photo',
      url: photoUrl,
      bannerText: text.trim() || undefined
    });
  }

  function updateEmoji(raw: string) {
    // Allow clearing completely — do not force a default emoji back in.
    setEmojiDraft(raw);
    setCover({ kind: 'emoji', value: raw, bg });
  }

  function addItem() {
    const label = newItem.trim();
    if (!label) return;
    assignmentSeq += 1;
    const item: EventAssignment = { id: `a-${Date.now()}-${assignmentSeq}`, label };
    onChange({ assignments: [...draft.assignments, item] });
    setNewItem('');
    trackProduct('event_assignment_added');
  }

  function assign(id: string, personId?: string) {
    onChange({
      assignments: draft.assignments.map((a) =>
        a.id === id ? { ...a, assigneeId: personId } : a
      )
    });
    if (personId) trackProduct('event_assignment_taken');
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View className="gap-5 pb-8">
        {/* --- COVER: Photo or Emoji only --- */}
        <View>
          <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Cover</Text>

          <View className="mb-3 flex-row flex-wrap gap-2">
            {MODES.map((m) => {
              const on = mode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={withAnalyticsPress(CREATE_EVENT.extras.cover_mode, () => pickMode(m.id))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Cover ${m.label}`}
                  className={cn(
                    'min-h-[36px] justify-center rounded-full border px-3.5',
                    on ? 'border-ink bg-ink' : 'border-ink-line bg-surface'
                  )}
                >
                  <Text className={cn('font-sans-b text-[12px]', on ? 'text-canvas' : 'text-ink')}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Preview — always tappable to change photo / refresh */}
          <Pressable
            onPress={withAnalyticsPress(CREATE_EVENT.extras.add_cover, () => {
              if (mode === 'photo') {
                setCover({
                  kind: 'photo',
                  url: `${DEMO_PHOTO_URL}?t=${Date.now()}`,
                  bannerText: bannerText.trim() || undefined
                });
              } else {
                pickMode('emoji');
              }
            })}
            accessibilityRole="button"
            accessibilityLabel="Change cover"
            className="overflow-hidden rounded-card border border-ink-line"
            style={{ aspectRatio: 16 / 9 }}
          >
            {draft.cover ? (
              <CoverArt cover={draft.cover} rounded />
            ) : (
              <View className="h-full w-full items-center justify-center gap-2 bg-surface">
                <ImageIcon size={28} color={c.inkMute} strokeWidth={2.2} />
                <Text className="font-sans-b text-[13px] text-ink-soft">Tap to add a cover</Text>
              </View>
            )}
          </Pressable>

          {mode === 'photo' ? (
            <View className="mt-3 gap-2">
              <Text className="font-sans-md text-[11px] text-ink-mute">
                Best at 1200 x 675 (16:9). Tap the cover to change the photo.
              </Text>
              <TextField
                label="Banner text on photo"
                value={bannerText}
                onChange={updatePhotoBanner}
                placeholder={draft.title || 'Sketch night'}
                analyticsId={CREATE_EVENT.extras.cover_text}
              />
            </View>
          ) : null}

          {mode === 'emoji' ? (
            <View className="mt-3 gap-2">
              <TextField
                label="Emoji (use your keyboard)"
                value={emojiDraft}
                onChange={updateEmoji}
                placeholder="Type or paste an emoji"
                analyticsId={CREATE_EVENT.extras.cover_emoji}
              />
              <Text className="font-sans-md text-[11px] text-ink-mute">
                You can delete the emoji and pick a new one. Background color is below.
              </Text>
              <ColorSwatches selected={bg} onPick={pickBg} />
            </View>
          ) : null}
        </View>

        {/* --- ASSIGNMENTS --- */}
        <View>
          <Text className="font-sans-b text-[13px] text-ink">Assignments</Text>
          <Text className="mb-2.5 mt-0.5 font-sans-sb text-[12px] leading-snug text-ink-mute">
            Add items. Everyone can see the list. Only you can check off your own.
          </Text>

          <View className="flex-row items-end gap-2">
            <View className="min-w-0 flex-1">
              <TextField
                label="New item"
                value={newItem}
                onChange={setNewItem}
                placeholder="Chips, drinks, a chair..."
                analyticsId={CREATE_EVENT.extras.add_assignment}
                onSubmitEditing={addItem}
              />
            </View>
            <Pressable
              onPress={withAnalyticsPress(CREATE_EVENT.extras.add_assignment, addItem)}
              accessibilityRole="button"
              accessibilityLabel="Add assignment"
              className="mb-0.5 h-12 w-12 items-center justify-center rounded-full bg-purple active:opacity-90"
            >
              <PlusIcon size={20} color="#1C1B16" strokeWidth={2.8} />
            </Pressable>
          </View>

          <Pressable
            onPress={addItem}
            accessibilityRole="button"
            accessibilityLabel="Add item from text"
            className="mt-2 self-start"
          >
            <Text className="font-sans-b text-[12px] text-purple">+ Add item</Text>
          </Pressable>

          <View className="mt-3 gap-2.5">
            {draft.assignments.length === 0 ? (
              <Text className="font-sans-sb text-[13px] text-ink-mute">
                Nothing yet. Add an item above.
              </Text>
            ) : null}
            {draft.assignments.map((item) => (
              <AssignmentRow
                key={item.id}
                item={item}
                candidates={candidates}
                onAssign={(personId) => assign(item.id, personId)}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ColorSwatches({
  selected,
  onPick
}: {
  selected: string;
  onPick: (hex: string) => void;
}) {
  return (
    <View>
      <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">Background color</Text>
      <View className="flex-row flex-wrap gap-2">
        {VIBRANT_COLORS.map((hex) => {
          const on = selected === hex;
          return (
            <Pressable
              key={hex}
              onPress={withAnalyticsPress(CREATE_EVENT.extras.cover_color, () => onPick(hex))}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Color ${hex}`}
              className={cn(
                'h-10 w-10 rounded-full border-2',
                on ? 'border-ink' : 'border-transparent'
              )}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </View>
    </View>
  );
}
