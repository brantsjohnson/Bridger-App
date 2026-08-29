// ============================================
// WHAT THIS FILE DOES (plain English):
// About me under Top 5. Stays open like Spotify's About card: photo, name,
// city, and bio. The photo is their profile pic (or whatever they set). If
// the bio is long, "Rest of bio" expands the rest. Own profile gets an Edit
// control at the top that turns on reorder + a clear "Edit" label on each
// field (and the bio), plus Change photo on the picture. Friends never see
// those.
// ============================================
import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType
} from 'react-native';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon
} from 'lucide-react-native';
import type { AboutFieldView } from '@bridger/shared';
import { PROFILE, trackClick } from '@bridger/shared';
import { AnalyticsRegion, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import {
  PROFILE_META_GAP,
  PROFILE_SECTION_TITLE_SIZE,
  PROFILE_TITLE_TO_BODY
} from './profileSpacing';

/** Bios longer than this get a short preview + "Rest of bio". */
const BIO_PREVIEW_CHARS = 110;

export function AboutMeSection({
  name,
  city,
  bio,
  photo,
  emoji,
  fields,
  editable,
  onAdd,
  onEditField,
  onEditBio,
  onChangePhoto,
  onReorderFields
}: {
  name?: string;
  city?: string;
  bio?: string;
  photo?: ImageSourcePropType;
  emoji?: string;
  fields: AboutFieldView[];
  editable?: boolean;
  onAdd?: () => void;
  /** Open the fill flow / editor for one about-me field. */
  onEditField?: (field: AboutFieldView) => void;
  /** Open the fill flow / editor for the bio. */
  onEditBio?: () => void;
  /** Own edit mode: open Take / Upload to change this (profile) photo. */
  onChangePhoto?: () => void;
  /** Persist a new field order after the owner moves rows. */
  onReorderFields?: (next: AboutFieldView[]) => void;
}) {
  const c = useThemeColors();
  // Keep the details open by default (matches the About card design).
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ordered, setOrdered] = useState(fields);

  useEffect(() => {
    setOrdered(fields);
  }, [fields]);

  const count = fields.length + (bio ? 1 : 0);
  const bioText = bio?.trim() ?? '';
  const bioIsLong = bioText.length > BIO_PREVIEW_CHARS;
  const shownBio =
    bioIsLong && !bioExpanded
      ? `${bioText.slice(0, BIO_PREVIEW_CHARS).trimEnd()}…`
      : bioText;

  const moveField = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= ordered.length) return;
    const next = [...ordered];
    const tmp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = tmp;
    setOrdered(next);
    onReorderFields?.(next);
    trackClick(PROFILE.card.about_me_reorder, { method: dir < 0 ? 'up' : 'down' });
  };

  const emptyBody = !bio && ordered.length === 0 && !photo;
  // Own profile in Edit mode: tapping the picture opens Take / Upload.
  const canChangePhoto = Boolean(editable && onChangePhoto);

  return (
    <View>
      {/* THIS SECTION DOES: title + Edit (order / customize this block). */}
      <View className="mb-3 flex-row items-center justify-between gap-3">
        <Text
          className="min-w-0 flex-1 font-pixel text-ink"
          style={{ fontSize: PROFILE_SECTION_TITLE_SIZE }}
        >
          About me{count > 0 ? ` · ${count}` : ''}
        </Text>
        {editable ? (
          <Pressable
            onPress={withAnalyticsPress(PROFILE.card.about_me_edit, () => {
              setEditing((e) => {
                const next = !e;
                if (next) setDetailsOpen(true);
                return next;
              });
            })}
            accessibilityRole="button"
            accessibilityState={{ selected: editing }}
            accessibilityLabel={
              editing ? 'Done editing About me' : 'Edit About me order and fields'
            }
            className={`min-h-[36px] items-center justify-center rounded-full px-3.5 ${
              editing ? 'bg-ink' : 'border border-ink-line bg-surface'
            }`}
          >
            {/* text-canvas flips with theme so Done stays readable on cream ink in dark mode. */}
            <Text className={`font-sans-b text-[12px] ${editing ? 'text-canvas' : 'text-ink'}`}>
              {editing ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* THIS SECTION DOES: the open About card (photo, name, city, bio). */}
      <View className="overflow-hidden rounded-2xl border border-ink-line bg-canvas">
        {/* Profile pic (or their pick). In Edit mode, tap to change it. */}
        <Pressable
          disabled={!canChangePhoto}
          onPress={
            canChangePhoto
              ? withAnalyticsPress(PROFILE.card.about_me_photo, () => onChangePhoto?.(), {
                  analyticsProps: { method: 'edit' }
                })
              : undefined
          }
          accessibilityRole={canChangePhoto ? 'button' : 'image'}
          accessibilityLabel={
            canChangePhoto
              ? 'Change About me photo. Updates your profile photo.'
              : name
                ? `${name}'s photo`
                : 'About me photo'
          }
          className="aspect-[16/10] w-full bg-purple/15"
        >
          {photo ? (
            <Image source={photo} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-[56px]">{emoji ?? '🙂'}</Text>
            </View>
          )}
          {canChangePhoto ? (
            <View className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-3 py-1.5">
              <Text className="font-sans-b text-[11px] text-canvas">Change photo</Text>
            </View>
          ) : null}
        </Pressable>

        <View className="px-3.5 py-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              {name ? (
                <Text numberOfLines={1} className="font-sans-b text-[17px] text-ink">
                  {name}
                </Text>
              ) : null}
              {city ? (
                <View
                  className="flex-row items-center gap-1"
                  style={{ marginTop: name ? PROFILE_META_GAP : 0 }}
                >
                  <MapPinIcon size={13} color={c.inkMute} strokeWidth={2.4} />
                  <Text numberOfLines={1} className="font-sans-sb text-[13px] text-ink-mute">
                    {city}
                  </Text>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={withAnalyticsPress(PROFILE.card.about_me_toggle, () =>
                setDetailsOpen((o) => !o)
              )}
              accessibilityRole="button"
              accessibilityState={{ expanded: detailsOpen }}
              accessibilityLabel={
                detailsOpen ? 'Hide About me details' : 'Show About me details'
              }
              hitSlop={8}
              className="h-9 w-9 items-center justify-center"
            >
              {detailsOpen ? (
                <ChevronUpIcon size={18} color={c.ink} strokeWidth={2.4} />
              ) : (
                <ChevronDownIcon size={18} color={c.ink} strokeWidth={2.4} />
              )}
            </Pressable>
          </View>

          {bioText ? (
            <View className="mt-2">
              <Text className="font-sans-sb text-[14px] leading-snug text-ink">
                “{shownBio}”
              </Text>
              {bioIsLong && !bioExpanded ? (
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.card.about_me_bio_more, () =>
                    setBioExpanded(true)
                  )}
                  accessibilityRole="button"
                  accessibilityLabel="Rest of bio. Continue reading."
                  hitSlop={8}
                  className="mt-1.5 min-h-[36px] justify-center self-start"
                >
                  <Text className="font-sans-b text-[13px] text-purple">Rest of bio</Text>
                </Pressable>
              ) : null}
              {bioIsLong && bioExpanded ? (
                <Pressable
                  onPress={() => setBioExpanded(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Show less of bio"
                  hitSlop={8}
                  className="mt-1.5 min-h-[36px] justify-center self-start"
                >
                  <Text className="font-sans-b text-[13px] text-ink-mute">Show less</Text>
                </Pressable>
              ) : null}
              {editing ? (
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.card.about_me_field_edit, () =>
                    onEditBio?.()
                  )}
                  accessibilityRole="button"
                  accessibilityLabel="Edit bio"
                  className="mt-2 min-h-[36px] self-start items-center justify-center rounded-full border border-ink-line bg-surface px-3"
                >
                  <Text className="font-sans-b text-[12px] text-ink">Edit</Text>
                </Pressable>
              ) : null}
            </View>
          ) : emptyBody && editable ? (
            <Pressable
              onPress={withAnalyticsPress(PROFILE.card.add_details, () => onAdd?.())}
              accessibilityRole="button"
              accessibilityLabel="Add About me details"
              className="mt-2"
            >
              <Text className="font-sans-sb text-[13px] text-ink-mute">
                Add your About me details.
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* THIS SECTION DOES: the field list under the card (stays open by default). */}
      {detailsOpen ? (
        <AnalyticsRegion
          analyticsId={PROFILE.card.about_me}
          interactive={false}
          style={{ marginTop: PROFILE_TITLE_TO_BODY }}
        >
          {ordered.length === 0 ? (
            editable ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.add_details, () => onAdd?.())}
                accessibilityRole="button"
                accessibilityLabel="Add About me details"
                className="min-h-[44px] items-center justify-center rounded-card border border-dashed border-ink-line px-4 py-4"
              >
                <Text className="font-sans-b text-[14px] text-ink">Add details</Text>
              </Pressable>
            ) : (
              <Text className="font-sans-sb text-[14px] text-ink-mute">
                Nothing shared at this level.
              </Text>
            )
          ) : (
            <View className="gap-0">
              {ordered.map((f, i) => (
                <View
                  key={f.attributeId}
                  className={`flex-row items-start gap-3 py-2.5 ${
                    i > 0 ? 'border-t border-ink-line' : ''
                  }`}
                >
                  <Text className="w-[104px] shrink-0 font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                    {f.key}
                  </Text>
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-sb text-[14px] text-ink">{f.value}</Text>
                    {f.key.toLowerCase() === 'allergies' ? (
                      <Text className="mt-0.5 font-sans-sb text-[11px] text-ink-mute">
                        Only you can see this on events unless you share it wider.
                      </Text>
                    ) : null}
                    {/* Edit labels only appear after they tap Edit at the top. */}
                    {editing ? (
                      <View className="mt-2 flex-row flex-wrap items-center gap-2">
                        <Pressable
                          onPress={withAnalyticsPress(PROFILE.card.about_me_field_edit, () =>
                            onEditField?.(f)
                          )}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${f.key}`}
                          className="min-h-[36px] items-center justify-center rounded-full border border-ink-line bg-surface px-3"
                        >
                          <Text className="font-sans-b text-[12px] text-ink">Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => moveField(i, -1)}
                          disabled={i === 0}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${f.key} up`}
                          className="min-h-[36px] w-9 items-center justify-center rounded-full border border-ink-line bg-surface disabled:opacity-40"
                        >
                          <Text className="font-sans-b text-[13px] text-ink">↑</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => moveField(i, 1)}
                          disabled={i === ordered.length - 1}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${f.key} down`}
                          className="min-h-[36px] w-9 items-center justify-center rounded-full border border-ink-line bg-surface disabled:opacity-40"
                        >
                          <Text className="font-sans-b text-[13px] text-ink">↓</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
          {editing ? (
            <Text className="mt-3 font-sans-sb text-[12px] text-ink-mute">
              Use ↑ ↓ to change the order. Tap Edit on a row to change just that detail.
            </Text>
          ) : null}
        </AnalyticsRegion>
      ) : null}
    </View>
  );
}
