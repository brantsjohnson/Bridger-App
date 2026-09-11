// ============================================
// WHAT THIS FILE DOES (plain English):
// Edit → Photo look. A bottom sheet that lets you switch your profile photo
// among the four looks (Pop art / Comic / Sepia / X-ray) you first picked in
// onboarding. It previews the new look, then bakes + saves it so the header,
// About me, and every Avatar update together. The plain original stays on
// file so switching looks never needs a re-upload.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  View
} from 'react-native';
import { PROFILE, openSurface, dismissSurface, trackProduct } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import {
  PhotoFilterPicker,
  type PhotoFilterKey
} from '../onboarding/PhotoFilterPicker';
import { FilteredPhoto } from '../onboarding/photo-filters/FilteredPhoto';
import { isDemoMode } from '../../lib/demo';
import { bakeClientPhotoFilter } from '../../lib/client-photo-filters';
import { bakeServerPhotoFilter } from '../../lib/photo-filters';
// #region agent log
import { debugFilterEvent } from '../../lib/debug-instrumentation';
// #endregion
import { savePhoto } from '../../data/onboarding';

const FILTER_ANALYTICS: Record<PhotoFilterKey, string> = {
  pop_art: PROFILE.header.filter_pop_art,
  comic: PROFILE.header.filter_comic,
  sepia: PROFILE.header.filter_sepia,
  x_ray: PROFILE.header.filter_x_ray
};

const SURFACE = 'photo_look_sheet';

