// ============================================
// WHAT THIS FILE DOES (plain English):
// The About card on a profile. The front is their photo with their name, city,
// and bio written on it (the filled-in look from the profile redesign). Swipe,
// or tap "Swipe for more", to flip to the back where the details live
// (hometown, work, and the rest). "Swipe back" returns to the photo. Own
// profile can still edit those details and change the photo. Friends only see
// what that circle is allowed to see.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronsLeft, ChevronsRight, MapPinIcon, PencilIcon } from 'lucide-react-native';
import type { AboutFieldView } from '@bridger/shared';
import { PROFILE, trackClick } from '@bridger/shared';
import { AnalyticsRegion, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import { PROFILE_NAME_SIZE } from './profileSpacing';
import { ProfileAddCard } from './ProfileAddCard';

/** White type on the photo so it stays readable in light and dark mode. */
const ON_PHOTO = '#FFFFFF';

export function AboutMeSection({
  name,
  city,
  bio,
  photo,
  emoji,
  fields,
  editable,
  own,
  showEmptyCtas,
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
  /** Own profile can always edit/add/change photo, not only in Edit mode. */
  own?: boolean;
  /**
   * When false (friend view or View as Friends/Everyone), empty field lists
   * and "Add details" CTAs stay hidden. No "Nothing shared at this level."
   */
  showEmptyCtas?: boolean;
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
  // THIS SECTION DOES: fill / edit chrome only on your full own profile.
  const canEditContent = showEmptyCtas ?? Boolean(editable || own);
  const canChangePhoto = Boolean(canEditContent && onChangePhoto);
  const theme = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [ordered, setOrdered] = useState(fields);
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scroller = useRef<ScrollView>(null);
  // Skip a second event when a tap scroll also ends the momentum.
  const skipScrollTrack = useRef(false);

  useEffect(() => {
    setOrdered(fields);
  }, [fields]);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (alive) setReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const bioText = bio?.trim() ?? '';

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

  // THIS SECTION DOES: flip the card. Page 0 is the photo, page 1 is the details.
  const goTo = (next: number) => {
    setPage(next);
    skipScrollTrack.current = true;
    scroller.current?.scrollTo({ x: next * width, animated: !reduceMotion });
    trackClick(PROFILE.card.about_me_toggle, { page_index: next, method: 'tap' });
    setTimeout(() => {
      skipScrollTrack.current = false;
    }, reduceMotion ? 50 : 450);
  };

  const showBack = ordered.length > 0 || canEditContent || !!bioText;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          if (width <= 0) return;
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          if (skipScrollTrack.current) {
            skipScrollTrack.current = false;
            setPage(next);
            return;
          }
          if (next !== page) {
            setPage(next);
            trackClick(PROFILE.card.about_me_toggle, { page_index: next, method: 'swipe' });
          }
        }}
      >
        {/* THIS SECTION DOES: the photo face. Name, city, and bio sit on the picture. */}
        <View style={{ width: width || undefined }}>
          <View className="overflow-hidden rounded-3xl bg-ink" style={{ aspectRatio: 358 / 487 }}>
            {photo ? (
              <Image
                source={photo}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-purple/30">
                <Text className="text-[72px]">{emoji ?? '🙂'}</Text>
              </View>
            )}

            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.78)']}
              locations={[0, 0.4, 1]}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            {canChangePhoto ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.about_me_photo, () => onChangePhoto?.(), {
                  analyticsProps: { method: 'edit' }
                })}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                className="absolute right-3 top-3 min-h-[44px] items-center justify-center rounded-full bg-black/70 px-3"
              >
                <Text className="font-sans-b text-[13px]" style={{ color: ON_PHOTO }}>
                  Change photo
                </Text>
              </Pressable>
            ) : null}

            {canEditContent ? (
              <Pressable
                onPress={withAnalyticsPress(PROFILE.card.about_me_edit, () => {
                  setEditing(true);
                  if (showBack) goTo(1);
                })}
                accessibilityRole="button"
                accessibilityLabel="Edit About me"
                className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-black/55"
              >
                <PencilIcon size={18} color={ON_PHOTO} strokeWidth={2.4} />
              </Pressable>
            ) : null}

            <View className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ gap: 8 }}>
              {name ? (
                <Text
                  numberOfLines={1}
                  className="font-pixel"
                  style={{ color: ON_PHOTO, fontSize: PROFILE_NAME_SIZE }}
                >
                  {name}
                </Text>
              ) : null}
              {city ? (
                <View className="flex-row items-center gap-1">
                  <MapPinIcon size={14} color={ON_PHOTO} strokeWidth={2.4} />
                  <Text numberOfLines={1} className="font-sans-sb text-[14px]" style={{ color: ON_PHOTO }}>
                    {city}
                  </Text>
                </View>
              ) : null}
              {bioText ? (
                <Text className="font-sans text-[16px] leading-snug" style={{ color: ON_PHOTO }}>
                  “{bioText}”
                </Text>
              ) : canEditContent ? (
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.card.add_details, () => onAdd?.())}
                  accessibilityRole="button"
                  accessibilityLabel="Add a bio"
                >
                  <Text className="font-sans text-[16px]" style={{ color: ON_PHOTO }}>
                    Add a short bio.
                  </Text>
                </Pressable>
              ) : null}

              {showBack ? (
                <Pressable
                  onPress={() => goTo(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Swipe for more. Show About me details."
                  className="min-h-[44px] flex-row items-center gap-1 self-start"
                >
                  <Text className="font-sans-sb text-[13px]" style={{ color: ON_PHOTO }}>
                    Swipe for more
                  </Text>
                  <ChevronsLeft size={18} color={ON_PHOTO} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* THIS SECTION DOES: the back of the card. The details, plus Edit on your own profile. */}
        {showBack ? (
          <View style={{ width: width || undefined }}>
            <View className="min-h-[280px] rounded-3xl border border-ink-line bg-surface px-4 py-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable
                  onPress={() => goTo(0)}
                  accessibilityRole="button"
                  accessibilityLabel="Swipe back to the photo"
                  className="min-h-[44px] flex-row items-center gap-1"
                >
                  <ChevronsRight size={18} color={theme.ink} strokeWidth={2.4} />
                  <Text className="font-sans-sb text-[13px] text-ink">Swipe back</Text>
                </Pressable>
                {canEditContent ? (
                  <Pressable
                    onPress={withAnalyticsPress(PROFILE.card.about_me_edit, () =>
                      setEditing((on) => !on)
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected: editing }}
                    accessibilityLabel={editing ? 'Done editing About me' : 'Edit About me details'}
                    className={`min-h-[36px] items-center justify-center rounded-full px-3.5 ${
                      editing ? 'bg-ink' : 'border border-ink-line'
                    }`}
                  >
                    <Text className={`font-sans-b text-[13px] ${editing ? 'text-canvas' : 'text-ink'}`}>
                      {editing ? 'Done' : 'Edit'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {bioText && editing ? (
                <Pressable
                  onPress={withAnalyticsPress(PROFILE.card.about_me_field_edit, () => onEditBio?.())}
                  accessibilityRole="button"
                  accessibilityLabel="Edit bio"
                  className="mb-3 min-h-[44px] justify-center self-start rounded-full border border-ink-line px-3"
                >
                  <Text className="font-sans-b text-[13px] text-ink">Edit bio</Text>
                </Pressable>
              ) : null}

              <AnalyticsRegion analyticsId={PROFILE.card.about_me} interactive={false}>
                {ordered.length === 0 ? (
                  canEditContent ? (
                    <ProfileAddCard
                      label="Add details"
                      helper="Hometown, work, birthday."
                      emoji="🪪"
                      accent="blue"
                      analyticsId={PROFILE.card.add_details}
                      accessibilityLabel="Add About me details"
                      onPress={() => onAdd?.()}
                    />
                  ) : null
                ) : (
                  <View>
                    {ordered.map((f, i) => (
                      <View
                        key={f.attributeId}
                        className={`py-3 ${i > 0 ? 'border-t border-ink-line' : ''}`}
                      >
                        <Text className="font-sans-b text-[13px] uppercase tracking-wide text-ink-mute">
                          {f.key}
                        </Text>
                        <Text className="mt-1 font-sans text-[16px] text-ink">{f.value}</Text>
                        {f.key.toLowerCase() === 'allergies' ? (
                          <Text className="mt-1 font-sans-sb text-[13px] text-ink-mute">
                            Only you can see this on events unless you share it wider.
                          </Text>
                        ) : null}
                        {editing ? (
                          <View className="mt-2 flex-row flex-wrap items-center gap-2">
                            <Pressable
                              onPress={withAnalyticsPress(PROFILE.card.about_me_field_edit, () =>
                                onEditField?.(f)
                              )}
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${f.key}`}
                              className="min-h-[44px] items-center justify-center rounded-full border border-ink-line px-3"
                            >
                              <Text className="font-sans-b text-[13px] text-ink">Edit</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => moveField(i, -1)}
                              disabled={i === 0}
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${f.key} up`}
                              className="min-h-[44px] w-11 items-center justify-center rounded-full border border-ink-line disabled:opacity-40"
                            >
                              <Text className="font-sans-b text-[16px] text-ink">↑</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => moveField(i, 1)}
                              disabled={i === ordered.length - 1}
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${f.key} down`}
                              className="min-h-[44px] w-11 items-center justify-center rounded-full border border-ink-line disabled:opacity-40"
                            >
                              <Text className="font-sans-b text-[16px] text-ink">↓</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </AnalyticsRegion>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