export function PhotoLookSheet({
  visible,
  onClose,
  onSaved,
  currentFilter,
  /** Filtered face currently shown on the profile (fallback preview). */
  avatarUrl,
  /** Unfiltered source used to bake a new look. Falls back to avatarUrl. */
  originalUrl,
  /** Tell the profile header to paint this look over the hero while picking. */
  onPreviewChange
}: {
  visible: boolean;
  onClose: () => void;
  /** Called after a look is saved so the profile can refresh. */
  onSaved?: () => void;
  currentFilter: PhotoFilterKey | null;
  avatarUrl: string | null;
  originalUrl: string | null;
  onPreviewChange?: (
    preview: {
      filter: PhotoFilterKey;
      bakedUrl: string | null;
      bakedLoading: boolean;
    } | null
  ) => void;
}) {
  // THIS SECTION DOES: start on the look they already have (or Pop art).
  const [filter, setFilter] = useState<PhotoFilterKey>(
    currentFilter ?? 'pop_art'
  );
  const [bakedUrl, setBakedUrl] = useState<string | null>(null);
  const [bakedLoading, setBakedLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bakedCache = useRef<
    Map<string, { url: string; mediaId: string; originalMediaId: string }>
  >(new Map());

  // Source to bake from: prefer the plain original, else the current avatar,
  // else the person-cache URL (same fallback the hero photo uses).
  const sourceUri =
    originalUrl?.trim() ||
    avatarUrl?.trim() ||
    null;

  // THIS SECTION DOES: reset the picker when the sheet opens.
  useEffect(() => {
    if (!visible) {
      onPreviewChange?.(null);
      return;
    }
    setFilter(currentFilter ?? 'pop_art');
    setBakedUrl(null);
    setError(null);
    setSaving(false);
    openSurface(SURFACE, 'profile');
  }, [visible, currentFilter, onPreviewChange]);

  // THIS SECTION DOES: keep the hero filter in sync with the picker + bake.
  useEffect(() => {
    if (!visible) return;
    onPreviewChange?.({
      filter,
      bakedUrl,
      bakedLoading
    });
  }, [visible, filter, bakedUrl, bakedLoading, onPreviewChange]);

  // THIS SECTION DOES: preview the picked look (same bake path as onboarding).
  useEffect(() => {
    if (!visible || !sourceUri) {
      setBakedUrl(null);
      setBakedLoading(false);
      return;
    }

    const cacheKey = `${sourceUri}:${filter}`;
    const cached = bakedCache.current.get(cacheKey);
    if (cached) {
      setBakedUrl(cached.url);
      setBakedLoading(false);
      return;
    }

    let cancelled = false;
    setBakedLoading(true);
    setBakedUrl(null);

    const finish = (
      url: string | null,
      mediaId: string | null,
      originalMediaId: string | null
    ) => {
      if (cancelled) return;
      if (url) {
        bakedCache.current.set(cacheKey, {
          url,
          mediaId: mediaId ?? '',
          originalMediaId: originalMediaId ?? ''
        });
        setBakedUrl(url);
      }
      setBakedLoading(false);
    };

    // #region agent log
    debugFilterEvent('bake start (PhotoLookSheet)', {
      filter,
      demo: isDemoMode(),
      platform: Platform.OS
    });
    // #endregion
    if (isDemoMode()) {
      if (Platform.OS !== 'web') {
        // #region agent log
        debugFilterEvent('native demo: no bake, plain photo kept', { filter });
        // #endregion
        finish(null, null, null);
        return;
      }
      bakeClientPhotoFilter(sourceUri, filter)
        .then((url) => finish(url, null, null))
        .catch(() => finish(null, null, null));
      return () => {
        cancelled = true;
      };
    }

    bakeServerPhotoFilter(sourceUri, filter)
      .then((res) => finish(res.url, res.mediaId, res.originalMediaId))
      .catch((err) => {
        if (__DEV__) console.warn('[photo-look] bake failed', filter, err);
        finish(null, null, null);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, sourceUri, filter]);

  // THIS SECTION DOES: save the baked look as the avatar everywhere.
  const onSave = async () => {
    if (!sourceUri || saving) return;
    setSaving(true);
    setError(null);
    try {
      const cacheKey = `${sourceUri}:${filter}`;
      let cached = bakedCache.current.get(cacheKey);

      if (!cached && !isDemoMode()) {
        const baked = await bakeServerPhotoFilter(sourceUri, filter);
        cached = {
          url: baked.url,
          mediaId: baked.mediaId,
          originalMediaId: baked.originalMediaId
        };
        bakedCache.current.set(cacheKey, cached);
      }

      if (isDemoMode()) {
        let preview = cached?.url ?? bakedUrl;
        if (!preview && Platform.OS === 'web') {
          preview = (await bakeClientPhotoFilter(sourceUri, filter)) ?? null;
        }
        await savePhoto({
          uri: preview ?? sourceUri,
          filter,
          originalUri: sourceUri
        });
      } else if (cached?.mediaId) {
        await savePhoto({
          filteredMediaId: cached.mediaId,
          originalMediaId: cached.originalMediaId || undefined,
          filter
        });
      } else {
        throw new Error('Could not bake that look. Try again.');
      }

      trackProduct('profile_photo_filter_updated', { filter });
      onSaved?.();
      dismissSurface(SURFACE);
      onClose();
    } catch (err) {
      console.warn('[photo-look] save failed', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save that look. Try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    dismissSurface(SURFACE);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={withAnalyticsPress(PROFILE.header.photo_look_dismiss, dismiss)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss photo look"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-3xl bg-surface px-4 pb-10 pt-4"
          accessibilityViewIsModal
        >
          <Text className="mb-1 font-pixel text-[18px] text-ink">Photo look</Text>
          <Text className="mb-4 font-sans-sb text-[13px] text-ink-mute">
            Pick one of the four looks. Your friends see this face everywhere.
          </Text>

          {/* THIS SECTION DOES: big preview of the look they are about to save. */}
          <View className="mb-4 aspect-square w-full overflow-hidden rounded-2xl bg-ink/10">
            {sourceUri ? (
              <FilteredPhoto
                uri={sourceUri}
                filter={filter}
                bakedUrl={bakedUrl}
                bakedLoading={bakedLoading}
                accessibilityLabel="Photo look preview"
              />
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
                accessibilityLabel="Current profile photo"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="font-sans-sb text-[14px] text-ink-mute">
                  Add a photo first
                </Text>
              </View>
            )}
          </View>

          <PhotoFilterPicker
            value={filter}
            onChange={setFilter}
            analyticsIds={FILTER_ANALYTICS}
          />

          {error ? (
            <Text className="mt-3 font-sans-sb text-[13px] text-coral">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={withAnalyticsPress(PROFILE.header.photo_look_save, () => {
              void onSave();
            })}
            disabled={!sourceUri || saving || bakedLoading}
            accessibilityRole="button"
            accessibilityLabel="Save photo look"
            accessibilityState={{ disabled: !sourceUri || saving || bakedLoading }}
            className="mt-5 min-h-[48px] items-center justify-center rounded-full bg-ink active:opacity-90 disabled:opacity-40"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-sans-b text-[15px] text-white">Save look</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
